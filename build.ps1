# Build script for Carousel backend and frontend
# Usage: .\.build.ps1 [[-Service] <shortcut>] [-BackendOnly] [-FrontendOnly]
# Service shortcuts: auth, user, approve, gateway
# Examples: 
#   .\.build.ps1                     # Build all backend and frontend
#   .\.build.ps1 -BackendOnly        # Build all backend services only
#   .\.build.ps1 -FrontendOnly       # Build frontend only
#   .\.build.ps1 -Service auth       # Build auth-service only

param(
    [string]$Service,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"

# Import service map helper
Import-Module -Name ".\\ServiceMap.psm1" -Force

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

# Load service map
$ServiceMap = Get-ServiceMap ".\\shortcuts.map"
if (-not $ServiceMap) {
    Write-ColorOutput "Red" "Failed to load service map"
    exit 1
}

# Default: build both
$buildBackend = $true
$buildFrontend = $true
$buildSpecificService = $false

if ($BackendOnly) { $buildFrontend = $false }
if ($FrontendOnly) { $buildBackend = $false }

# Check if a specific service was requested
if ($Service) {
    $resolvedService = Get-ServiceByShortcut $ServiceMap $Service
    if (-not $resolvedService) {
        Write-ColorOutput "Red" "Unknown service: '$Service'"
        $allServices = Get-AllServiceShortcuts $ServiceMap
        Write-ColorOutput "Yellow" "Available services: $($allServices -join ', ')"
        exit 1
    }
    $buildBackend = $true
    $buildFrontend = $false
    $buildSpecificService = $true
}

Write-ColorOutput "Green" "=== Carousel Build Script ===" 
Write-ColorOutput "Green" "Starting build at $(Get-Date)"

# Build Backend
if ($buildBackend) {
    if ($buildSpecificService) {
        $svc = Get-ServiceByShortcut $ServiceMap $Service
        Write-ColorOutput "Cyan" "`nBuilding $($svc.Name)..."
        try {
            Push-Location -Path $svc.Path
            mvn clean package -DskipTests
            if ($LASTEXITCODE -ne 0) {
                throw "$($svc.Name) build failed"
            }
            Pop-Location
            Write-ColorOutput "Green" "`nOK: $($svc.Name) built successfully"
        } catch {
            Write-ColorOutput "Red" "`nERROR: $($svc.Name) build failed: $_"
            exit 1
        }
    } else {
        Write-ColorOutput "Cyan" "`nBuilding Backend (all services)..."
        try {
            Push-Location -Path ".\\backend"
            mvn clean package -DskipTests
            if ($LASTEXITCODE -ne 0) {
                throw "Backend build failed"
            }
            Pop-Location
            Write-ColorOutput "Green" "`nOK: Backend built successfully"
        } catch {
            Write-ColorOutput "Red" "`nERROR: Backend build failed: $_"
            exit 1
        }
    }
}

# Build Frontend
if ($buildFrontend) {
    Write-ColorOutput "Cyan" "`nBuilding Frontend..."
    try {
        Push-Location -Path ".\frontend"
        npm install --legacy-peer-deps
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }
        Pop-Location
        Write-ColorOutput "Green" "`nOK: Frontend built successfully"
    } catch {
        Write-ColorOutput "Red" "`nERROR: Frontend build failed: $_"
        exit 1
    }
}

Write-ColorOutput "Green" "`n=== Build completed successfully at $(Get-Date) ==="

