# Script to stop Carousel backend services only
# Stops processes listening on backend ports and any remaining Carousel backend Java/Maven processes

$ErrorActionPreference = "SilentlyContinue"

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

$backendPorts = @(8000, 8001, 8002, 8003, 8004)
$stoppedPids = @()

Write-ColorOutput "Yellow" "Stopping Carousel backend services..."

# Stop processes listening on backend ports
$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $backendPorts -contains $_.LocalPort }

if ($connections) {
    $owningProcessIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $owningProcessIds) {
        try {
            $process = Get-Process -Id $processId -ErrorAction Stop
            Stop-Process -Id $processId -Force -ErrorAction Stop
            $stoppedPids += $processId
            Write-ColorOutput "Green" "[OK] Stopped process on backend port (PID: $processId, Name: $($process.ProcessName))"
        } catch {
            Write-ColorOutput "Red" "[ERR] Error stopping process PID ${processId}: $($_)"
        }
    }
} else {
    Write-ColorOutput "Yellow" "No active listeners found on backend ports 8000-8004."
}

# Stop remaining Carousel backend Java/Maven launcher processes
$candidates = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    ($_.Name -in @("java.exe", "cmd.exe", "mvn.cmd", "mvn.exe")) -and
    $_.CommandLine -and
    ($_.CommandLine -match "Carousel\\backend")
}

foreach ($candidate in $candidates) {
    $processId = [int]$candidate.ProcessId
    if ($stoppedPids -contains $processId) {
        continue
    }

    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        $stoppedPids += $processId
        Write-ColorOutput "Green" "[OK] Stopped backend process (PID: $processId, Name: $($candidate.Name))"
    } catch {
        Write-ColorOutput "Red" "[ERR] Error stopping backend process PID ${processId}: $($_)"
    }
}

$uniqueStopped = $stoppedPids | Select-Object -Unique
if (-not $uniqueStopped) {
    Write-ColorOutput "Yellow" "No backend processes were running."
} else {
    Write-ColorOutput "Green" "Stopped $($uniqueStopped.Count) backend process(es)."
}

Write-ColorOutput "Green" "Carousel backend stop completed."

