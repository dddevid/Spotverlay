# Spotverlay

Spotverlay is a lightweight, always-on-top music overlay for Windows. 
It shows you what's playing on Spotify without you having to alt-tab or open the app. 

I built this because the existing overlays were either too heavy, required injecting DLLs into Spotify, or needed you to set up API keys by making developer accounts. Spotverlay skips all that. 

### How it works

Instead of relying on the Spotify Web API (which requires OAuth and tokens), Spotverlay hooks directly into Windows SMTC (System Media Transport Controls). This is the same system that handles the media popup when you press the volume keys on your keyboard. 

When a song changes, the app:
1. Runs a background PowerShell script that asks Windows SMTC what's currently playing.
2. Extracts the artist and track title.
3. Hits the public iTunes Search API to fetch a high-res (600x600) album cover instantly. 

### FAQ

**Q: Why don't you pull the artwork from the local Windows media cache?**
A: Because Windows 11 has a well-known bug where SMTC sometimes returns 0-byte thumbnail streams for Spotify. By pulling the artwork from iTunes instead, we avoid this bug completely and get much higher quality covers (600x600 instead of low-res).

### Features
* **Zero setup:** No API keys, no logins, no browser redirects. Just launch it and it works.
* **Customizable animations:** Choose between a fade in/out or a smooth slide from the edge of your screen.
* **Smart hiding:** If you don't want it stuck on your screen permanently, you can disable "Always on top". It will quietly stay hidden, pop up for 4 seconds when a new song starts (or when you pause/resume), and smoothly fade away.
* **Low impact:** The overlay itself is a borderless, transparent click-through window. It doesn't steal focus while you're gaming or working.

### Building it yourself

If you want to compile the `.exe` yourself:
1. Clone the repo and run `npm install`
2. Run `npm run dist`
3. Check the `dist/` folder for the installer.

### Technical details
- Built with Electron and Node.js.
- The UI uses native CSS backdrop filters for the glass effect (works great on Windows 11).
- We use a transparent, un-hidable `BrowserWindow` with `opacity: 0` instead of actually hiding the window at the OS level. This completely bypasses a nasty Electron bug on Windows where transparent windows get a black background when repeatedly shown and hidden.
