[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [int[]]$Ports = @(5173, 5254, 7018, 4173)
)

$ErrorActionPreference = 'Stop'

$pidPorts = @{}
$portList = ($Ports | Sort-Object -Unique)

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

if ($pidPorts.Count -eq 0) {
    Write-Host "No qMRI dev ports are listening: $($portList -join ', ')."
    return
}

foreach ($processId in ($pidPorts.Keys | Sort-Object)) {
    $portsText = (($pidPorts[$processId] | Sort-Object -Unique) -join ', ')

    try {
        $process = Get-Process -Id $processId -ErrorAction Stop
        $processName = $process.ProcessName
    }
    catch {
        $processName = 'unknown'
    }

    $target = "PID $processId ($processName) on port(s) $portsText"
    if (-not $PSCmdlet.ShouldProcess($target, 'Stop process')) {
        continue
    }

    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Write-Host "Stopped $target."
    }
    catch {
        Write-Warning "Failed to stop $target. $($_.Exception.Message)"
    }
}