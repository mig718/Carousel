# Launch script for Carousel backend services only
# Starts backend microservices sequentially, validates readiness, and opens a single aggregated Swagger UI tab

[CmdletBinding(PositionalBinding = $false)]
param(
    [switch]$Fast,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs,
    [int]$ApiGatewayPort = 8000,
    [int]$AuthServicePort = 8001,
    [int]$UserServicePort = 8002,
    [int]$ApprovalServicePort = 8003,
    [int]$HealthServicePort = 8004,
    [int]$MongoPort = 27017,
    [int]$StartupTimeoutSeconds = 120,
    [string]$Service
)

$ErrorActionPreference = "Stop"
$BackendVersion = "1.0.0"
$UseJarStartup = $Fast -or ($RemainingArgs -contains "--fast") -or ($args -contains "--fast")
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Test-PortOpen($port) {
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
        return [bool]$connection.TcpTestSucceeded
    } catch {
        return $false
    }
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

if (-not (Get-Command "mvn.cmd" -ErrorAction SilentlyContinue) -and -not (Get-Command "mvn" -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "Red" "[-] Maven not found in PATH. Install Maven and try again."
    exit 1
}

# MongoDB dependency
Write-ColorOutput "Yellow" "Checking MongoDB on localhost:$MongoPort..."
if (-not (Test-PortOpen $MongoPort)) {
    $docker = Get-Command "docker.exe" -ErrorAction SilentlyContinue
    if ($docker) {
        Write-ColorOutput "Yellow" "MongoDB not reachable. Attempting to start mongodb container via docker compose..."
        try {
            & docker compose up -d mongodb | Out-Null
            Start-Sleep -Seconds 5
        } catch {
            Write-ColorOutput "Red" "[-] Failed to start MongoDB with Docker Compose: $_"
            exit 1
        }
    }
}

$mongoWaitElapsed = 0
$mongoReady = $false
while ($mongoWaitElapsed -lt 30) {
    if (Test-PortOpen $MongoPort) {
        $mongoReady = $true
        break
    }
    Start-Sleep -Seconds 2
    $mongoWaitElapsed += 2
}

if (-not $mongoReady) {
    Write-ColorOutput "Red" "[-] MongoDB is not reachable on localhost:$MongoPort. Start MongoDB and retry."
    exit 1
}
Write-ColorOutput "Green" "[+] MongoDB is reachable`n"

# Start services sequentially
$overallStartupStartTime = Get-Date
$startedProcesses = @()
$serviceStatus = @()

$services = @(
    [PSCustomObject]@{
        Name = "auth-service"
        Short = "auth"
        Aliases = @("auth-service")
        Version = $BackendVersion
        Dir = ".\backend\auth-service"
        JarPath = ".\backend\auth-service\target\auth-service-1.0.0.jar"
        Port = $AuthServicePort
        ReadinessUrl = "http://localhost:$AuthServicePort/api/auth/health"
        ExtraArgs = @("-D'spring.jmx.enabled'='false'", "-D'spring-boot.run.arguments'='--spring.profiles.active=local'")
    },
    [PSCustomObject]@{
        Name = "user-service"
        Short = "user"
        Aliases = @("user-service")
        Version = $BackendVersion
        Dir = ".\backend\user-service"
        JarPath = ".\backend\user-service\target\user-service-1.0.0.jar"
        Port = $UserServicePort
        ReadinessUrl = "http://localhost:$UserServicePort/api/users/health"
        ExtraArgs = @("-Dspring.jmx.enabled=false", "-Dspring-boot.run.arguments=--spring.profiles.active=local")
    },
    [PSCustomObject]@{
        Name = "approval-service"
        Short = "approve"
        Aliases = @("approval", "approval-service")
        Version = $BackendVersion
        Dir = ".\backend\approval-service"
        JarPath = ".\backend\approval-service\target\approval-service-1.0.0.jar"
        Port = $ApprovalServicePort
        ReadinessUrl = "http://localhost:$ApprovalServicePort/api/approvals/health"
        ExtraArgs = @("-Dspring.jmx.enabled=false", "-Dspring-boot.run.arguments=--spring.profiles.active=local")
    },
    [PSCustomObject]@{
        Name = "api-gateway"
        Short = "gateway"
        Aliases = @("api-gateway", "api")
        Version = $BackendVersion
        Dir = ".\backend\api-gateway"
        JarPath = ".\backend\api-gateway\target\api-gateway-1.0.0.jar"
        Port = $ApiGatewayPort
        ReadinessUrl = "http://localhost:$ApiGatewayPort/health"
        ExtraArgs = @("-Dspring.jmx.enabled=false", "-Dspring-boot.run.arguments=--spring.profiles.active=local")
    }
)

$healthServiceResult = $null


# If -Service is specified, only start the matching service
if ($Service) {
    $serviceKey = $Service.Trim().ToLower()
    switch ($serviceKey) {
        "auth" { $services = @($services[0]) }
        "auth-service" { $services = @($services[0]) }
        "user" { $services = @($services[1]) }
        "user-service" { $services = @($services[1]) }
        "approve" { $services = @($services[2]) }
        "approval" { $services = @($services[2]) }
        "approval-service" { $services = @($services[2]) }
        "gateway" { $services = @($services[3]) }
        "api" { $services = @($services[3]) }
        "api-gateway" { $services = @($services[3]) }
        default {
            Write-ColorOutput "Red" "[-] Unknown service: $Service. Valid values: auth, user, approve (or approval), gateway."
            exit 1
        }
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

    if ($serviceDef.Name -eq "health-service") {
        $healthServiceResult = $result
    }
}

$overallStartupSeconds = [Math]::Round((New-TimeSpan -Start $overallStartupStartTime -End (Get-Date)).TotalSeconds, 2)

$swaggerUrl = "http://localhost:$ApiGatewayPort/swagger-ui.html"

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
Write-ColorOutput "Yellow" "Logs: .\logs\auth-service.log, .\logs\user-service.log, .\logs\approval-service.log, .\logs\api-gateway.log, .\logs\health-service.log"
Write-Host ""
exit 0

