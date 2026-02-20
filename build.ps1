# Build script for Carousel backend and frontend
# Usage: .\build.ps1 [-BackendOnly] [-FrontendOnly]

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

# Default: build both
$buildBackend = $true
$buildFrontend = $true

if ($BackendOnly) { $buildFrontend = $false }
if ($FrontendOnly) { $buildBackend = $false }

Write-ColorOutput "Green" "=== Carousel Build Script ===" 
Write-ColorOutput "Green" "Starting build at $(Get-Date)"

# Build Backend
if ($buildBackend) {
    Write-ColorOutput "Cyan" "`nBuilding Backend..."
    try {
        Push-Location -Path ".\backend"
        mvn clean package -DskipTests
        if ($LASTEXITCODE -ne 0) {
            throw "Backend build failed"
        }
        Pop-Location
        Write-ColorOutput "Green" "âœ“ Backend built successfully"
    } catch {
        Write-ColorOutput "Red" "âœ— Backend build failed: $_"
        exit 1
    }
}

# Build Frontend
if ($buildFrontend) {
    Write-ColorOutput "Cyan" "`nBuilding Frontend..."
    try {
        Push-Location -Path ".\frontend"
        npm install
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }
        Pop-Location
        Write-ColorOutput "Green" "âœ“ Frontend built successfully"
    } catch {
        Write-ColorOutput "Red" "âœ— Frontend build failed: $_"
        exit 1
    }
}

Write-ColorOutput "Green" "`n=== Build completed successfully at $(Get-Date) ===" 

