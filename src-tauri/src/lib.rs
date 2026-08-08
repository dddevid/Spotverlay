use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{
    AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri::async_runtime::JoinHandle;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem};

mod now_playing;
mod settings;

use settings::Settings;

const POLL_INTERVAL_MS: u64 = 1500;
const AUTO_HIDE_MS: u64 = 4000;

/// Global app state shared across threads
pub struct AppState {
    pub settings: Mutex<Settings>,
    pub last_key: Mutex<String>,
    pub last_playing: Mutex<Option<bool>>,
    pub last_artwork: Mutex<Option<String>>,
    pub hide_task: Mutex<Option<JoinHandle<()>>>,
}

impl AppState {
    fn new() -> Arc<Self> {
        Arc::new(Self {
            settings: Mutex::new(Settings::default()),
            last_key: Mutex::new(String::new()),
            last_playing: Mutex::new(None),
            last_artwork: Mutex::new(None),
            hide_task: Mutex::new(None),
        })
    }
}

#[tauri::command]
fn get_settings(state: tauri::State<'_, Arc<AppState>>) -> Settings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
fn save_settings(
    new_settings: Settings,
    state: tauri::State<'_, Arc<AppState>>,
    app: AppHandle,
) {
    {
        let mut s = state.settings.lock().unwrap();
        *s = new_settings.clone();
        let _ = s.save(&app);
    }
    apply_overlay_settings(&app, &new_settings, &state);
}

#[tauri::command]
fn complete_first_run(
    state: tauri::State<'_, Arc<AppState>>,
    app: AppHandle,
) {
    {
        let mut s = state.settings.lock().unwrap();
        s.first_run = false;
        let _ = s.save(&app);
    }
    if let Some(w) = app.get_webview_window("welcome") {
        let _ = w.close();
    }
}

/// Reposition and reconfigure overlay window when settings change
fn apply_overlay_settings(app: &AppHandle, settings: &Settings, state: &Arc<AppState>) {
    if let Some(win) = app.get_webview_window("overlay") {
        position_overlay(&win, settings);
        let _ = win.set_always_on_top(true);
        let _ = win.emit("settings-updated", settings.clone());

        if !settings.always_on_top {
            schedule_hide(app.clone(), Arc::clone(state));
        } else {
            // Cancel pending hide
            let mut h = state.hide_task.lock().unwrap();
            if let Some(handle) = h.take() {
                handle.abort();
            }
        }
    }
}

fn position_overlay(win: &tauri::WebviewWindow, settings: &Settings) {
    // Window size in logical pixels — must match tauri.conf.json width/height
    const W: f64 = 356.0;
    const H: f64 = 112.0;

    let monitor = match win.primary_monitor().ok().flatten() {
        Some(m) => m,
        None => return,
    };

    let scale = monitor.scale_factor();
    // Convert physical monitor size to logical pixels (same as Electron's workAreaSize)
    let screen_w = monitor.size().width as f64 / scale;
    let screen_h = monitor.size().height as f64 / scale;

    let (lx, ly) = match settings.position.as_str() {
        "top-left"     => (0.0_f64, 0.0_f64),
        "bottom-left"  => (0.0, screen_h - H),
        "bottom-right" => (screen_w - W, screen_h - H),
        _              => (screen_w - W, 0.0), // top-right default
    };

    let _ = win.set_position(tauri::LogicalPosition::new(lx, ly));
    let _ = win.set_size(tauri::LogicalSize::new(W, H));
}


fn schedule_hide(app: AppHandle, state: Arc<AppState>) {
    // Cancel previous hide timer
    {
        let mut h = state.hide_task.lock().unwrap();
        if let Some(handle) = h.take() {
            handle.abort();
        }
    }

    let state_clone = Arc::clone(&state);
    let handle = tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_millis(AUTO_HIDE_MS)).await;
        let always_on_top = state_clone.settings.lock().unwrap().always_on_top;
        if !always_on_top {
            if let Some(win) = app.get_webview_window("overlay") {
                let _ = win.emit("hide-card", ());
            }
        }
    });

    *state.hide_task.lock().unwrap() = Some(handle);
}

