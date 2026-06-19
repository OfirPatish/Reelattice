use std::path::PathBuf;

const APP_DIR_NAME: &str = "Reelattice";
const LEGACY_APP_DIR_NAME: &str = "Vaultline";

fn pick_existing_dir(candidates: &[PathBuf]) -> PathBuf {
    for candidate in candidates {
        if candidate.exists() {
            return candidate.clone();
        }
    }

    candidates
        .first()
        .cloned()
        .unwrap_or_else(|| PathBuf::from(APP_DIR_NAME))
}

fn documents_app_dir(name: &str) -> Option<PathBuf> {
    dirs::document_dir().map(|documents| documents.join(name))
}

fn app_data_app_dir(name: &str) -> Option<PathBuf> {
    dirs::data_dir().map(|app_data| app_data.join(name))
}

pub fn default_library_root() -> PathBuf {
    let primary = documents_app_dir(APP_DIR_NAME)
        .map(|dir| dir.join("library"))
        .or_else(|| dirs::home_dir().map(|home| home.join(APP_DIR_NAME).join("library")))
        .unwrap_or_else(|| PathBuf::from(APP_DIR_NAME).join("library"));

    let legacy = documents_app_dir(LEGACY_APP_DIR_NAME)
        .map(|dir| dir.join("library"))
        .or_else(|| dirs::home_dir().map(|home| home.join(LEGACY_APP_DIR_NAME).join("library")))
        .unwrap_or_else(|| PathBuf::from(LEGACY_APP_DIR_NAME).join("library"));

    pick_existing_dir(&[primary, legacy])
}

pub fn default_data_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        let primary = app_data_app_dir(APP_DIR_NAME);
        let legacy = app_data_app_dir(LEGACY_APP_DIR_NAME);

        if let (Some(primary_dir), Some(legacy_dir)) = (&primary, &legacy) {
            return pick_existing_dir(&[primary_dir.clone(), legacy_dir.clone()]);
        }

        if let Some(primary_dir) = primary {
            return primary_dir;
        }
    }

    default_library_root()
        .parent()
        .map(|parent| parent.to_path_buf())
        .unwrap_or_else(default_library_root)
}

pub fn default_db_path() -> PathBuf {
    default_data_dir().join("data.db")
}

pub fn default_thumbnails_dir() -> PathBuf {
    default_data_dir().join("thumbnails")
}

pub fn ffmpeg_cache_path() -> PathBuf {
    #[cfg(windows)]
    {
        return default_data_dir().join("bin").join("ffmpeg.exe");
    }

    #[cfg(not(windows))]
    default_data_dir().join("bin").join("ffmpeg")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_dir_names_are_distinct() {
        assert_ne!(APP_DIR_NAME, LEGACY_APP_DIR_NAME);
        assert!(default_db_path().ends_with("data.db"));
    }
}
