# Launch script for Carousel backend services only
# Starts backend microservices sequentially, validates readiness, and opens a single aggregated Swagger UI tab
# Uses service shortcuts from shortcuts.map for configuration

[CmdletBinding(PositionalBinding = $false)]
param(
    [switch]$Fast,
    [switch]$NoBrowser,
    [switch]$SkipGlobalHealth,
    [switch]$AutoStartPostgres,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs,
    [int]$HealthServicePort = 8004,
    [int]$StartupTimeoutSeconds = 120,
    [string]$Service
)

$ErrorActionPreference = "Stop"
$BackendVersion = "1.0.0"
$UseJarStartup = $Fast -or ($RemainingArgs -contains "--fast") -or ($args -contains "--fast")
$ShouldAutoStartPostgres = $AutoStartPostgres -or ($RemainingArgs -contains "--auto-start-postgres") -or ($args -contains "--auto-start-postgres")
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717

# Import service map helper
Import-Module -Name ".\ServiceMap.psm1" -Force

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Clear-EnvVarIfBlank([string]$name) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if ($null -ne $value -and [string]::IsNullOrWhiteSpace($value)) {
        Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue
    }
}

function Normalize-RoleServiceDbEnv() {
    Clear-EnvVarIfBlank "SPRING_DATASOURCE_URL"
    Clear-EnvVarIfBlank "SPRING_DATASOURCE_USERNAME"
    Clear-EnvVarIfBlank "SPRING_DATASOURCE_PASSWORD"
}

# Load service map
$ServiceMap = Get-ServiceMap ".\shortcuts.map"
if (-not $ServiceMap) {
    Write-ColorOutput "Red" "Failed to load service map"
    exit 1
}

function Test-TcpPortOpen([string]$hostName = "127.0.0.1", [int]$port, [int]$timeoutMs = 700) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $asyncResult = $client.BeginConnect($hostName, $port, $null, $null)
        if (-not $asyncResult.AsyncWaitHandle.WaitOne($timeoutMs, $false)) {
            return $false
        }

        $client.EndConnect($asyncResult)
        return $true
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Test-PortOpen($port) {
    return (Test-TcpPortOpen -port $port)
}

function Test-PostgresReady([int]$port = 5432) {
    return (Test-TcpPortOpen -port $port)
}

function Test-DockerEngineReady() {
    try {
        & docker info *> $null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

function Wait-DockerEngineReady([int]$timeoutSeconds = 120) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if (Test-DockerEngineReady) {
            return $true
        }

        Start-Sleep -Seconds 2
        $elapsed += 2
    }

    return $false
}

function Start-DockerEngineIfNeeded([int]$timeoutSeconds = 120) {
    if (Test-DockerEngineReady) {
        return $true
    }

    $dockerDesktopCandidates = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LocalAppData\Programs\Docker\Docker\Docker Desktop.exe"
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    $dockerDesktop = $dockerDesktopCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($dockerDesktop) {
        Write-ColorOutput "Yellow" "[i] Docker engine is not ready. Attempting to start Docker Desktop..."
        try {
            Start-Process -FilePath $dockerDesktop | Out-Null
        } catch {
            Write-ColorOutput "Yellow" "[i] Unable to launch Docker Desktop executable directly: $($_.Exception.Message)"
        }
    }

    try {
        $dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
        if ($dockerService -and $dockerService.Status -ne "Running") {
            Write-ColorOutput "Yellow" "[i] Starting Windows service com.docker.service..."
            Start-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
        }
    } catch {
    }

    if (Wait-DockerEngineReady $timeoutSeconds) {
        Write-ColorOutput "Green" "[+] Docker engine is ready"
        return $true
    }

    return $false
}

function Wait-PostgresReady([int]$port = 5432, [int]$timeoutSeconds = 45) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if (Test-PostgresReady $port) {
            return $true
        }

        Start-Sleep -Seconds 1
        $elapsed += 1
    }

    return $false
}

