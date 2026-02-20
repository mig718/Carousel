# Chek the health of the backend services by hitting their /health endpoints.

param(
    [int]$ApiGatewayPort = 8000,
    [int]$AuthServicePort = 8001,
    [int]$UserServicePort = 8002,
    [int]$ApprovalServicePort = 8003
)

$ErrorActionPreference = "Stop"
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Test-ServiceReady($serviceName, $healthUrl, $serviceShortcut) {
    Write-Host
    Write-ColorOutput "Yellow" "Checking $serviceName at $healthUrl..."
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        $isReady = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
        if ($isReady) {
            Write-ColorOutput "Green" "$CheckMark $serviceName is running at $($response.BaseResponse.ResponseUri)"
        } else {
            Write-ColorOutput "Red" "$CrossMark $serviceName is not healthy at $($response.BaseResponse.ResponseUri)"
            Write-ColorOutput "Red" "  Use '.\launch.ps1 $serviceShortcut' to start/restart it"
            Write-ColorOutput "Red" "  Status code: $($response.StatusCode)"
        }
        return $isReady
    } catch {
        Write-ColorOutput "Red" "$CrossMark $serviceName is not reachable at $healthUrl"
        Write-ColorOutput "Red" "  Use '.\launch.ps1 $serviceShortcut' to start/restart it"
        Write-ColorOutput "Red" "  Error: $($_.Exception.Message)"
        return $false
    }
}

Write-ColorOutput "Cyan" "=== Carousel Backend Check ==="
Write-Host ""

Write-ColorOutput "Yellow" "Checking service availability..."
$serviceNames = @("API Gateway", "User Service", "Auth Service", "Approval Service")
$serviceUrls = @(
    "http://localhost:$ApiGatewayPort/health",
    "http://localhost:$UserServicePort/api/users/health",
    "http://localhost:$AuthServicePort/api/auth/health",
    "http://localhost:$ApprovalServicePort/api/approvals/health"
)
$serviceShortcuts = @("gateway", "user", "auth", "approve")
$allReady = $true
for ($i = 0; $i -lt $serviceNames.Count; $i++) {
    try {
        $ok = Test-ServiceReady $serviceNames[$i] $serviceUrls[$i] $serviceShortcuts[$i]
        if (-not $ok) {
            $allReady = $false
        }
    } catch {
        $allReady = $false
    }
}

Write-Host
Write-Host "Summary:"

if (-not $allReady) {
    Write-ColorOutput "Red" "[-] Not all services are ready"
    Write-ColorOutput "Red" "  Use '.\launch.ps1 backend' to start all backend services"
    Write-ColorOutput "Red" "  or '.\launch.ps1 <service>' to start them individually: auth, user, approve, gateway"
}
else {
    Write-ColorOutput "Green" "[+] All services are ready"
}
