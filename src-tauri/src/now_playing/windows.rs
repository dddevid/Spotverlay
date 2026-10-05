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
    let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .ok()?
        .get()
        .ok()?;
    let sessions = manager.GetSessions().ok()?;
    let mut spotify_session = None;
    for i in 0..sessions.Size().ok()? {
        let s = sessions.GetAt(i).ok()?;
        let app_id = s.SourceAppUserModelId().ok()?;
        let app_id_lower = app_id.to_string().to_lowercase();
        if app_id_lower.contains("spotify") ||
           app_id_lower.contains("spotifast") ||
           app_id_lower.contains("spotlight") ||
           app_id_lower.contains("applemusic") ||
           app_id_lower.contains("apple music") ||
           app_id_lower.contains("musly") {
            spotify_session = Some(s);
            break;
        }
    }
    let session = spotify_session?;
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
