# Launch script for Carousel full stack (backend + frontend)
# Usage:
#   ./launch.ps1                # Launch backend then frontend
#   ./launch.ps1 frontend       # Launch only frontend
#   ./launch.ps1 backend        # Launch all backend services
#   ./launch.ps1 <shortcut>     # Launch one backend service by shortcut

param(
    [string]$Target
)

function Start-Backend($service) {
    if ($service) {
        Write-Host "[>] Launching backend service: $service" -ForegroundColor Cyan
        & ./launch-backend.ps1 -Service $service -AutoStartPostgres
    } else {
        Write-Host "[>] Launching all backend services" -ForegroundColor Cyan
        & ./launch-backend.ps1 -AutoStartPostgres
    }
}

function Start-Frontend {
    Write-Host "[>] Launching frontend" -ForegroundColor Cyan
    & ./launch-frontend.ps1
}

if (-not $Target) {
    Start-Backend $null
    Start-Frontend
    exit 0
}

switch ($Target.ToLower()) {
    "frontend" {
        Start-Frontend
        break
    }
    "backend" {
        Start-Backend $null
        break
    }
    "auth" { Start-Backend "auth"; break }
    "user" { Start-Backend "user"; break }
    "approve" { Start-Backend "approve"; break }
    "roles" { Start-Backend "roles"; break }
    "inventory" { Start-Backend "inventory"; break }
    "styles" { Start-Backend "styles"; break }
    "flow" { Start-Backend "flow"; break }
    "gateway" { Start-Backend "gateway"; break }
    default {
        Write-Host "[-] Unknown target: $Target" -ForegroundColor Red
        Write-Host "Valid options: (none), frontend, backend, auth, user, approve, roles, inventory, styles, flow, gateway" -ForegroundColor Yellow
        exit 1
    }
}
