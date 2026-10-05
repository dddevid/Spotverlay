use super::NowPlayingInfo;
use std::process::Command;
pub async fn get_now_playing() -> Option<NowPlayingInfo> {
    let apps = ["Spotify", "Spotifast", "SpotLight", "Music", "Musly"];
    let mut active_app = None;
    for app in apps {
        let check_script = format!(r#"tell application "System Events" to (name of processes) contains "{}""#, app);
        if let Ok(output) = Command::new("osascript").arg("-e").arg(&check_script).output() {
            let running = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if running == "true" {
                active_app = Some(app);
                break;
            }
        }
    }
    let active_app = active_app?;
    let script = format!(r#"
        tell application "{}"
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
    "#, active_app);
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
