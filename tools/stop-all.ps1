[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [int[]]$Ports = @(8081, 5000, 7018, 4173),
    [switch]$SkipProjectProcessSweep
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Get-ListeningPidMap {
    param([int[]]$TargetPorts)

    $pidPorts = @{}
    $portList = @($TargetPorts | Sort-Object -Unique)

    foreach ($line in netstat -ano -p TCP) {
        if ($line -notmatch '^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$') {
            continue
        }

        $port = [int]$matches[1]
        $processId = [int]$matches[2]

        if ($processId -le 0 -or -not ($portList -contains $port)) {
            continue
        }

        if (-not $pidPorts.ContainsKey($processId)) {
            $pidPorts[$processId] = @()
        }

        $pidPorts[$processId] += $port
    }

    return $pidPorts
}

function Stop-ProcessTree {
    param(
        [int]$ProcessId,
        [string]$Reason
    )

    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        $processName = $process.ProcessName
    }
    catch {
        $processName = 'unknown'
    }

    $target = "PID $ProcessId ($processName) - $Reason"
    if (-not $PSCmdlet.ShouldProcess($target, 'Force stop process tree')) {
        return
    }

    & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Stopped $target."
        return
    }

    try {
        Stop-Process -Id $ProcessId -Force -ErrorAction Stop
        Write-Host "Stopped $target."
    }
    catch {
        Write-Warning "Failed to stop $target. $($_.Exception.Message)"
    }
}

function Get-ProjectProcessIds {
    $escapedRoot = [regex]::Escape($root)
    $ids = New-Object System.Collections.Generic.HashSet[int]

    try {
        $processes = Get-CimInstance Win32_Process -ErrorAction Stop |
            Where-Object {
                $_.ProcessId -ne $PID -and
                $_.Name -match '^(node|npm|dotnet)(\.exe)?$' -and
                $_.CommandLine -match $escapedRoot
            }

        foreach ($process in $processes) {
            [void]$ids.Add([int]$process.ProcessId)
        }
    }
    catch {
        Write-Warning "Could not inspect command lines for project-process cleanup. $($_.Exception.Message)"
    }

    return $ids
}

$portList = @($Ports | Sort-Object -Unique)
$pidPorts = Get-ListeningPidMap -TargetPorts $portList

foreach ($processId in ($pidPorts.Keys | Sort-Object)) {
    $portsText = (($pidPorts[$processId] | Sort-Object -Unique) -join ', ')
    Stop-ProcessTree -ProcessId $processId -Reason "listening on port(s) $portsText"
}

if (-not $SkipProjectProcessSweep) {
    foreach ($processId in (Get-ProjectProcessIds | Sort-Object)) {
        Stop-ProcessTree -ProcessId $processId -Reason 'qMRI project dev process'
    }
}

$remaining = Get-ListeningPidMap -TargetPorts $portList
if ($remaining.Count -eq 0) {
    Write-Host "No qMRI dev ports are listening: $($portList -join ', ')."
    return
}

Write-Warning 'Some qMRI dev ports are still listening:'
foreach ($processId in ($remaining.Keys | Sort-Object)) {
    $portsText = (($remaining[$processId] | Sort-Object -Unique) -join ', ')
    Write-Warning "PID $processId on port(s) $portsText"
}
