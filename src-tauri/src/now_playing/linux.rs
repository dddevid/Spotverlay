/// Linux implementation using D-Bus MPRIS2 protocol.
/// Works with any media player that exposes the org.mpris.MediaPlayer2 interface,
/// including Spotify (snap, flatpak, and native packages).
use super::NowPlayingInfo;
use zbus::{Connection, proxy};

#[proxy(
    interface = "org.mpris.MediaPlayer2.Player",
    default_path = "/org/mpris/MediaPlayer2"
)]
trait MprisPlayer {
    #[zbus(property)]
    fn playback_status(&self) -> zbus::Result<String>;

    #[zbus(property)]
    fn metadata(&self) -> zbus::Result<std::collections::HashMap<String, zbus::zvariant::OwnedValue>>;
}

pub async fn get_now_playing() -> Option<NowPlayingInfo> {
    let conn = Connection::session().await.ok()?;

    // List all bus names to find Spotify's MPRIS service
    let dbus = zbus::fdo::DBusProxy::new(&conn).await.ok()?;
    let names = dbus.list_names().await.ok()?;

    let spotify_name = names
        .iter()
        .find(|n| n.as_str().starts_with("org.mpris.MediaPlayer2.spotify")
              || n.as_str().starts_with("org.mpris.MediaPlayer2.Spotify"))?
        .clone();

    let proxy = MprisPlayerProxy::builder(&conn)
        .destination(spotify_name.as_str())
        .ok()?
        .build()
        .await
        .ok()?;

    let status = proxy.playback_status().await.ok()?;
    let is_playing = status == "Playing";

    // Return None if stopped
    if status == "Stopped" {
        return None;
    }

    let metadata = proxy.metadata().await.ok()?;

    let title = get_string(&metadata, "xesam:title");
    let artist = get_artist(&metadata);
    let album = get_string(&metadata, "xesam:album");

    Some(NowPlayingInfo {
        title,
        artist,
        album,
        playing: is_playing,
    })
}

fn get_string(
    map: &std::collections::HashMap<String, zbus::zvariant::OwnedValue>,
    key: &str,
) -> Option<String> {
    let val = map.get(key)?;
    // Try to extract as string
    if let Ok(s) = val.downcast_ref::<&str>() {
        let trimmed = s.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    None
}

fn get_artist(
    map: &std::collections::HashMap<String, zbus::zvariant::OwnedValue>,
) -> Option<String> {
    let val = map.get("xesam:artist")?;
    // Artists is usually an array of strings
    if let Ok(arr) = val.downcast_ref::<zbus::zvariant::Array>() {
        let parts: Vec<String> = arr
            .iter()
            .filter_map(|v| v.downcast_ref::<&str>().ok().map(|s| s.to_string()))
            .collect();
        if !parts.is_empty() {
            return Some(parts.join(", "));
        }
    }
    // Fallback: try as plain string
    get_string(map, "xesam:artist")
}
