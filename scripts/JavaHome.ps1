# Funciones para resolver JAVA_HOME en Windows (PowerShell 5.1+)
# Uso: . .\scripts\JavaHome.ps1; Set-JavaHomeSession

function Test-JavaHomePath {
    param([string]$Path)
    if (-not $Path) { return $false }
    return (Test-Path -LiteralPath (Join-Path $Path 'bin\java.exe'))
}

function Get-JavaHomeFromExistingEnv {
    if (Test-JavaHomePath $env:JAVA_HOME) {
        return $env:JAVA_HOME
    }
    return $null
}

function Get-JavaHomeFromPath {
    try {
        $cmd = Get-Command 'java.exe' -ErrorAction Stop
        $bin = Split-Path -Parent $cmd.Source
        $jdkRoot = Split-Path -Parent $bin
        if (Test-JavaHomePath $jdkRoot) { return $jdkRoot }
    } catch { }
    return $null
}

function Get-JavaHomeFromKnownRoots {
    $roots = @(
        'C:\Program Files\Eclipse Adoptium',
        'C:\Program Files\Java',
        'C:\Program Files\Microsoft',
        'C:\Program Files\Amazon Corretto',
        'C:\Program Files\Zulu',
        (Join-Path $env:LOCALAPPDATA 'Programs\Eclipse Adoptium')
    )
    foreach ($root in $roots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        foreach ($dir in Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue) {
            $candidate = $dir.FullName
            if (Test-JavaHomePath $candidate) { return $candidate }
            foreach ($inner in Get-ChildItem -LiteralPath $candidate -Directory -ErrorAction SilentlyContinue) {
                if (Test-JavaHomePath $inner.FullName) { return $inner.FullName }
            }
        }
    }
    return $null
}

function Get-ResolvedJavaHome {
    $h = Get-JavaHomeFromExistingEnv
    if ($h) { return $h }
    $h = Get-JavaHomeFromPath
    if ($h) { return $h }
    return Get-JavaHomeFromKnownRoots
}

function Set-JavaHomeSession {
    $jdkRoot = Get-ResolvedJavaHome
    if (-not $jdkRoot) {
        return $false
    }
    $env:JAVA_HOME = $jdkRoot
    $binDir = Join-Path $jdkRoot 'bin'
    if ($env:Path -notlike "*${binDir}*") {
        $env:Path = "$binDir;$env:Path"
    }
    return $true
}
