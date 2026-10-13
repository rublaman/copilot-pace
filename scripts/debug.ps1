# Launch separately from js-debug's extensionHost bootstrap, which can crash before activation.
# The matching node attach configuration lives in .vscode/launch.json.
$ErrorActionPreference = 'Stop'
$debugPort = 9333
$projectRoot = Split-Path -Parent $PSScriptRoot
$developmentPath = Join-Path $projectRoot 'out/development'
$profilePath = Join-Path $projectRoot '.vscode-test/debug-profile'

function Test-DebugHost {
    $listener = Get-NetTCPConnection -LocalPort $debugPort -State Listen -ErrorAction SilentlyContinue
    if (-not $listener) { return $false }
    foreach ($connection in $listener) {
        $debugProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
        $commandLine = ([string]$debugProcess.CommandLine).Replace('/', '\')
        $expectedProfile = $profilePath.Replace('/', '\')
        if ($debugProcess.Name -ne 'Code.exe' -or
            $commandLine -notmatch ([regex]::Escape($expectedProfile) + '(?=["\s]|$)') -or
            $connection.LocalAddress -ne '127.0.0.1') {
            throw "Port $debugPort is in use by another process. Close that process or choose a matching port in debug.ps1 and launch.json."
        }
    }
    $targets = Invoke-RestMethod -Uri "http://127.0.0.1:$debugPort/json/list" -TimeoutSec 3
    return @($targets | Where-Object { $_.type -eq 'node' -and $_.webSocketDebuggerUrl }).Count -gt 0
}

if (-not (Test-Path -LiteralPath (Join-Path $developmentPath 'dist/extension.js'))) {
    throw 'Development build missing. Run npm run build first.'
}
if (Test-DebugHost) {
    Write-Output "Reusing Copilot Pace debug host on port $debugPort. Reload its window to load rebuilt code."
    exit 0
}

$codeCommand = Get-Command code -ErrorAction Stop
$codeArgs = @(
    '--new-window', "--extensionDevelopmentPath=$developmentPath", '--disable-extensions',
    "--user-data-dir=$profilePath", "--inspect-extensions=$debugPort", '--skip-welcome', '--skip-release-notes'
)
# Start the CLI outside the task's terminal so the GUI cannot keep the pre-launch task alive.
$quotedCodeArgs = $codeArgs | ForEach-Object { '"{0}"' -f $_ }
$debugLauncher = Start-Process -FilePath $codeCommand.Source -ArgumentList $quotedCodeArgs -WindowStyle Hidden -PassThru

$deadline = [DateTime]::UtcNow.AddSeconds(30)
do {
    $debugLauncher.Refresh()
    if ($debugLauncher.HasExited -and $debugLauncher.ExitCode -and $debugLauncher.ExitCode -ne 0) {
        throw "VS Code launch failed with exit code $($debugLauncher.ExitCode)."
    }
    if (Test-DebugHost) {
        Write-Output "Copilot Pace debug host ready on 127.0.0.1:$debugPort."
        exit 0
    }
    Start-Sleep -Milliseconds 500
} while ([DateTime]::UtcNow -lt $deadline)
throw "The debug host did not become ready. Check logs under $profilePath/logs."
