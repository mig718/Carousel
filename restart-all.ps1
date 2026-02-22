# Restart script for Carousel full stack
# Stops backend and frontend, builds all services, then launches both
# Usage: ./restart-all.ps1

Write-Host "=== Carousel Full Stack Restart ===" -ForegroundColor Cyan
Write-Host "Starting at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

Write-Host "[1/4] Stopping backend services..." -ForegroundColor Yellow
& ./stop-backend.ps1
Write-Host "[+] Backend stopped" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Stopping frontend..." -ForegroundColor Yellow
& ./stop-frontend.ps1
Write-Host "[+] Frontend stopped" -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] Building backend and frontend..." -ForegroundColor Yellow
& ./build.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[-] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[+] Build completed" -ForegroundColor Green
Write-Host ""

Write-Host "[4/4] Launching backend and frontend..." -ForegroundColor Yellow
& ./launch.ps1

Write-Host ""
Write-Host "=== Restart Complete ===" -ForegroundColor Green
Write-Host "Completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