function Ensure-PostgresAvailableForRoleService([bool]$allowAutoStart) {
    if (Test-PostgresReady 5432) {
        return $true
    }

    if (-not $allowAutoStart) {
        Write-ColorOutput "Red" "[-] role-service requires PostgreSQL on localhost:5432, but it is not reachable."
        Write-ColorOutput "Yellow" "[i] Start PostgreSQL with: npm run postgres:start"
        Write-ColorOutput "Yellow" "[i] Or rerun with -AutoStartPostgres to let launcher auto-start it."
        return $false
    }

    $docker = Get-Command "docker" -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-ColorOutput "Red" "[-] role-service requires PostgreSQL on localhost:5432, and Docker is not available for auto-start."
        Write-ColorOutput "Yellow" "[i] Command to run once Docker is available: npm run postgres:start"
        Write-ColorOutput "Yellow" "[i] If using local PostgreSQL service instead, start it and rerun launch."
        return $false
    }

    if (-not (Start-DockerEngineIfNeeded 120)) {
        Write-ColorOutput "Red" "[-] Docker CLI is installed but Docker engine is not ready."
        Write-ColorOutput "Yellow" "[i] Start Docker Desktop (or Docker daemon), then rerun launch."
        Write-ColorOutput "Yellow" "[i] Quick check: docker info"
        return $false
    }

    Write-ColorOutput "Yellow" "[i] PostgreSQL not reachable. Attempting docker compose start for postgres..."
    try {
        & docker compose up -d postgres | Out-Null
    } catch {
        Write-ColorOutput "Red" "[-] Failed to auto-start postgres container: $($_.Exception.Message)"
        return $false
    }

    if (Wait-PostgresReady 5432 60) {
        Write-ColorOutput "Green" "[+] PostgreSQL is reachable on localhost:5432"
        return $true
    }

    Write-ColorOutput "Red" "[-] PostgreSQL is still not reachable after waiting for container startup."
    Write-ColorOutput "Yellow" "[i] Fail-fast mode enabled; rerun once postgres is ready."
    Write-ColorOutput "Yellow" "[i] Quick checks: docker compose ps postgres ; docker compose logs --tail 50 postgres"
    return $false
}

function Test-HttpReady($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            return ($statusCode -eq 401 -or $statusCode -eq 403)
        }
    }
    return $false
}

function Get-LogTail($path, $lineCount = 30) {
    if (-not (Test-Path $path)) {
        return "(log file not found: $path)"
    }

    $tail = Get-Content -Path $path -Tail $lineCount -ErrorAction SilentlyContinue
    if (-not $tail) {
        return "(log file is empty: $path)"
    }

    return ($tail -join "`n")
}

function Stop-ProcessesOnPort($port, $serviceLabel) {
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port }
    if (-not $connections) {
        return $true
    }

    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processIds) {
        try {
            $existingProcess = Get-Process -Id $processId -ErrorAction Stop
            Write-ColorOutput "Yellow" "[i] Restart requested for ${serviceLabel}: stopping existing process on port $port (PID: $processId, Name: $($existingProcess.ProcessName))"
            Stop-Process -Id $processId -Force -ErrorAction Stop
        } catch {
            Write-ColorOutput "Red" "[-] Failed to stop existing process on port $port for $serviceLabel (PID: $processId): $($_.Exception.Message)"
            return $false
        }
    }

    $waitElapsed = 0
    while ($waitElapsed -lt 15) {
        if (-not (Test-PortOpen $port)) {
            return $true
        }
        Start-Sleep -Seconds 1
        $waitElapsed += 1
    }

    Write-ColorOutput "Red" "[-] Port $port is still occupied after attempting restart for $serviceLabel."
    return $false
}

