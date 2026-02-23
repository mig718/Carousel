#!/usr/bin/env pwsh

# Carousel Restart Script
# Stops services, rebuilds the application, and relaunches everything

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Carousel Restart Script" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

try {
    Write-Host ""
    Write-Host "Step 1: Stopping backend services..." -ForegroundColor Yellow
    & ".\stop-backend.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "stop-backend.ps1 failed with exit code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "Step 2: Stopping frontend service..." -ForegroundColor Yellow
    & ".\stop-frontend.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "stop-frontend.ps1 failed with exit code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "Step 3: Building application..." -ForegroundColor Yellow
    & ".\build.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "build.ps1 failed with exit code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "Step 4: Launching application..." -ForegroundColor Yellow
    & ".\launch.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "launch.ps1 failed with exit code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "Step 5: Setting up DB environment..." -ForegroundColor Yellow
    & ".\setup-dev.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "setup-dev.ps1 failed with exit code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "SUCCESS: Carousel restart completed successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host "ERROR: Restart failed: $_" -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Red
    exit 1
}
