/// macOS implementation using AppleScript to query Spotify.app directly.
/// Works with the native Spotify macOS app. Does not require any API keys.
use super::NowPlayingInfo;
use std::process::Command;

pub async fn get_now_playing() -> Option<NowPlayingInfo> {
    // Check if Spotify is running
    let running_output = Command::new("osascript")
        .arg("-e")
        .arg(r#"tell application "System Events" to (name of processes) contains "Spotify""#)
        .output()
        .ok()?;

    let running = String::from_utf8_lossy(&running_output.stdout).trim().to_string();
    if running != "true" {
        return None;
    }

    // Get playback state and track info via AppleScript
    let script = r#"
        tell application "Spotify"
            if player state is playing then
                set isPlaying to "true"
            else if player state is paused then
                set isPlaying to "paused"
            else
                set isPlaying to "stopped"
            end if
            if player state is playing or player state is paused then
                set trackName to name of current track
                set artistName to artist of current track
                set albumName to album of current track
                return isPlaying & "|" & trackName & "|" & artistName & "|" & albumName
            else
                return isPlaying
            end if
        end tell
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if result.is_empty() || result == "stopped" {
        return None;
    }

    let parts: Vec<&str> = result.splitn(4, '|').collect();
    if parts.len() < 4 {
        // Paused with no track info
        return None;
    }

    let is_playing = parts[0] == "true";
    let title = non_empty(parts[1]);
    let artist = non_empty(parts[2]);
    let album = non_empty(parts[3]);

    Some(NowPlayingInfo {
        title,
        artist,
        album,
        playing: is_playing,
    })
}

fn non_empty(s: &str) -> Option<String> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}
