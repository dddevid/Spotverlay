/// Windows implementation using SMTC (System Media Transport Controls)
/// via the `windows` crate — same data source as the original PowerShell script,
/// but native Rust (no subprocess overhead).
///
/// We use `spawn_blocking` because the WinRT operations block the thread,
/// and we don't want to block the tokio async runtime.
use super::NowPlayingInfo;
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
};

pub async fn get_now_playing() -> Option<NowPlayingInfo> {
    tauri::async_runtime::spawn_blocking(get_now_playing_sync)
        .await
        .ok()?
}

fn get_now_playing_sync() -> Option<NowPlayingInfo> {
    // RequestAsync().get() blocks until the WinRT operation completes
    let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .ok()?
        .get()
        .ok()?;

    // Find the Spotify session among all SMTC sessions
    let sessions = manager.GetSessions().ok()?;
    let mut spotify_session = None;
    for i in 0..sessions.Size().ok()? {
        let s = sessions.GetAt(i).ok()?;
        let app_id = s.SourceAppUserModelId().ok()?;
        if app_id.to_string().to_lowercase().contains("spotify") {
            spotify_session = Some(s);
            break;
        }
    }
    let session = spotify_session?;

    // Get media properties and playback info (both blocking WinRT calls)
    let props = session.TryGetMediaPropertiesAsync().ok()?.get().ok()?;
    let playback = session.GetPlaybackInfo().ok()?;

    let title = props
        .Title()
        .ok()
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty());
    let artist = props
        .Artist()
        .ok()
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty());
    let album = props
        .AlbumTitle()
        .ok()
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty());

    let is_playing = playback.PlaybackStatus().ok()?
        == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing;

    Some(NowPlayingInfo {
        title,
        artist,
        album,
        playing: is_playing,
    })
}
