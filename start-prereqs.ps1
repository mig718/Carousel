# Start required local dependencies for backend development
# Ensures Docker engine is running and PostgreSQL container is reachable on localhost:5432

[CmdletBinding()]
param(
    [switch]$CheckOnly,
    [switch]$SkipPostgres,
    [int]$DockerTimeoutSeconds = 120,
    [int]$PostgresTimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($color, $message) {
    Write-Host $message -ForegroundColor $color
}

function Test-TcpPortOpen([string]$hostName = "127.0.0.1", [int]$port, [int]$timeoutMs = 700) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $asyncResult = $client.BeginConnect($hostName, $port, $null, $null)
        if (-not $asyncResult.AsyncWaitHandle.WaitOne($timeoutMs, $false)) {
            return $false
        }

        $client.EndConnect($asyncResult)
        return $true
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Test-DockerEngineReady {
    try {
        & docker info *> $null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

function Wait-DockerEngineReady([int]$timeoutSeconds) {
    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if (Test-DockerEngineReady) {
            return $true
        }

        Start-Sleep -Seconds 2
        $elapsed += 2
    }

    return $false
}

function Ensure-DockerEngine([int]$timeoutSeconds) {
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "Red" "[-] Docker CLI is not installed or not in PATH."
        return $false
    }

    if (Test-DockerEngineReady) {
        Write-ColorOutput "Green" "[+] Docker engine is ready"
        return $true
    }

    $dockerDesktopCandidates = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LocalAppData\Programs\Docker\Docker\Docker Desktop.exe"
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    $dockerDesktop = $dockerDesktopCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($dockerDesktop) {
        Write-ColorOutput "Yellow" "[i] Docker engine is not ready. Attempting to start Docker Desktop..."
        try {
            Start-Process -FilePath $dockerDesktop | Out-Null
        } catch {
            Write-ColorOutput "Yellow" "[i] Unable to launch Docker Desktop executable directly: $($_.Exception.Message)"
        }
    }

    try {
        $dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
        if ($dockerService -and $dockerService.Status -ne "Running") {
            Write-ColorOutput "Yellow" "[i] Starting Windows service com.docker.service..."
            Start-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
        }
    } catch {
    }

    if (Wait-DockerEngineReady $timeoutSeconds) {
        Write-ColorOutput "Green" "[+] Docker engine is ready"
        return $true
    }

    Write-ColorOutput "Red" "[-] Docker engine did not become ready within $timeoutSeconds seconds."
    Write-ColorOutput "Yellow" "[i] Open Docker Desktop and verify with: docker info"
    return $false
}

function Check-DockerEngine {
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "Red" "[-] Docker CLI is not installed or not in PATH."
        return $false
    }

    if (-not (Test-DockerEngineReady)) {
        Write-ColorOutput "Red" "[-] Docker engine is not ready."
        Write-ColorOutput "Yellow" "[i] Start with: npm run start:deps"
        return $false
    }

    Write-ColorOutput "Green" "[+] Docker engine is ready"
    return $true
}

function Ensure-Postgres([int]$timeoutSeconds) {
    if (Test-TcpPortOpen -port 5432) {
        Write-ColorOutput "Green" "[+] PostgreSQL is already reachable on localhost:5432"
        return $true
    }

    Write-ColorOutput "Yellow" "[i] PostgreSQL not reachable. Starting postgres container..."
    try {
        & docker compose up -d postgres | Out-Null
    } catch {
        Write-ColorOutput "Red" "[-] Failed to start postgres container: $($_.Exception.Message)"
        return $false
    }

    $elapsed = 0
    while ($elapsed -lt $timeoutSeconds) {
        if (Test-TcpPortOpen -port 5432) {
            Write-ColorOutput "Green" "[+] PostgreSQL is reachable on localhost:5432"
            return $true
        }

        Start-Sleep -Seconds 1
        $elapsed += 1
    }

    Write-ColorOutput "Red" "[-] PostgreSQL did not become reachable within $timeoutSeconds seconds."
    Write-ColorOutput "Yellow" "[i] Quick checks: docker compose ps postgres ; docker compose logs --tail 50 postgres"
    return $false
}

function Check-PostgresReady {
    if (Test-TcpPortOpen -port 5432) {
        Write-ColorOutput "Green" "[+] PostgreSQL is reachable on localhost:5432"
        return $true
    }

    Write-ColorOutput "Red" "[-] PostgreSQL is not reachable on localhost:5432"
    Write-ColorOutput "Yellow" "[i] Start with: npm run start:deps"
    return $false
}

if ($CheckOnly) {
    Write-ColorOutput "Cyan" "=== Carousel Dependency Check ==="

    if (-not (Check-DockerEngine)) {
        exit 1
    }

    if ($SkipPostgres) {
        Write-ColorOutput "Yellow" "[i] SkipPostgres enabled. Skipping PostgreSQL readiness check."
        exit 0
    }

    if (-not (Check-PostgresReady)) {
        exit 1
    }

    Write-ColorOutput "Green" "[+] Dependency check passed"
    exit 0
}

Write-ColorOutput "Cyan" "=== Carousel Prerequisite Startup ==="

if (-not (Ensure-DockerEngine $DockerTimeoutSeconds)) {
    exit 1
}

if ($SkipPostgres) {
    Write-ColorOutput "Yellow" "[i] SkipPostgres enabled. Skipping PostgreSQL startup check."
    exit 0
}

if (-not (Ensure-Postgres $PostgresTimeoutSeconds)) {
    exit 1
}

Write-ColorOutput "Green" "[+] Prerequisites are ready"
exit 0
