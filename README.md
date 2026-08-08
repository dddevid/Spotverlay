# spotverlay

A simple, always-on-top overlay that shows what's playing on Spotify when the track changes. Built so you don't have to alt-tab out of a game or whatever you're doing just to see the song name.

Originally written in Electron, I rewrote this in Tauri + Rust. It now idles at around ~10MB of RAM instead of ~80MB, and the binary is much smaller. It supports Windows, macOS, and Linux.

## how it works under the hood

Spotverlay doesn't use the official Spotify Web API, so you don't need to mess with OAuth tokens or developer apps. It just asks the OS what media is currently playing:

*   **Windows**: Uses `windows-rs` to read from SMTC (System Media Transport Controls).
*   **macOS**: Runs an AppleScript (`osascript`) to query the `Spotify.app` process directly.
*   **Linux**: Listens to D-Bus via the MPRIS2 interface (using `zbus`).

Because the local OS APIs often return low-quality or cached album art (especially the Windows 11 SMTC bug), the app takes the artist and track name and pings the public iTunes Search API to grab a clean 600x600 cover.

When a track changes, the overlay slides/fades in, stays for a few seconds, and hides itself again. It's fully click-through, so it won't steal your mouse focus.

## building it yourself

Make sure you have [Node.js](https://nodejs.org/), [Rust](https://rustup.rs/), and the [Tauri OS prerequisites](https://tauri.app/start/prerequisites/) installed.

```bash
git clone https://github.com/dddevid/Spotverlay
cd spotverlay
npm install

# run locally
npm run dev

# build release binary
npm run tauri build
```

The compiled executable will be in `src-tauri/target/release/`.

## settings

There's a tray icon. Right-click it (or left-click) to open settings where you can change the position (corners), animation style (fade/slide), and toggle if you want it permanently visible instead of auto-hiding. Settings are saved locally as a simple JSON file.
