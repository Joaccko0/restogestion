#Requires -Version 5.1
# Inicia Backend (Spring Boot) y Frontend (Vite) en paralelo - equivalente a start.sh
# Uso: .\start.ps1   o   doble clic en start.bat
# Mensajes en ASCII para evitar errores de codificacion en Windows PowerShell 5.1

$ErrorActionPreference = 'Stop'

$ProjectDir = $PSScriptRoot
$JavaHomeScript = Join-Path $ProjectDir 'scripts\JavaHome.ps1'
if (Test-Path -LiteralPath $JavaHomeScript) {
    . $JavaHomeScript
    if (-not (Set-JavaHomeSession)) {
        Write-Host '[X] No se encontro JDK (JAVA_HOME). El backend necesita Java 21.' -ForegroundColor Red
        Write-Host '    1) Instala Temurin 21: winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements' -ForegroundColor Yellow
        Write-Host '    2) Configura variables: .\scripts\Configure-JavaHome.ps1' -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[OK] JAVA_HOME = $env:JAVA_HOME" -ForegroundColor Green
    Write-Host ''
}
$BackendDir = Join-Path $ProjectDir 'backend'
$FrontendDir = Join-Path $ProjectDir 'frontend'
$BackendLog = Join-Path $env:TEMP 'pizzeria-backend.log'
$FrontendLog = Join-Path $env:TEMP 'pizzeria-frontend.log'

function Stop-Tree {
    param([int]$ProcessId)
    if ($ProcessId -gt 0) {
        & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
    }
}

Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Iniciando Pizzeria Backend + Frontend ' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $BackendDir -PathType Container)) {
    Write-Host "[X] Error: Directorio backend no encontrado en $BackendDir" -ForegroundColor Red
    exit 1
}

$mvnwCmd = Join-Path $BackendDir 'mvnw.cmd'
if (Test-Path -LiteralPath $mvnwCmd) {
    $backendCmd = 'mvnw.cmd spring-boot:run'
} else {
    $backendCmd = 'mvn spring-boot:run'
}

Write-Host '>> Iniciando Backend (Spring Boot)...' -ForegroundColor Yellow
$backendArg = "$backendCmd > `"$BackendLog`" 2>&1"
$pBackend = Start-Process -FilePath 'cmd.exe' -WorkingDirectory $BackendDir -ArgumentList @(
    '/c', $backendArg
) -PassThru -WindowStyle Hidden

Write-Host "[OK] Backend iniciado (PID: $($pBackend.Id))" -ForegroundColor Green
Write-Host "  Logs: Get-Content `"$BackendLog`" -Wait -Tail 50"
Write-Host ''

Start-Sleep -Seconds 3

Write-Host '>> Iniciando Frontend (Vite)...' -ForegroundColor Yellow
if (-not (Test-Path -LiteralPath $FrontendDir -PathType Container)) {
    Write-Host "[X] Error: Directorio frontend no encontrado en $FrontendDir" -ForegroundColor Red
    Stop-Tree -ProcessId $pBackend.Id
    exit 1
}

$nodeModules = Join-Path $FrontendDir 'node_modules'
if (-not (Test-Path -LiteralPath $nodeModules -PathType Container)) {
    Write-Host '  Installing dependencies...' -ForegroundColor Yellow
    Push-Location $FrontendDir
    try {
        npm install
    } finally {
        Pop-Location
    }
}

$frontendArg = "npm run dev > `"$FrontendLog`" 2>&1"
$pFrontend = Start-Process -FilePath 'cmd.exe' -WorkingDirectory $FrontendDir -ArgumentList @(
    '/c', $frontendArg
) -PassThru -WindowStyle Hidden

Write-Host "[OK] Frontend iniciado (PID: $($pFrontend.Id))" -ForegroundColor Green
Write-Host "  Logs: Get-Content `"$FrontendLog`" -Wait -Tail 50"
Write-Host ''

Write-Host '========================================' -ForegroundColor Cyan
Write-Host '        Servicios en ejecucion          ' -ForegroundColor Cyan
Write-Host '----------------------------------------' -ForegroundColor Cyan
Write-Host ' Backend:  http://localhost:8080        ' -ForegroundColor Cyan
Write-Host ' Frontend: http://localhost:5173        ' -ForegroundColor Cyan
Write-Host ' API:      http://localhost:8080/api    ' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Presiona Ctrl+C para detener ambos servicios' -ForegroundColor Yellow
Write-Host ''

try {
    while ($true) {
        Start-Sleep -Seconds 3600
    }
} finally {
    Write-Host ''
    Write-Host '[...] Deteniendo procesos...' -ForegroundColor Yellow
    Stop-Tree -ProcessId $pBackend.Id
    Stop-Tree -ProcessId $pFrontend.Id
    Write-Host '[OK] Procesos terminados' -ForegroundColor Green
}
