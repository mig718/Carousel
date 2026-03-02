#!/usr/bin/env pwsh

# Carousel Debug Shortcut Script
# Usage examples:
#   .\debug.ps1 auth
#   .\debug.ps1 backend
#   .\debug.ps1 ui
#   .\debug.ps1 full
#   .\debug.ps1 service user

param(
    [Parameter(Position = 0)]
    [string]$Scenario = "help",

    [Parameter(Position = 1)]
    [string]$Service
)

$ErrorActionPreference = "Stop"

function Show-Usage {
    Write-Host "Carousel Debug Shortcuts" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Scenarios:" -ForegroundColor Yellow
    Write-Host "  auth            Restart auth service only (fast)"
    Write-Host "  backend         Restart all backend services only (fast)"
    Write-Host "  ui              Restart frontend only (skip backend validation)"
    Write-Host "  full            Full stack restart (fast backend + frontend)"
    Write-Host "  service <name>  Restart one backend service by shortcut"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\debug.ps1 auth"
    Write-Host "  .\debug.ps1 backend"
    Write-Host "  .\debug.ps1 ui"
    Write-Host "  .\debug.ps1 service user"
}

try {
    switch ($Scenario.ToLower()) {
        "auth" {
            & .\restart.ps1 -Target service -Service auth -Fast -NoBrowser
            break
        }

        "backend" {
            & .\restart.ps1 -Target backend -Fast -NoBrowser
            break
        }

        "ui" {
            & .\restart.ps1 -Target frontend -NoBrowser
            break
        }

        "full" {
            & .\restart.ps1 -Target full -Fast -NoBrowser -SkipSetup
            break
        }

        "service" {
            if ([string]::IsNullOrWhiteSpace($Service)) {
                throw "Please provide a service shortcut, e.g. '.\\debug.ps1 service user'"
            }
            & .\restart.ps1 -Target service -Service $Service -Fast -NoBrowser
            break
        }

        default {
            Show-Usage
            exit 0
        }
    }

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Show-Usage
    exit 1
}