function Start-BackendServiceViaJar($serviceName, $serviceVersion, $jarPath, $port, $healthUrl, [string[]]$extraArgs = @()) {
    $serviceLabel = "$serviceName v$serviceVersion"
    $serviceStartTime = Get-Date
    
    $portInUse = Test-PortOpen $port
    if ($portInUse) {
        Write-ColorOutput "Yellow" "[i] Existing instance detected on port $port for $serviceLabel. Restarting..."
        if (-not (Stop-ProcessesOnPort $port $serviceLabel)) {
            return $null
        }
    }

    if (-not (Test-Path $jarPath)) {
        Write-ColorOutput "Red" "[-] JAR not found: $jarPath"
        return $null
    }

    if (-not (Test-Path ".\logs")) {
        New-Item -ItemType Directory -Path ".\logs" | Out-Null
    }

    $stdOut = ".\logs\$serviceName.log"
    $stdErr = ".\logs\$serviceName.error.log"

    if (Test-Path $stdOut) { Remove-Item $stdOut -Force -ErrorAction SilentlyContinue }
    if (Test-Path $stdErr) { Remove-Item $stdErr -Force -ErrorAction SilentlyContinue }

    Write-ColorOutput "Yellow" "[>] $serviceLabel starting (java -jar $jarPath)"

    $profileArg = "--spring.profiles.active=local"
    $javaArgs = @("-jar", $jarPath, "--server.port=$port", $profileArg)
    
    $process = Start-Process -FilePath "java.exe" `
        -ArgumentList $javaArgs `
        -PassThru `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdOut `
        -RedirectStandardError $stdErr

    if (-not $process) {
        Write-ColorOutput "Red" "[-] Failed to start $serviceLabel process."
        return $null
    }

    Write-ColorOutput "Yellow" "[>] $serviceLabel process created (PID: $($process.Id)). Waiting for readiness..."

    if (-not (Wait-ForServiceReady $serviceLabel $process $healthUrl $port $StartupTimeoutSeconds $stdOut $stdErr)) {
        return $null
    }

    $serviceEndTime = Get-Date
    $startupSeconds = [Math]::Round((New-TimeSpan -Start $serviceStartTime -End $serviceEndTime).TotalSeconds, 2)
    
    Write-ColorOutput "Green" "[OK] $serviceLabel ready in $($startupSeconds)s"
    return [PSCustomObject]@{
        Name = $serviceName
        DisplayName = $serviceLabel
        Process = $process
        StartupSeconds = $startupSeconds
    }
}

function Stop-StartedProcesses($startedProcesses) {
    if (-not $startedProcesses -or $startedProcesses.Count -eq 0) {
        return
    }

    foreach ($proc in $startedProcesses) {
        if ($null -eq $proc) {
            continue
        }

        try {
            if (-not $proc.HasExited) {
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-ColorOutput "Yellow" "[i] Stopped started process PID $($proc.Id)"
            }
        } catch {
            Write-ColorOutput "Yellow" "[i] Unable to stop PID $($proc.Id): $($_.Exception.Message)"
        }
    }
}

function Wait-ForAggregatedHealth($healthServiceName, $healthServiceProcess, $healthServiceHealthUrl, $timeoutSeconds, $stdOut, $stdErr) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if ($healthServiceProcess -and $healthServiceProcess.HasExited) {
            Write-ColorOutput "Red" "[-] $healthServiceName exited before reporting aggregated health (ExitCode: $($healthServiceProcess.ExitCode))."
            Write-ColorOutput "Red" "[-] Last error log lines:"
            Write-Host (Get-LogTail $stdErr) -ForegroundColor DarkRed
            Write-ColorOutput "Yellow" "[i] Last output log lines:"
            Write-Host (Get-LogTail $stdOut) -ForegroundColor DarkYellow
            return $false
        }

        try {
            $healthSnapshot = Invoke-RestMethod -Uri $healthServiceHealthUrl -TimeoutSec 5 -Method Get -ErrorAction Stop
            if ($healthSnapshot -and $healthSnapshot.status -eq "UP") {
                Write-ColorOutput "Green" "[+] Aggregated health is UP via $healthServiceHealthUrl"
                return $true
            }

            if ($healthSnapshot -and $healthSnapshot.services) {
                $downServices = @()
                foreach ($serviceProperty in $healthSnapshot.services.PSObject.Properties) {
                    if ($serviceProperty.Value.status -ne "UP") {
                        $downServices += $serviceProperty.Name
                    }
                }

                if ($downServices.Count -gt 0) {
                    Write-ColorOutput "Yellow" "[i] Waiting for services to become healthy: $($downServices -join ', ')"
                }
            }
        } catch {
        }

        Start-Sleep -Seconds 1
        $elapsed += 1
    }

    Write-ColorOutput "Red" "[-] Aggregated health did not become UP within $timeoutSeconds seconds at $healthServiceHealthUrl"
    Write-ColorOutput "Yellow" "[i] Last error log lines:"
    Write-Host (Get-LogTail $stdErr) -ForegroundColor DarkYellow
    Write-ColorOutput "Yellow" "[i] Last output log lines:"
    Write-Host (Get-LogTail $stdOut) -ForegroundColor DarkYellow
    return $false
}

