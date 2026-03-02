#!/usr/bin/env pwsh

# Carousel Restart Script (debug optimized)
# Usage examples:
#   .\restart.ps1                             # Full restart (legacy behavior)
#   .\restart.ps1 -Target frontend            # Restart frontend only
#   .\restart.ps1 -Target backend             # Restart all backend services only
#   .\restart.ps1 -Target service -Service auth

param(
    [ValidateSet("full", "frontend", "backend", "service")]
    [string]$Target = "full",
    [string]$Service,
    [switch]$Fast,
    [switch]$NoBuild,
    [switch]$NoBrowser,
    [switch]$SkipSetup
)

$ErrorActionPreference = "Stop"

function Assert-StepSucceeded([string]$stepName) {
    if (-not $?) {
        throw "$stepName failed"
    }
    if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        throw "$stepName failed with exit code $LASTEXITCODE"
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Carousel Restart Script (Target: $Target)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

try {
    switch ($Target) {
        "frontend" {
            Write-Host "`nStep 1: Stopping frontend service..." -ForegroundColor Yellow
            & ".\stop-frontend.ps1"
            Assert-StepSucceeded "stop-frontend.ps1"

            Write-Host "`nStep 2: Launching frontend..." -ForegroundColor Yellow
            if ($NoBrowser) {
                & ".\launch-frontend.ps1" -SkipBackendValidation -NoBrowser
            } else {
                & ".\launch-frontend.ps1" -SkipBackendValidation
            }
            Assert-StepSucceeded "launch-frontend.ps1"
        }

        "backend" {
            Write-Host "`nStep 1: Stopping backend services..." -ForegroundColor Yellow
            & ".\stop-backend.ps1"
            Assert-StepSucceeded "stop-backend.ps1"

            if (-not $NoBuild -and -not $Fast) {
                Write-Host "`nStep 2: Building backend..." -ForegroundColor Yellow
                & ".\build.ps1" -BackendOnly
                Assert-StepSucceeded "build.ps1 -BackendOnly"
            }

            Write-Host "`nStep 3: Launching backend services..." -ForegroundColor Yellow
            if ($Fast -and $NoBrowser) {
                & ".\launch-backend.ps1" -Fast -NoBrowser
            } elseif ($Fast) {
                & ".\launch-backend.ps1" -Fast
            } elseif ($NoBrowser) {
                & ".\launch-backend.ps1" -NoBrowser
            } else {
                & ".\launch-backend.ps1"
            }
            Assert-StepSucceeded "launch-backend.ps1"
        }

        "service" {
            if ([string]::IsNullOrWhiteSpace($Service)) {
                throw "-Service is required when -Target service is used"
            }

            if (-not $NoBuild -and -not $Fast) {
                Write-Host "`nStep 1: Building backend service '$Service'..." -ForegroundColor Yellow
                & ".\build.ps1" -Service $Service
                Assert-StepSucceeded "build.ps1 -Service $Service"
            }

            Write-Host "`nStep 2: Restarting backend service '$Service'..." -ForegroundColor Yellow
            if ($Fast -and $NoBrowser) {
                & ".\launch-backend.ps1" -Service $Service -Fast -SkipGlobalHealth -NoBrowser
            } elseif ($Fast) {
                & ".\launch-backend.ps1" -Service $Service -Fast -SkipGlobalHealth
            } elseif ($NoBrowser) {
                & ".\launch-backend.ps1" -Service $Service -SkipGlobalHealth -NoBrowser
            } else {
                & ".\launch-backend.ps1" -Service $Service -SkipGlobalHealth
            }
            Assert-StepSucceeded "launch-backend.ps1 -Service $Service"
        }

        default {
            Write-Host "`nStep 1: Stopping backend services..." -ForegroundColor Yellow
            & ".\stop-backend.ps1"
            Assert-StepSucceeded "stop-backend.ps1"

            Write-Host "`nStep 2: Stopping frontend service..." -ForegroundColor Yellow
            & ".\stop-frontend.ps1"
            Assert-StepSucceeded "stop-frontend.ps1"

            if (-not $NoBuild) {
                Write-Host "`nStep 3: Building application..." -ForegroundColor Yellow
                & ".\build.ps1"
                Assert-StepSucceeded "build.ps1"
            }

            Write-Host "`nStep 4: Launching application..." -ForegroundColor Yellow
            if ($Fast -and $NoBrowser) {
                & ".\launch-backend.ps1" -Fast -NoBrowser
                Assert-StepSucceeded "launch-backend.ps1 -Fast"
                & ".\launch-frontend.ps1" -NoBrowser
                Assert-StepSucceeded "launch-frontend.ps1"
            } elseif ($Fast) {
                & ".\launch-backend.ps1" -Fast
                Assert-StepSucceeded "launch-backend.ps1 -Fast"
                & ".\launch-frontend.ps1"
                Assert-StepSucceeded "launch-frontend.ps1"
            } else {
                & ".\launch.ps1"
                Assert-StepSucceeded "launch.ps1"
            }

            if (-not $SkipSetup) {
                Write-Host "`nStep 5: Setting up DB environment..." -ForegroundColor Yellow
                & ".\setup-dev.ps1"
                Assert-StepSucceeded "setup-dev.ps1"
            }
        }
    }

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "SUCCESS: Restart flow completed successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host "ERROR: Restart failed: $_" -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Red
    exit 1
}