async fn fetch_artwork(artist: &str, title: &str) -> Option<String> {
    let query = format!("{} {}", artist, title);
    let encoded = urlencoding::encode(&query);
    let url = format!(
        "https://itunes.apple.com/search?term={}&entity=song&limit=1",
        encoded
    );

    let client = reqwest::Client::new();
    let resp = client.get(&url).send().await.ok()?;
    let json: serde_json::Value = resp.json().await.ok()?;
    let results = json["results"].as_array()?;
    if results.is_empty() {
        return None;
    }
    let artwork = results[0]["artworkUrl100"].as_str()?;
    Some(artwork.replace("100x100bb", "600x600bb"))
}

pub fn run() {
    let state = AppState::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::clone(&state))
        .setup(move |app| {
            let app_handle = app.handle().clone();

            // Load settings
            let first_run = {
                let mut s = state.settings.lock().unwrap();
                *s = Settings::load(&app_handle);
                s.first_run
            };

            if first_run {
                let _ = WebviewWindowBuilder::new(
                    &app_handle,
                    "welcome",
                    WebviewUrl::App("welcome.html".into()),
                )
                .title("Welcome to Spotverlay")
                .inner_size(500.0, 460.0)
                .resizable(false)
                .maximizable(false)
                .always_on_top(true)
                .build();
            }

            // Configure overlay window — position, always-on-top, click-through
            if let Some(overlay) = app_handle.get_webview_window("overlay") {
                let settings = state.settings.lock().unwrap().clone();
                position_overlay(&overlay, &settings);
                let _ = overlay.set_always_on_top(true);
                #[cfg(not(target_os = "linux"))]
                let _ = overlay.set_visible_on_all_workspaces(true);
                let _ = overlay.set_ignore_cursor_events(true);
            }

            // Build system tray menu
            let settings_item = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit Spotverlay").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&settings_item, &sep, &quit_item])
                .build()?;

            // Embed tray icon at compile time via tauri::include_image! macro
            let tray_icon = tauri::include_image!("icons/tray.png");

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)  // macOS: renders correctly in light/dark mode
                .tooltip("Spotverlay")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "settings" => open_settings_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        // Left click → open settings
                        let app = tray.app_handle();
                        open_settings_window(app);
                    }
                })
                .build(app)?;

            // Start polling loop
            let poll_app = app_handle.clone();
            let poll_state = Arc::clone(&state);
            tauri::async_runtime::spawn(async move {
                loop {
                    poll_now_playing(&poll_app, &poll_state).await;
                    tokio::time::sleep(Duration::from_millis(POLL_INTERVAL_MS)).await;
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            complete_first_run,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Spotverlay");
}

fn open_settings_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.set_focus();
        return;
    }
    let _ = WebviewWindowBuilder::new(
        app,
        "settings",
        WebviewUrl::App("settings.html".into()),
    )
    .title("Spotverlay – Settings")
    .inner_size(460.0, 500.0)
    .resizable(false)
    .maximizable(false)
    .build();
}

async fn poll_now_playing(app: &AppHandle, state: &Arc<AppState>) {
    let info = match now_playing::get_now_playing().await {
        Some(i) => i,
        None => return,
    };

    let key = format!(
        "{}|{}",
        info.artist.as_deref().unwrap_or(""),
        info.title.as_deref().unwrap_or("")
    );

    let is_playing_changed = {
        let lp = state.last_playing.lock().unwrap();
        *lp != Some(info.playing)
    };
    let key_changed = {
        let lk = state.last_key.lock().unwrap();
        *lk != key
    };
    let changed = key_changed || is_playing_changed;

    *state.last_playing.lock().unwrap() = Some(info.playing);
    *state.last_key.lock().unwrap() = key;

    let artwork_url = if changed && info.title.is_some() {
        let url = fetch_artwork(
            info.artist.as_deref().unwrap_or(""),
            info.title.as_deref().unwrap_or(""),
        )
        .await;
        *state.last_artwork.lock().unwrap() = url.clone();
        url
    } else {
        state.last_artwork.lock().unwrap().clone()
    };

    let always_on_top = state.settings.lock().unwrap().always_on_top;

    if let Some(overlay) = app.get_webview_window("overlay") {
        let payload = serde_json::json!({
            "title": info.title,
            "artist": info.artist,
            "album": info.album,
            "playing": info.playing,
            "thumbnailUrl": artwork_url,
        });
        let _ = overlay.emit("now-playing", payload);

        if changed || always_on_top {
            let _ = overlay.emit("show-card", ());
            if !always_on_top {
                schedule_hide(app.clone(), Arc::clone(state));
            }
        }
    }
}
