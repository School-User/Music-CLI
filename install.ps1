# Music CLI installer for Windows PowerShell.
#
#   irm https://raw.githubusercontent.com/School-User/soundcli/main/install.ps1 | iex
#
# Checks for Node.js 22+, then installs the CLI globally from this repository
# (npm builds it during install via the package's prepare script).
$ErrorActionPreference = "Stop"

$repo = "School-User/soundcli"
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

Write-Host "Installing Music CLI from github.com/$repo ..."
npm install -g "git+https://github.com/$repo.git"
if ($LASTEXITCODE -ne 0) {
    Fail "npm install failed (see output above)."
}

Write-Host ""
Write-Host "Done. Start it anytime with: music-cli"
