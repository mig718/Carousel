# Launch script for Carousel frontend
# Validates all backend services are running, starts frontend, and opens landing page

param(
    [int]$FrontendPort = 3000,
    [int]$AuthServicePort = 8001,
    [int]$UserServicePort = 8002,
    [int]$ApprovalServicePort = 8003,
    [int]$ApiGatewayPort = 8000,
    [int]$HealthCheckTimeoutSeconds = 10
)

$ErrorActionPreference = "Stop"
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Open-FrontendLandingPage($url) {
    Write-ColorOutput "Cyan" "Opening frontend landing page in Chrome..."
    $chrome = Get-Command "chrome.exe" -ErrorAction SilentlyContinue
    if ($chrome) {
        Start-Process -FilePath $chrome.Source -ArgumentList $url | Out-Null
    } else {
        Start-Process $url | Out-Null
    }
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

function Test-ServiceHealthy($serviceName, $port, $healthUrl) {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-ColorOutput "Green" "$CheckMark $serviceName is running"
            return $true
        }
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq 401 -or $statusCode -eq 403) {
                Write-ColorOutput "Green" "$CheckMark $serviceName is running (auth required)"
                return $true
            }
        }
    }

    Write-ColorOutput "Red" "$CrossMark $serviceName is not responding"
    return $false
}

Write-ColorOutput "Green" "=== Carousel Frontend Launch Script ==="
Write-ColorOutput "Cyan" "Starting at $(Get-Date)`n"

# Check all backend services are running
Write-ColorOutput "Yellow" "Checking backend services..."

$healthChecks = @(
    @{ Name = "Auth Service"; Port = $AuthServicePort; Url = "http://localhost:$AuthServicePort/api/auth/v3/api-docs" },
    @{ Name = "User Service"; Port = $UserServicePort; Url = "http://localhost:$UserServicePort/api/users/v3/api-docs" },
    @{ Name = "Approval Service"; Port = $ApprovalServicePort; Url = "http://localhost:$ApprovalServicePort/api/approvals/v3/api-docs" },
    @{ Name = "API Gateway"; Port = $ApiGatewayPort; Url = "http://localhost:$ApiGatewayPort/swagger-ui.html" }
)

$allHealthy = $true
foreach ($service in $healthChecks) {
    if (-not (Test-ServiceHealthy $service.Name $service.Port $service.Url)) {
        $allHealthy = $false
    }
}

if (-not $allHealthy) {
    Write-ColorOutput "Red" "`n$CrossMark Some backend services are not running."
    Write-ColorOutput "Yellow" "[i] Start backend services first with: .\launch-backend.ps1 --fast"
    exit 1
}

Write-ColorOutput "Green" "$CheckMark All backend services are running`n"

# Check Node.js is available
if (-not (Get-Command "node.exe" -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "Red" "[-] Node.js not found in PATH. Install Node.js and try again."
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-ColorOutput "Yellow" "Installing frontend dependencies (this may take a few minutes)..."
    try {
        Push-Location -Path ".\frontend"
        npm install --legacy-peer-deps -q
        Pop-Location
        Write-ColorOutput "Green" "[+] Frontend dependencies installed`n"
    } catch {
        Write-ColorOutput "Red" "[-] Failed to install frontend dependencies: $_"
        exit 1
    }
}

# Create logs directory
if (-not (Test-Path ".\logs")) {
    New-Item -ItemType Directory -Path ".\logs" | Out-Null
}

# Start frontend
Write-ColorOutput "Cyan" "--- Starting frontend ---"
Write-ColorOutput "Yellow" "[>] Target port: $FrontendPort"

$frontendUrl = "http://localhost:$FrontendPort/"
$portInUse = Test-PortOpen $FrontendPort
if ($portInUse -and (Test-HttpReady $frontendUrl)) {
    Write-ColorOutput "Yellow" "[SKIP] Frontend was already running and ready on port $FrontendPort. Skipping launch."
    Open-FrontendLandingPage $frontendUrl
    Write-ColorOutput "Green" "[+] Frontend is running"
    Write-ColorOutput "Green" "[+] Landing page: $frontendUrl"
    Write-ColorOutput "Yellow" "Log: .\logs\frontend.log"
    exit 0
}

if ($portInUse) {
    Write-ColorOutput "Red" "[-] Port $FrontendPort is already in use, but frontend readiness check failed at $frontendUrl."
    Write-ColorOutput "Red" "[-] Aborting launch to avoid starting a duplicate or conflicting instance."
    exit 1
}

$stdOut = ".\logs\frontend.log"
$stdErr = ".\logs\frontend.error.log"

if (Test-Path $stdOut) { Remove-Item $stdOut -Force -ErrorAction SilentlyContinue }
if (Test-Path $stdErr) { Remove-Item $stdErr -Force -ErrorAction SilentlyContinue }

$frontendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm start" `
    -WorkingDirectory ".\frontend" `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdOut `
    -RedirectStandardError $stdErr

if (-not $frontendProcess) {
    Write-ColorOutput "Red" "[-] Failed to start frontend"
    exit 1
}

Write-ColorOutput "Yellow" "[>] Frontend process created (PID: $($frontendProcess.Id)). Waiting for readiness..."

# Wait for frontend to become ready
$elapsed = 0
$timeout = 120
$frontendReady = $false

while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            $frontendReady = $true
            break
        }
    } catch {
        # Not ready yet
    }

    Start-Sleep -Seconds 2
    $elapsed += 2
}

if (-not $frontendReady) {
    Write-ColorOutput "Red" "[-] Frontend failed to become ready within $timeout seconds."
    Write-ColorOutput "Yellow" "[i] Last output log lines:"
    Get-Content -Path $stdOut -Tail 20 -ErrorAction SilentlyContinue | Write-Host -ForegroundColor DarkYellow
    Write-ColorOutput "Yellow" "[i] Last error log lines:"
    Get-Content -Path $stdErr -Tail 20 -ErrorAction SilentlyContinue | Write-Host -ForegroundColor DarkRed
    exit 1
}

Write-ColorOutput "Green" "[+] Frontend is ready (Port $FrontendPort)"
Write-ColorOutput "Green" "[OK] Frontend start completed successfully.`n"

# Open landing page in Chrome
Open-FrontendLandingPage $frontendUrl

Write-ColorOutput "Green" "[+] Frontend is running"
Write-ColorOutput "Green" "[+] Landing page: $frontendUrl"
Write-ColorOutput "Yellow" "Log: .\logs\frontend.log"
exit 0

