# Spotverlay

Spotverlay is a lightweight, always-on-top music overlay for **Windows, macOS and Linux**.  
It shows what's playing on Spotify without needing to alt-tab or open the app.

Built with **Tauri + Rust** for maximum performance and minimal memory usage (~10 MB RAM vs ~80 MB for Electron).

---

## How it works

No API keys, no DLL injection, no OAuth. Spotverlay reads the currently playing track directly from the OS:

| Platform | Method |
|---|---|
| 🪟 Windows | **SMTC** (System Media Transport Controls) via `windows-rs` WinRT API |
| 🍎 macOS | **AppleScript** — queries `Spotify.app` directly via `osascript` |
| 🐧 Linux | **D-Bus MPRIS2** — standard media player interface (`zbus` crate) |

When a song changes:
1. The Rust backend detects the new track via the OS-native API.
2. It hits the **iTunes Search API** to fetch a high-res (600×600) album cover.
3. The overlay card animates in with the artwork, title, and artist.
4. After 4 seconds it smoothly fades out (unless "Always on Top" is enabled).

---

## Features

- **Zero setup** — No API keys, no logins, no OAuth. Just launch and it works.
- **Cross-platform** — Windows, macOS, and Linux supported out of the box.
- **Customizable animations** — Fade or slide from the screen edge.
- **Smart auto-hide** — Pops up for 4 seconds on track change, then disappears.
- **Click-through overlay** — Won't steal focus while gaming or working.
- **System tray** — Right-click the tray icon to access Settings or quit.
- **Tiny footprint** — ~10 MB RAM, ~3 MB binary (Tauri + Rust).

---

## Building from source

### Requirements
- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 18+
- Tauri prerequisites for your platform: https://tauri.app/start/prerequisites/

### Steps

```bash
git clone https://github.com/youruser/spotverlay
cd spotverlay
npm install
npm run dev      # development mode
npm run tauri build    # production build → src-tauri/target/release/
```

---

## Technical notes

- The overlay is a **transparent, click-through, always-on-top** Tauri `WebviewWindow` with `decorations: false`.
- Artwork is fetched from the **public iTunes Search API** — same technique as the original Electron version, avoiding the Windows 11 SMTC thumbnail bug.
- Settings are persisted as JSON in the OS app data directory.
