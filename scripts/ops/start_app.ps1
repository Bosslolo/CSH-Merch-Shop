# Start CSH Merch Shop (production build on :5174)

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ShopDir = Join-Path $ProjectRoot "shop"
Set-Location $ShopDir

Write-Host "Starting CSH Merch Shop (production)..." -ForegroundColor Cyan

function Import-EnvFile([string]$file, [string[]]$allowed = @()) {
    if (-not (Test-Path $file)) { return }
    Write-Host "Loading $file..." -ForegroundColor Cyan
    Get-Content $file -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $idx = $line.IndexOf("=")
        if ($idx -lt 1) { return }
        $key = $line.Substring(0, $idx).Trim()
        if ($allowed.Count -gt 0 -and $allowed -notcontains $key) { return }
        $value = $line.Substring($idx + 1).Trim()
        if ($key.Length -gt 0) { Set-Item -Path ("Env:" + $key) -Value $value }
    }
}

$sharedPayments = if ($env:CSH_SHARED_PAYMENTS_ENV) {
    $env:CSH_SHARED_PAYMENTS_ENV
} else {
    # Resolve via filesystem listing to avoid encoding issues with "Schülerfirma"
    $sf = Get-ChildItem -LiteralPath "E:\" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "Sch*lerfirma" } |
        Select-Object -First 1
    if ($sf) {
        Join-Path $sf.FullName "shared\csh-payments.env"
    } else {
        "E:\Schülerfirma\shared\csh-payments.env"
    }
}
$paymentKeys = @(
    "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_ENV",
    "PAYPAL_BUSINESS_EMAIL", "PAYPAL_BUSINESS_NAME", "PAYPAL_MANAGED_QR_ID",
    "PAYPAL_ME_HANDLE",
    "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET",
    "HUB_API_KEY"
)
Import-EnvFile $sharedPayments $paymentKeys
if (-not (Test-Path -LiteralPath $sharedPayments)) {
    Write-Host "WARN: shared payments vault not found at $sharedPayments" -ForegroundColor Yellow
}
$envFile = Join-Path $ProjectRoot "config\production.env"
$allowedKeys = @(
    "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "ADMIN_COOKIE_SECURE",
    "VOTING_ENABLED", "TRUST_PROXY", "ORDER_UNPAID_TTL_MINUTES",
    "CSH_REQUIRE_PUBLIC_URL",
    "HUB_API_KEY", "HUB_PUSH_URL", "HUB_PUSH_URLS", "HUB_PUSH_ENABLED", "HUB_PUSH_INTERVAL_SECONDS",
    "HUB_PUSH_MODE", "HUB_PUSH_LOCAL_HOST", "HUB_PUSH_LOCAL_PORT",
    "PORT",
    "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_ENV",
    "PAYPAL_BUSINESS_EMAIL", "PAYPAL_BUSINESS_NAME", "PAYPAL_MANAGED_QR_ID",
    "PAYPAL_ME_HANDLE",
    "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET",
    "STRIPE_SUCCESS_BASE_URL", "STRIPE_CANCEL_BASE_URL", "STRIPE_CHECKOUT_COMPANY_NAME",
    "SHOP_PUBLIC_BASE_URL"
)
Import-EnvFile $envFile $allowedKeys

$shopEnv = Join-Path $ShopDir ".env"
Import-EnvFile $shopEnv

$port = if ($env:PORT) { [int]$env:PORT } else { 5174 }
$env:NODE_ENV = "production"
$env:PORT = "$port"

try {
    $rule = Get-NetFirewallRule -DisplayName "CSH Merch Shop Port $port" -ErrorAction SilentlyContinue
    if (-not $rule) {
        try {
            New-NetFirewallRule -DisplayName "CSH Merch Shop Port $port" -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow -ErrorAction Stop | Out-Null
            Write-Host "Added firewall rule for port $port" -ForegroundColor Green
        } catch {
            Write-Host "WARNING: Could not add firewall rule for port $port (run as Administrator if needed)." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "WARNING: Could not configure firewall." -ForegroundColor Yellow
}

$instanceDir = Join-Path $ProjectRoot "instance"
if (-not (Test-Path $instanceDir)) { New-Item -ItemType Directory -Path $instanceDir -Force | Out-Null }

$dataDir = Join-Path $ShopDir "data"
if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }

$logOut = Join-Path $instanceDir "merch_shop.log"
$logErr = Join-Path $instanceDir "merch_shop.err.log"
$nodeExe = (Get-Command node.exe).Source

$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    $pid = @($existing)[0].OwningProcess
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    $cmd = ""
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$pid" -ErrorAction SilentlyContinue).CommandLine
    } catch {}
    if ($cmd -and $cmd -match "csh-merch-shop|dist\\index\.js") {
        Write-Host "Merch shop already running on port $port (PID $pid)." -ForegroundColor Green
        exit 0
    }
    Write-Host "Port $port already in use by another process (PID $pid)." -ForegroundColor Red
    Write-Host "Stop:  .\scripts\ops\stop_app.ps1" -ForegroundColor Yellow
    exit 1
}

$distEntry = Join-Path $ShopDir "dist\index.js"
$distPublic = Join-Path $ShopDir "dist\public\index.html"
if (-not (Test-Path $distEntry) -or -not (Test-Path $distPublic)) {
    Write-Host "Production build missing - running npm run build..." -ForegroundColor Yellow
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting production server on port $port..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
Start-Process -FilePath $nodeExe -ArgumentList "dist\index.js" -WorkingDirectory $ShopDir -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Shop:  http://localhost:$port" -ForegroundColor White
Write-Host "Public: https://shop.cs-bodensee.de" -ForegroundColor White
Write-Host "Alt:    https://shop.icicles.online" -ForegroundColor DarkGray
Write-Host "Admin: http://localhost:$port/verwaltung" -ForegroundColor White
Write-Host "Logs:  $logOut" -ForegroundColor DarkGray
Write-Host "Stop:  .\scripts\ops\stop_app.ps1" -ForegroundColor Yellow
