param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$Url = 'http://127.0.0.1:6010',
    [string]$Environment = 'Production',
    [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'

$apiProject = Join-Path $ProjectRoot 'backend/src/qMRI.Api/qMRI.Api.csproj'
$apiDir = Join-Path $ProjectRoot 'backend/src/qMRI.Api'
$logDir = Join-Path $ProjectRoot 'logs'
$outLog = Join-Path $logDir 'seed-topp-api.out.log'
$errLog = Join-Path $logDir 'seed-topp-api.err.log'

if (-not (Test-Path $apiProject)) {
    throw "API project not found at $apiProject"
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue

if (-not $NoBuild) {
    dotnet build $apiProject --no-restore
}

$env:ASPNETCORE_ENVIRONMENT = $Environment
$env:ASPNETCORE_URLS = $Url

$process = Start-Process `
    -FilePath 'dotnet' `
    -ArgumentList "run --no-build --project `"$apiProject`" --urls $Url" `
    -WorkingDirectory $apiDir `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru `
    -WindowStyle Hidden

try {
    $healthUri = "$Url/api/v1/health"
    $seedUri = "$Url/api/v1/admin/seed/topp"
    $deadline = (Get-Date).AddSeconds(90)
    $started = $false

    while ((Get-Date) -lt $deadline) {
        if ($process.HasExited) {
            throw "Temporary API exited early with code $($process.ExitCode). Check $outLog and $errLog"
        }

        try {
            Invoke-RestMethod -Method Get -Uri $healthUri -TimeoutSec 5 | Out-Null
            $started = $true
            break
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    if (-not $started) {
        throw "Temporary API did not become healthy at $healthUri. Check $outLog and $errLog"
    }

    $body = @{ overwriteExisting = $true } | ConvertTo-Json
    $result = Invoke-RestMethod -Method Post -Uri $seedUri -ContentType 'application/json' -Body $body -TimeoutSec 180

    Write-Host 'TOPP seed completed.'
    $result | ConvertTo-Json -Depth 8
} finally {
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}
