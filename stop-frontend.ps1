# Stop script for Carousel frontend
# Gracefully shuts down the frontend dev server

param(
    [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Continue"

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

Write-ColorOutput "Green" "=== Carousel Frontend Stop Script ==="
Write-ColorOutput "Cyan" "Stopping at $(Get-Date)`n"

# Try to find and kill frontend processes
$processes = Get-Process | Where-Object { $_.Name -eq "node" -or $_.Name -eq "npm" }

if ($processes) {
    Write-ColorOutput "Yellow" "Found running Node.js/npm processes..."
    foreach ($process in $processes) {
        Write-ColorOutput "Yellow" "[>] Stopping process: $($process.Name) (PID: $($process.Id))"
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "Green" "[+] Process stopped"
        } catch {
            Write-ColorOutput "Red" "[-] Failed to stop process: $_"
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-ColorOutput "Yellow" "[i] No Node.js/npm processes found running"
}

# Verify port is free
Write-ColorOutput "Yellow" "[>] Verifying port $FrontendPort is free..."

try {
    $portInUse = netstat -ano | Select-String ":$FrontendPort\s+LISTENING" | Select-Object -First 1
    if ($portInUse) {
        $pid = $portInUse -split '\s+' | Select-Object -Last 1
        Write-ColorOutput "Yellow" "[!] Process still using port $FrontendPort (PID: $pid). Force stopping..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-ColorOutput "Green" "[+] Port $FrontendPort is now free"
    } else {
        Write-ColorOutput "Green" "[+] Port $FrontendPort is free"
    }
} catch {
    Write-ColorOutput "Yellow" "[i] Could not verify port status, but processed stopped"
}

Write-ColorOutput "Green" "[OK] Frontend stop completed"
Write-ColorOutput "Yellow" "Log files available in: .\logs\"
exit 0

