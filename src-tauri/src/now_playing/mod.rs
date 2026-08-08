#[derive(Debug, Clone)]
pub struct NowPlayingInfo {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub playing: bool,
}

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "linux")]
mod linux;

pub async fn get_now_playing() -> Option<NowPlayingInfo> {
    #[cfg(target_os = "windows")]
    return windows::get_now_playing().await;

    #[cfg(target_os = "macos")]
    return macos::get_now_playing().await;

    #[cfg(target_os = "linux")]
    return linux::get_now_playing().await;

    #[allow(unreachable_code)]
    None
}