function Wait-ForServiceReady($serviceName, $process, $healthUrl, $port, $timeoutSeconds, $stdOut, $stdErr) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if ($process.HasExited) {
            Write-ColorOutput "Red" "[-] $serviceName failed: process exited before becoming ready (ExitCode: $($process.ExitCode))."
            Write-ColorOutput "Red" "[-] Last error log lines:"
            Write-Host (Get-LogTail $stdErr) -ForegroundColor DarkRed
            Write-ColorOutput "Yellow" "[i] Last output log lines:"
            Write-Host (Get-LogTail $stdOut) -ForegroundColor DarkYellow
            return $false
        }

        $portReady = Test-PortOpen $port
        $httpReady = Test-HttpReady $healthUrl
        if ($portReady -and $httpReady) {
            Write-ColorOutput "Green" "[+] $serviceName is ready (Port $port, URL $healthUrl)"
            return $true
        }

        Start-Sleep -Seconds 1
        $elapsed += 1
    }

    Write-ColorOutput "Red" "[-] $serviceName failed to become ready within $timeoutSeconds seconds."
    Write-ColorOutput "Yellow" "[i] Readiness URL: $healthUrl"
    Write-ColorOutput "Yellow" "[i] Last error log lines:"
    Write-Host (Get-LogTail $stdErr) -ForegroundColor DarkYellow
    Write-ColorOutput "Yellow" "[i] Last output log lines:"
    Write-Host (Get-LogTail $stdOut) -ForegroundColor DarkYellow
    return $false
}

function Start-BackendServiceSequential($serviceName, $serviceVersion, $serviceDir, $port, $healthUrl, [string[]]$extraArgs = @()) {
    $serviceLabel = "$serviceName v$serviceVersion"
    $serviceStartTime = Get-Date
    Write-ColorOutput "Cyan" "`n--- Starting $serviceLabel ---"
    Write-ColorOutput "Yellow" "[>] Service directory: $serviceDir"
    Write-ColorOutput "Yellow" "[>] Target port: $port"
    Write-ColorOutput "Yellow" "[>] Readiness URL: $healthUrl"

    $portInUse = Test-PortOpen $port
    if ($portInUse) {
        Write-ColorOutput "Yellow" "[i] Existing instance detected on port $port for $serviceLabel. Restarting to ensure latest version is running."
        if (-not (Stop-ProcessesOnPort $port $serviceLabel)) {
            return $null
        }
    }

    if (-not (Test-Path $serviceDir)) {
        Write-ColorOutput "Red" "[-] Service directory not found: $serviceDir"
        return $null
    }

    if (-not (Test-Path ".\logs")) {
        New-Item -ItemType Directory -Path ".\logs" | Out-Null
    }

    if ($serviceName -eq "role-service") {
        Normalize-RoleServiceDbEnv
    }

    $stdOut = ".\logs\$serviceName.log"
    $stdErr = ".\logs\$serviceName.error.log"

    if (Test-Path $stdOut) { Remove-Item $stdOut -Force -ErrorAction SilentlyContinue }
    if (Test-Path $stdErr) { Remove-Item $stdErr -Force -ErrorAction SilentlyContinue }

    $mvnArgs = @("spring-boot:run") + $extraArgs
    $mvnArgString = ($mvnArgs -join " ")

    Write-ColorOutput "Yellow" "[>] Launch command: mvn $mvnArgString"

    $process = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "mvn $mvnArgString" `
        -WorkingDirectory $serviceDir `
        -PassThru `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdOut `
        -RedirectStandardError $stdErr

    if (-not $process) {
        Write-ColorOutput "Red" "[-] Failed to start $serviceLabel process."
        return $null
    }

    Write-ColorOutput "Yellow" "[>] $serviceLabel process created (PID: $($process.Id)). Waiting for readiness..."

    if (-not (Wait-ForServiceReady $serviceLabel $process $healthUrl $port $StartupTimeoutSeconds $stdOut $stdErr)) {
        return $null
    }

    $serviceEndTime = Get-Date
    $startupSeconds = [Math]::Round((New-TimeSpan -Start $serviceStartTime -End $serviceEndTime).TotalSeconds, 2)
    Write-ColorOutput "Green" "[OK] $serviceLabel start completed successfully."
    return [PSCustomObject]@{
        Name = $serviceName
        DisplayName = $serviceLabel
        Process = $process
        StartupSeconds = $startupSeconds
    }
}

