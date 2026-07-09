#!/usr/bin/env sh
# Music CLI installer for macOS and Linux.
#
#   curl -fsSL https://raw.githubusercontent.com/School-User/soundcli/main/install.sh | sh
#
# Checks for Node.js 22+, downloads this repository, builds it (the package's
# prepare script runs the bundler during npm install), and installs the
# resulting package globally so `music-cli` is on your PATH.
set -eu

REPO="School-User/soundcli"
BRANCH="main"
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

command -v curl >/dev/null 2>&1 || fail "curl is required to download Music CLI."
command -v tar >/dev/null 2>&1 || fail "tar is required to unpack Music CLI."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

printf 'Downloading Music CLI (github.com/%s) ...\n' "$REPO"
curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" | tar -xz -C "$tmp"

src=$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | head -n 1)
[ -n "$src" ] || fail "the downloaded archive looked empty."

printf 'Building (this runs once and takes a minute) ...\n'
cd "$src"
npm install --no-audit --no-fund --loglevel=error

printf 'Installing the music-cli command ...\n'
tgz=$(npm pack --pack-destination "$tmp" --loglevel=error | tail -n 1)
npm install -g --no-audit --no-fund --loglevel=error "$tmp/$tgz"

printf '\nDone. Start it anytime with: music-cli\n'
