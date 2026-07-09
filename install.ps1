# Music CLI installer for Windows PowerShell.
#
#   irm https://raw.githubusercontent.com/School-User/soundcli/main/install.ps1 | iex
#
# Checks for Node.js 22+, downloads this repository, builds it (the package's
# prepare script runs the bundler during npm install), and installs the
# resulting package globally so `music-cli` is on your PATH.
$ErrorActionPreference = "Stop"

$repo = "School-User/soundcli"
$branch = "main"
$minNode = 22

function Fail($message) {
    Write-Host "error: $message" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js is not installed. Get v$minNode+ from https://nodejs.org, then re-run this script."
}

$major = [int](node -p "process.versions.node.split('.')[0]")
if ($major -lt $minNode) {
    Fail "Node.js v$minNode+ is required (you have $(node -v)). Update at https://nodejs.org, then re-run this script."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Fail "npm was not found (it normally ships with Node.js). Reinstall Node.js from https://nodejs.org."
}

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("music-cli-install-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null

try {
    Write-Host "Downloading Music CLI (github.com/$repo) ..."
    $zip = Join-Path $tmp "music-cli.zip"
    Invoke-WebRequest -Uri "https://github.com/$repo/archive/refs/heads/$branch.zip" -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath $tmp

    $src = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
    if (-not $src) { Fail "the downloaded archive looked empty." }

    Write-Host "Building (this runs once and takes a minute) ..."
    Push-Location $src.FullName
    npm install --no-audit --no-fund --loglevel=error
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install failed (see output above)." }

    Write-Host "Installing the music-cli command ..."
    $tgz = (npm pack --pack-destination $tmp --loglevel=error | Select-Object -Last 1)
    Pop-Location
    npm install -g --no-audit --no-fund --loglevel=error (Join-Path $tmp $tgz)
    if ($LASTEXITCODE -ne 0) { Fail "npm install -g failed (see output above)." }

    Write-Host ""
    Write-Host "Done. Start it anytime with: music-cli"
}
finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
