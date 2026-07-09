# ♪ Music CLI

Own your music. **Music CLI** downloads your YouTube, SoundCloud, and Spotify libraries to your computer and plays them offline, straight from your terminal. Every song lands on your own drive as a real file, yours to keep and ready the moment you want it.

Music CLI is a remake of [soundcli](https://github.com/baairon/soundcli) by bairon (MIT), extended with color themes, remappable player keys, browser-cookie downloads, and a one-press library sync.

## Get started

You only have to do this once. Music CLI handles the rest itself.

1. **Install Node.js** from [nodejs.org](https://nodejs.org): download the installer and click **Next** until it finishes. It's the one piece of software Music CLI runs on.
2. **Open your terminal.** On **Windows**, press the Windows key, type `terminal`, and press Enter. On a **Mac**, press `Cmd + Space`, type `terminal`, and press Enter. A plain window opens, and that's all you need to get going.
3. **Install Music CLI.** Copy the line for your system, paste it into the terminal, and press **Enter**:

   macOS / Linux:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/School-User/soundcli/main/install.sh | sh
   ```

   Windows (PowerShell):

   ```powershell
   irm https://raw.githubusercontent.com/School-User/soundcli/main/install.ps1 | iex
   ```

4. **Start it.** From now on, opening your library is just:

   ```sh
   music-cli
   ```

The installer just downloads one prebuilt file — no npm, no build step — and puts a `music-cli` command on your PATH. From there Music CLI takes over, downloading the few tools it needs and setting everything up on its own.

Re-run the installer anytime to update to the latest version. To remove it, delete the `music-cli` file the installer printed (macOS/Linux: `~/.local/bin/music-cli`; Windows: the `Music CLI` folder in `%LOCALAPPDATA%`).

Prefer to build it yourself instead of downloading a binary? That path uses npm:

```sh
git clone https://github.com/School-User/soundcli.git
cd soundcli
npm install
npm install -g "$(npm pack)"
```

## The first run

The first time it opens, Music CLI shows you where your music will be saved: a dedicated **Music CLI** folder inside your computer's Music folder, so you always know where your files are.

Then it asks where your music comes from. Pick **YouTube**, **SoundCloud**, or **Spotify**, then type your username or paste a link to a playlist, an album, or a single track. Downloading starts right away, and you can begin listening while the rest of your library finishes.

## Your library, kept in order

Every track downloads in its original quality, with album artwork and artist details included, and gets sorted into folders automatically so your collection stays organized. Almost any link works: playlists, albums, artist profiles, your likes, or a single song. Public Spotify playlists and albums work without signing in.

It never downloads the same song twice, and if you close it mid-download, it picks up where it left off next time. Once a track is saved, it's there for good. You can rename tracks and playlists directly from the interface to keep everything tidy.

**Settings → Download new songs** checks every source you've saved and queues anything new, in one press — no need to walk through the pickers again.

### Higher quality with your own account

If you pay for YouTube Premium or SoundCloud Go+, turn on **Settings → Browser cookies** and pick the browser you're signed in with. Downloads then use your login and grab the higher-bitrate streams your account is entitled to. Without a paid account this changes nothing, and it stays off by default.

## Make it yours

- **Appearance**: pick a color theme in **Settings → Appearance** — ember (the classic warm look), ocean, forest, violet, or mono. It applies instantly.
- **Player keys**: remap any player shortcut in **Settings → Player keys**. Pick an action, press its new key, done. The `?` cheatsheet always shows your real bindings.

## Playing it back

Everything runs from the keyboard, with controls that are quick to pick up. Press `?` anytime for the full list of keys. The bar along the bottom of the screen only shows the few that matter right now, so there's nothing to memorize.

## Contributing

Issues and pull requests are welcome. Music CLI is TypeScript with an Ink
terminal UI, riding on yt-dlp and mpv.

Run it locally:

1. Clone the repo and open the folder.
2. Install dependencies (Node 22 or newer):
   ```sh
   npm install
   ```
3. Start the dev build, which runs straight from source:
   ```sh
   npm run dev
   ```
   Or build it and run the bundled version:
   ```sh
   npm run build
   npm start
   ```

Before opening a pull request:

- Run the tests: `npm test`
- Check types: `npm run typecheck`
- Write commits in Conventional Commits style (`fix:`, `feat:`, `docs:`, `chore:`, `refactor:`)
- Keep the UI surface minimal: one contextual footer plus the `?` cheatsheet, never a wall of commands

### Publishing a release (maintainers)

The one-line installers download a prebuilt bundle from the latest GitHub
release, so a release has to exist for them to work. Cutting one is automated:
push a version tag and the **Release standalone binary** workflow builds the
single-file bundle (`npm run build:standalone`) and attaches it to the release.

```sh
git tag v1.0.0
git push origin v1.0.0
```

You can also run that workflow by hand from the repo's **Actions** tab (it takes
a tag name as input). To build the bundle locally for testing:

```sh
npm run build:standalone   # → dist-standalone/music-cli.js (self-contained)
```

Then open a PR against `main` with a short note on what changed and why.

## Privacy

Music CLI runs on your computer and nowhere else. There are no accounts, no logins, and nothing tracking what you play. It connects to the internet for three reasons only: to download the music you ask for, to set itself up the first time, and to keep its own tools current so downloads keep working. Everything else stays with you.

## Credits & license

MIT. Based on [soundcli](https://github.com/baairon/soundcli) by bairon — the original LICENSE is preserved in this repository.
