# Autostart wrapper for CSH Merch Shop (used by Windows Scheduled Task)

$ErrorActionPreference = "Continue"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$LogDir = Join-Path $ProjectRoot "instance"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$bootLog = Join-Path $LogDir "autostart.log"
function Write-Boot([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Add-Content -Path $bootLog -Value $line -Encoding UTF8
}

Write-Boot "MerchShopAutoStart begin"
try {
    # Give the network a moment after reboot
    Start-Sleep -Seconds 15

    $port = 5174
    $listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Boot "Port $port already listening - skip start"
        exit 0
    }

    & (Join-Path $PSScriptRoot "start_app.ps1")
    Write-Boot ("start_app.ps1 finished exit=" + $LASTEXITCODE)
}
catch {
    Write-Boot ("ERROR: " + $_.Exception.Message)
    exit 1
}
