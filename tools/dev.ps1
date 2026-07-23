param(
    [int]$SmokeTestSeconds = 0
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$processes = @()

function Test-DevPort {
    param(
        [int]$Port
    )

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $task = $client.ConnectAsync('127.0.0.1', $Port)
        if (-not $task.Wait(300)) {
            return $false
        }

        return $client.Connected
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Start-DevProcess {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$ArgumentList,
        [hashtable]$Environment = @{}
    )

    foreach ($key in $Environment.Keys) {
        [Environment]::SetEnvironmentVariable($key, [string]$Environment[$key], 'Process')
    }

    Write-Host "Starting $Name..."
    $process = Start-Process `
        -FilePath $FilePath `
        -ArgumentList $ArgumentList `
        -WorkingDirectory $root `
        -NoNewWindow `
        -PassThru

    return [pscustomobject]@{
        Name = $Name
        Process = $process
    }
}

function Stop-DevProcesses {
    foreach ($entry in $script:processes) {
        $process = $entry.Process
        if ($null -ne $process -and -not $process.HasExited) {
            Write-Host "Stopping $($entry.Name)..."
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

try {
    if (Test-DevPort -Port 6000) {
        Write-Host 'Backend already running on http://44.216.167.20:6000; reusing it.'
    }
    else {
        $processes += Start-DevProcess `
            -Name 'backend' `
            -FilePath 'dotnet' `
            -ArgumentList @('run', '--project', 'backend/src/qMRI.Api/qMRI.Api.csproj', '--launch-profile', 'http') `
            -Environment @{ ASPNETCORE_ENVIRONMENT = 'Development' }
    }

    $npmExecutable = if ($IsWindows -or $env:OS -eq 'Windows_NT') { 'npm.cmd' } else { 'npm' }

    $processes += Start-DevProcess `
        -Name 'frontend' `
        -FilePath $npmExecutable `
        -ArgumentList @('--prefix', 'frontend', 'run', 'dev')

    Write-Host ''
    Write-Host 'qMRI dev servers are starting.'
    Write-Host 'Backend:  http://44.216.167.20:6000'
    Write-Host 'Frontend: Vite will print its local URL below, usually http://44.216.167.20:8085'
    Write-Host 'Press Ctrl+C to stop the servers started by this command.'
    Write-Host ''

    $startedAt = Get-Date
    while ($true) {
        Start-Sleep -Seconds 1

        if ($SmokeTestSeconds -gt 0 -and ((Get-Date) - $startedAt).TotalSeconds -ge $SmokeTestSeconds) {
            break
        }

        foreach ($entry in $processes) {
            if ($entry.Process.HasExited) {
                $code = $entry.Process.ExitCode
                if ($code -ne 0) {
                    throw "$($entry.Name) exited with code $code."
                }

                return
            }
        }
    }
}
finally {
    Stop-DevProcesses
}