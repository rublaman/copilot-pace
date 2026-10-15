[CmdletBinding()]
param(
    [string]$Root = (Get-Location).Path,
    [string]$VsixPath,
    [switch]$WriteMetadata
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$manifest = Get-Content -LiteralPath (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json
if (-not $VsixPath) { $VsixPath = Join-Path $Root "dist/$($manifest.name)-$($manifest.version).vsix" }
$archive = [System.IO.Compression.ZipFile]::OpenRead($VsixPath)
try {
    function Read-Entry([string]$Name) {
        $entry = $archive.GetEntry($Name)
        if (-not $entry) { throw "Required VSIX entry is missing: $Name" }
        $reader = [System.IO.StreamReader]::new($entry.Open())
        try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
    }
    $packaged = Read-Entry 'extension/package.json' | ConvertFrom-Json
    foreach ($field in @('name', 'publisher', 'version', 'preview', 'main', 'license')) {
        if ($packaged.$field -cne $manifest.$field) { throw "Packaged manifest differs: $field" }
    }
    [xml]$xml = Read-Entry 'extension.vsixmanifest'
    $identity = $xml.PackageManifest.Metadata.Identity
    if ($identity.Id -cne $manifest.name -or $identity.Publisher -cne $manifest.publisher -or
        $identity.Version -cne $manifest.version) { throw 'VSIX identity or version differs from the manifest.' }
    $allowed = '^extension/(package\.json|readme\.md|changelog\.md|licen[cs]e(\.(md|txt))?|dist/extension\.js|images/copilot-pace(-128\.png|-1024\.png|\.svg|-ui\.svg|-ui-dark\.svg))$'
    foreach ($entry in $archive.Entries) {
        if ($entry.FullName -cne '[Content_Types].xml' -and $entry.FullName -cne 'extension.vsixmanifest' -and
            $entry.FullName -notmatch $allowed) { throw "Unexpected VSIX entry: $($entry.FullName)" }
    }
    $null = Read-Entry 'extension/readme.md'
    $null = Read-Entry 'extension/changelog.md'
    $null = Read-Entry "extension/$($manifest.icon)"
    $null = Read-Entry 'extension/images/copilot-pace-ui.svg'
    $null = Read-Entry 'extension/images/copilot-pace-ui-dark.svg'
    $bundle = Read-Entry 'extension/dist/extension.js'
    foreach ($marker in @('synthetic-session', 'synthetic-not-a-credential', 'copilotPace.demo', 'copilotPace.useGitHub', 'mockScenario')) {
        if ($bundle.Contains($marker)) { throw "Demo code found in the VSIX: $marker" }
    }
    if ($manifest.license -ne 'UNLICENSED' -and -not ($archive.Entries.FullName -match '^extension/licen[cs]e(\.(md|txt))?$')) {
        throw 'The distribution license is missing from the VSIX.'
    }
} finally { $archive.Dispose() }

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $VsixPath).Hash.ToLowerInvariant()
if ($WriteMetadata) {
    $directory = Split-Path -Parent $VsixPath
    $filename = Split-Path -Leaf $VsixPath
    Set-Content -LiteralPath (Join-Path $directory 'SHA256SUMS.txt') -Encoding utf8 -Value "$hash  $filename"
    $sha = (git -C $Root rev-parse HEAD).Trim()
    $dirty = [bool](git -C $Root status --porcelain)
    $runUrl = if ($env:GITHUB_ACTIONS -eq 'true') { "$env:GITHUB_SERVER_URL/$env:GITHUB_REPOSITORY/actions/runs/$env:GITHUB_RUN_ID" } else { $null }
    if ($env:GITHUB_ACTIONS -eq 'true' -and ($sha -ne $env:GITHUB_SHA -or $dirty)) {
        throw 'CI metadata must describe a clean checkout of GITHUB_SHA.'
    }
    @{
        name = $manifest.name; publisher = $manifest.publisher; version = $manifest.version
        preview = $manifest.preview; sha = $sha; dirty = $dirty; sha256 = $hash; file = $filename
        runUrl = $runUrl; node = (node --version); npm = (npm --version)
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directory 'build-info.json') -Encoding utf8
}
Write-Host "Inspected production VSIX: $VsixPath (SHA-256 $hash)"
