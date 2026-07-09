#!/usr/bin/env sh
# Music CLI installer for macOS and Linux.
#
#   curl -fsSL https://raw.githubusercontent.com/School-User/soundcli/main/install.sh | sh
#
# Checks for Node.js 22+, then installs the CLI globally from this repository
# (npm builds it during install via the package's prepare script).
set -eu

REPO="School-User/soundcli"
MIN_NODE=22

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail \
  "Node.js is not installed. Get v${MIN_NODE}+ from https://nodejs.org, then re-run this script."

major=$(node -p 'process.versions.node.split(".")[0]')
[ "$major" -ge "$MIN_NODE" ] || fail \
  "Node.js v${MIN_NODE}+ is required (you have $(node -v)). Update at https://nodejs.org, then re-run this script."

command -v npm >/dev/null 2>&1 || fail \
  "npm was not found (it normally ships with Node.js). Reinstall Node.js from https://nodejs.org."

printf 'Installing Music CLI from github.com/%s ...\n' "$REPO"
npm install -g "git+https://github.com/${REPO}.git"

printf '\nDone. Start it anytime with: music-cli\n'
