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

# Stop process bound to the frontend port only
Write-ColorOutput "Yellow" "[>] Looking for process listening on port $FrontendPort..."
try {
    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $FrontendPort }
    if ($listeners) {
        $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($processId in $processIds) {
            try {
                $proc = Get-Process -Id $processId -ErrorAction Stop
                Write-ColorOutput "Yellow" "[>] Stopping process using port ${FrontendPort}: $($proc.Name) (PID: $processId)"
                Stop-Process -Id $processId -Force -ErrorAction Stop
                Write-ColorOutput "Green" "[+] Stopped PID $processId"
            } catch {
                Write-ColorOutput "Red" "[-] Failed to stop PID ${processId}: $($_.Exception.Message)"
            }
        }
        Start-Sleep -Seconds 1
    } else {
        Write-ColorOutput "Yellow" "[i] No process is listening on port $FrontendPort"
    }
} catch {
    Write-ColorOutput "Yellow" "[i] Could not query listeners via Get-NetTCPConnection: $($_.Exception.Message)"
}

# Verify port is free
Write-ColorOutput "Yellow" "[>] Verifying port $FrontendPort is free..."

if (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $FrontendPort }) {
    Write-ColorOutput "Red" "[-] Port $FrontendPort is still in use."
    exit 1
}

Write-ColorOutput "Green" "[+] Port $FrontendPort is free"

Write-ColorOutput "Green" "[OK] Frontend stop completed"
Write-ColorOutput "Yellow" "Log files available in: .\logs\"
exit 0

