# Configura JAVA_HOME para el usuario de Windows (persistente) y PATH.
# Requiere: JDK instalado (p. ej. Temurin 21). Si no hay JDK, muestra como instalarlo.
# Uso (PowerShell):
#   cd proyecto-pizzeria
#   .\scripts\Configure-JavaHome.ps1
# Abre una nueva terminal despues para que Cursor/IDE tome las variables.

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'JavaHome.ps1')

if (-not (Set-JavaHomeSession)) {
    Write-Host ''
    Write-Host '[X] No se encontro ningun JDK (java.exe).' -ForegroundColor Red
    Write-Host 'Instala JDK 21 (Temurin) con winget en una consola elevada si hace falta:' -ForegroundColor Yellow
    Write-Host '  winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements' -ForegroundColor Cyan
    Write-Host ''
    exit 1
}

$javaHome = $env:JAVA_HOME
Write-Host "[OK] JAVA_HOME = $javaHome" -ForegroundColor Green
& (Join-Path $javaHome 'bin\java.exe') '-version'

[Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, 'User')

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$binPath = Join-Path $javaHome 'bin'
if ($userPath -notlike "*${binPath}*") {
    $newPath = if ($userPath) { "$userPath;$binPath" } else { $binPath }
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    Write-Host '[OK] Se agrego al PATH de usuario: ' -NoNewline -ForegroundColor Green
    Write-Host $binPath
} else {
    Write-Host '[OK] PATH de usuario ya incluye bin del JDK.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Cierra y vuelve a abrir terminales y Cursor para que carguen JAVA_HOME.' -ForegroundColor Yellow
Write-Host ''
