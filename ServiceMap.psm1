# Helper module to parse and manage service shortcuts
# This module provides functions to work with the shortcuts.map file

function Get-ServiceMap {
    param(
        [string]$MapFilePath = ".\shortcuts.map"
    )

    if (-not (Test-Path $MapFilePath)) {
        Write-Error "shortcuts.map file not found at $MapFilePath"
        return $null
    }

    $services = @{}
    $lines = Get-Content $MapFilePath -ErrorAction SilentlyContinue
    
    if (-not $lines) {
        Write-Error "shortcuts.map file is empty"
        return $null
    }

    # Ensure lines is always an array
    if ($lines -isnot [array]) {
        $lines = @($lines)
    }

    foreach ($line in $lines) {
        # Skip empty lines and comments
        if (-not $line -or $line.StartsWith("#")) {
            continue
        }

        $line = $line.Trim()
        if (-not $line) {
            continue
        }

        $parts = $line -split ":"
        if ($parts.Count -lt 5) {
            continue
        }

        $shortcut = $parts[0].Trim()
        # Health URL may contain colons (e.g., http://localhost:8001/...), so join remaining parts
        $healthUrl = ($parts[4..($parts.Count - 1)] -join ":").Trim()
        
        $services[$shortcut] = @{
            Shortcut    = $shortcut
            Name        = $parts[1].Trim()
            Path        = $parts[2].Trim()
            Port        = [int]$parts[3].Trim()
            HealthUrl   = $healthUrl
        }
    }

    if ($services.Count -eq 0) {
        Write-Error "No services found in $MapFilePath"
        return $null
    }

    return $services
}

function Get-ServiceByShortcut {
    param(
        [hashtable]$ServiceMap,
        [string]$Shortcut
    )

    $key = $Shortcut.ToLower().Trim()
    if ($ServiceMap.ContainsKey($key)) {
        return $ServiceMap[$key]
    }

    # Also try by full service name
    foreach ($svc in $ServiceMap.Values) {
        if ($svc.Name -eq $key) {
            return $svc
        }
    }

    return $null
}

function Get-AllServiceShortcuts {
    param(
        [hashtable]$ServiceMap
    )

    return @($ServiceMap.Keys | Sort-Object)
}

function Resolve-ServiceShortcut {
    param(
        [string]$Input,
        [hashtable]$ServiceMap
    )

    $service = Get-ServiceByShortcut $ServiceMap $Input
    if ($service) {
        return $service.Shortcut
    }

    return $null
}

Export-ModuleMember -Function @(
    'Get-ServiceMap',
    'Get-ServiceByShortcut',
    'Get-AllServiceShortcuts',
    'Resolve-ServiceShortcut'
)
