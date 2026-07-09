# Music CLI installer for Windows PowerShell.
#
#   irm https://raw.githubusercontent.com/School-User/soundcli/main/install.ps1 | iex
#
# Downloads the prebuilt single-file bundle from the latest GitHub release and
# puts a `music-cli` command on your PATH. No npm, no build step. Node.js 22+
# still has to be installed, since the bundle runs on Node.
$ErrorActionPreference = "Stop"

$repo = "School-User/soundcli"
$minNode = 22
$assetUrl = "https://github.com/$repo/releases/latest/download/music-cli.js"

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

$dir = Join-Path $env:LOCALAPPDATA "Music CLI"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$js = Join-Path $dir "music-cli.js"

Write-Host "Downloading Music CLI ..."
try {
    Invoke-WebRequest -Uri $assetUrl -OutFile $js -UseBasicParsing
} catch {
    Fail "download failed. Make sure a release has been published at https://github.com/$repo/releases"
}

# A .cmd shim so typing `music-cli` runs the bundle through node from anywhere.
$cmd = Join-Path $dir "music-cli.cmd"
Set-Content -Path $cmd -Value "@node `"%~dp0music-cli.js`" %*" -Encoding Ascii

# Put the install dir on the user PATH if it isn't already there.
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ';') -notcontains $dir) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$dir", "User")
    Write-Host "Added $dir to your PATH (open a new terminal to pick it up)."
}

Write-Host ""
Write-Host "Done. Start it anytime with: music-cli"
