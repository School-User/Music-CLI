#!/usr/bin/env sh
# Music CLI installer for macOS and Linux.
#
#   curl -fsSL https://raw.githubusercontent.com/School-User/soundcli/main/install.sh | sh
#
# Downloads the prebuilt single-file bundle from the latest GitHub release and
# drops it on your PATH. No npm, no build step. Node.js 22+ still has to be
# installed, since the bundle runs on Node.
set -eu

REPO="School-User/soundcli"
MIN_NODE=22
ASSET_URL="https://github.com/${REPO}/releases/latest/download/music-cli"
BIN_DIR="${MUSIC_CLI_BIN:-$HOME/.local/bin}"

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail \
  "Node.js is not installed. Get v${MIN_NODE}+ from https://nodejs.org, then re-run this script."

major=$(node -p 'process.versions.node.split(".")[0]')
[ "$major" -ge "$MIN_NODE" ] || fail \
  "Node.js v${MIN_NODE}+ is required (you have $(node -v)). Update at https://nodejs.org, then re-run this script."

command -v curl >/dev/null 2>&1 || fail "curl is required to download Music CLI."

mkdir -p "$BIN_DIR" || fail "could not create $BIN_DIR."
dest="$BIN_DIR/music-cli"

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
trap 'exit 130' INT TERM

printf 'Downloading Music CLI ...\n'
curl -fSL --proto '=https' --tlsv1.2 "$ASSET_URL" -o "$tmp" || fail \
  "download failed. Make sure a release has been published at https://github.com/${REPO}/releases"

# A real bundle starts with a Node shebang; guard against saving an error page.
head -n 1 "$tmp" | grep -q '^#!' || fail "the downloaded file doesn't look like Music CLI (no release asset yet?)."

chmod +x "$tmp"
mv "$tmp" "$dest"

printf '\nInstalled to %s\n' "$dest"
case ":$PATH:" in
  *":$BIN_DIR:"*)
    printf 'Start it anytime with: music-cli\n'
    ;;
  *)
    printf 'Add this line to your shell profile, then restart the terminal:\n'
    printf '  export PATH="%s:$PATH"\n' "$BIN_DIR"
    printf 'After that, start it with: music-cli\n'
    ;;
esac
