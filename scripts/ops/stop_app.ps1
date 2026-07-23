# Stop CSH Merch Shop (port 5174 by default)

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$port = 5174

$envFile = Join-Path $ProjectRoot "config\production.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^PORT=(.+)$') { $port = [int]$Matches[1] }
    }
}

$shopEnv = Join-Path $ProjectRoot "shop\.env"
if (Test-Path $shopEnv) {
    Get-Content $shopEnv | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^PORT=(.+)$') { $port = [int]$Matches[1] }
    }
}

Write-Host "Stopping CSH Merch Shop on port $port..." -ForegroundColor Cyan

$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
    Write-Host "Nothing listening on port $port." -ForegroundColor Yellow
    exit 0
}

foreach ($conn in $conns) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Killing $($proc.ProcessName) (PID $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Stopped." -ForegroundColor Green
