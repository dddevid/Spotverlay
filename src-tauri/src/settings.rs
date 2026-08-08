use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub first_run: bool,
    pub always_on_top: bool,
    pub position: String,
    pub animation: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            first_run: true,
            always_on_top: false,
            position: "top-right".to_string(),
            animation: "fade".to_string(),
        }
    }
}

impl Settings {
    pub fn load(app: &AppHandle) -> Self {
        let path = settings_path(app);
        if let Ok(data) = std::fs::read_to_string(&path) {
            if let Ok(s) = serde_json::from_str::<Settings>(&data) {
                return s;
            }
        }
        Self::default()
    }

    pub fn save(&self, app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        let path = settings_path(app);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let data = serde_json::to_string_pretty(self)?;
        std::fs::write(path, data)?;
        Ok(())
    }
}

fn settings_path(app: &AppHandle) -> std::path::PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_default()
        .join("spotverlay-settings.json")
}