Write-ColorOutput "Green" "=== Carousel Backend Launch Script ==="
Write-ColorOutput "Cyan" "Starting backend services at $(Get-Date)`n"

if ($UseJarStartup) {
    Write-ColorOutput "Green" "[*] FastStartup mode ENABLED - using prebuilt JARs"
} else {
    Write-ColorOutput "Green" "[*] Standard mode - using mvn spring-boot:run"
}
Write-Host ""

# Prerequisite checks
if (-not (Get-Command "java.exe" -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "Red" "[-] Java not found in PATH. Install Java 17+ and try again."
    exit 1
}

if (-not $UseJarStartup -and -not (Get-Command "mvn.cmd" -ErrorAction SilentlyContinue) -and -not (Get-Command "mvn" -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "Red" "[-] Maven not found in PATH. Install Maven and try again."
    exit 1
}

# Start services sequentially
$overallStartupStartTime = Get-Date
$startedProcesses = @()
$serviceStatus = @()

# Build services array from ServiceMap
$services = @()
$allServices = Get-AllServiceShortcuts $ServiceMap
foreach ($shortcut in $allServices) {
    $svc = Get-ServiceByShortcut $ServiceMap $shortcut
    if ($svc) {
        $services += [PSCustomObject]@{
            Name = $svc.Name
            Version = $BackendVersion
            Dir = $svc.Path
            JarPath = ".\$($svc.Path)\target\$($svc.Name)-$BackendVersion.jar"
            Port = $svc.Port
            ReadinessUrl = $svc.HealthUrl
            ExtraArgs = @("-Dspring.jmx.enabled=false", "-Dspring-boot.run.arguments=--spring.profiles.active=local")
        }
    }
}

# If -Service is specified, only start the matching service
if ($Service) {
    $selectedService = Get-ServiceByShortcut $ServiceMap $Service
    if (-not $selectedService) {
        Write-ColorOutput "Red" "[-] Unknown service: $Service."
        Write-ColorOutput "Yellow" "Valid values: $($allServices -join ', ')"
        exit 1
    }
    
    # Build a services array with only the selected service
    $serviceDef = [PSCustomObject]@{
        Name = $selectedService.Name
        Version = $BackendVersion
        Dir = $selectedService.Path
        JarPath = ".\$($selectedService.Path)\target\$($selectedService.Name)-$BackendVersion.jar"
        Port = $selectedService.Port
        ReadinessUrl = $selectedService.HealthUrl
        ExtraArgs = @("-Dspring.jmx.enabled=false", "-Dspring-boot.run.arguments=--spring.profiles.active=local")
    }
    $services = @($serviceDef)
}

$requiresRoleServiceDb = $services | Where-Object { $_.Name -eq "role-service" } | Select-Object -First 1
if ($requiresRoleServiceDb) {
    if (-not (Ensure-PostgresAvailableForRoleService $ShouldAutoStartPostgres)) {
        Write-ColorOutput "Red" "`n[FAIL] Backend launch stopped because role-service dependency (PostgreSQL) is not ready."
        exit 1
    }
}

foreach ($serviceDef in $services) {
    if ($UseJarStartup) {
        $result = Start-BackendServiceViaJar $serviceDef.Name $serviceDef.Version $serviceDef.JarPath $serviceDef.Port $serviceDef.ReadinessUrl $serviceDef.ExtraArgs
    } else {
        $result = Start-BackendServiceSequential $serviceDef.Name $serviceDef.Version $serviceDef.Dir $serviceDef.Port $serviceDef.ReadinessUrl $serviceDef.ExtraArgs
    }
    if (-not $result) {
        Write-ColorOutput "Red" "`n[FAIL] Backend launch stopped because $($serviceDef.Name) v$($serviceDef.Version) failed to start."
        Write-ColorOutput "Yellow" "[i] Stopping already-started backend services."
        Stop-StartedProcesses $startedProcesses
        $serviceStatus += @{ Name = "$($serviceDef.Name) v$($serviceDef.Version)"; Success = $false; StartupSeconds = $null }
        exit 1
    }

    $serviceStatus += @{ Name = $result.DisplayName; Success = $true; StartupSeconds = $result.StartupSeconds }

    if ($result.Process) {
        $startedProcesses += $result.Process
    }

}

$overallStartupSeconds = [Math]::Round((New-TimeSpan -Start $overallStartupStartTime -End (Get-Date)).TotalSeconds, 2)

if (([string]::IsNullOrWhiteSpace($Service)) -and (-not $SkipGlobalHealth)) {
    Write-ColorOutput "Yellow" "[i] Running post-start backend health validation..."
    & .\check-backend.ps1
    if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        Write-ColorOutput "Red" "[-] Post-start backend health validation failed."
        exit 1
    }
} elseif ($SkipGlobalHealth) {
    Write-ColorOutput "Yellow" "[i] SkipGlobalHealth enabled. Skipping post-start backend health validation."
}

# Get gateway port for Swagger URL
$gatewayService = Get-ServiceByShortcut $ServiceMap "gateway"
$gatewayPort = if ($gatewayService) { $gatewayService.Port } else { 8000 }
$swaggerUrl = "http://localhost:$gatewayPort/swagger-ui.html"

# Display startup summary
Write-Host ""
Write-ColorOutput "Green" "=============================================================="
Write-ColorOutput "Green" "         Carousel Backend v$BackendVersion - Startup Summary"
Write-ColorOutput "Green" "=============================================================="
Write-Host ""

# Display service status
Write-ColorOutput "Cyan" "Service Status:"
foreach ($status in $serviceStatus) {
    $statusIcon = if ($status.Success) { $CheckMark } else { $CrossMark }
    $statusColor = if ($status.Success) { "Green" } else { "Red" }
    $timingText = if ($null -ne $status.StartupSeconds) { " ($($status.StartupSeconds)s)" } else { "" }
    Write-ColorOutput $statusColor "  $statusIcon $($status.Name)$timingText"
}

Write-Host ""
if (-not [string]::IsNullOrWhiteSpace($Service)) {
    Write-ColorOutput "Yellow" "[i] Single-service mode detected ($Service). Skipping Swagger UI auto-open."
} elseif ($NoBrowser) {
    Write-ColorOutput "Yellow" "[i] NoBrowser enabled. Skipping Swagger UI auto-open."
} else {
    Write-ColorOutput "Cyan" "Opening consolidated Swagger UI in Chrome..."

    $chrome = Get-Command "chrome.exe" -ErrorAction SilentlyContinue
    if ($chrome) {
        Start-Process -FilePath $chrome.Source -ArgumentList $swaggerUrl | Out-Null
    } else {
        Start-Process $swaggerUrl | Out-Null
    }
}

Write-Host ""
Write-ColorOutput "Green" "$CheckMark Backend services are running"
Write-ColorOutput "Green" "$CheckMark Total startup time: ${overallStartupSeconds}s"
if (-not [string]::IsNullOrWhiteSpace($Service)) {
    Write-ColorOutput "Yellow" "[i] Swagger UI not opened for single-service mode."
} else {
    Write-ColorOutput "Green" "$CheckMark Swagger UI: $swaggerUrl"
}
Write-ColorOutput "Yellow" "Logs: .\logs\auth-service.log, .\logs\user-service.log, .\logs\approval-service.log, .\logs\role-service.log, .\logs\inventory-service.log, .\logs\styles-service.log, .\logs\flow-service.log, .\logs\api-gateway.log"
Write-Host ""
exit 0

