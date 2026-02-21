# Check the health of the backend services by hitting their /health endpoints.
# Uses service shortcuts from shortcuts.map for configuration

$ErrorActionPreference = "Stop"
$CheckMark = [char]0x2713
$CrossMark = [char]0x2717

# Import service map helper
Import-Module -Name ".\ServiceMap.psm1" -Force

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

# Load service map
$ServiceMap = Get-ServiceMap ".\shortcuts.map"
if (-not $ServiceMap) {
    Write-ColorOutput "Red" "Failed to load service map"
    exit 1
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
            Write-ColorOutput "Red" "  Use '.\launch-backend.ps1 $serviceShortcut' to start/restart it"
            Write-ColorOutput "Red" "  Status code: $($response.StatusCode)"
        }
        return $isReady
    } catch {
        Write-ColorOutput "Red" "$CrossMark $serviceName is not reachable at $healthUrl"
        Write-ColorOutput "Red" "  Use '.\launch-backend.ps1 $serviceShortcut' to start/restart it"
        Write-ColorOutput "Red" "  Error: $($_.Exception.Message)"
        return $false
    }
}

Write-ColorOutput "Cyan" "=== Carousel Backend Check ==="
Write-Host ""

Write-ColorOutput "Yellow" "Checking service availability..."

$allReady = $true
$serviceList = Get-AllServiceShortcuts $ServiceMap

foreach ($shortcut in $serviceList) {
    $svc = Get-ServiceByShortcut $ServiceMap $shortcut
    try {
        $ok = Test-ServiceReady $svc.Name $svc.HealthUrl $shortcut
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
    Write-ColorOutput "Red" "  Use '.\launch-backend.ps1' to start all backend services"
    $shortcuts = Get-AllServiceShortcuts $ServiceMap
    Write-ColorOutput "Red" "  or '.\launch-backend.ps1 -Service <shortcut>' to start them individually: $($shortcuts -join ', ')"
}
else {
    Write-ColorOutput "Green" "[+] All services are ready"
}
