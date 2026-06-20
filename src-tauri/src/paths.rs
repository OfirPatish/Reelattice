use std::path::PathBuf;

const APP_DIR_NAME: &str = "Reelattice";

fn documents_app_dir(name: &str) -> Option<PathBuf> {
    dirs::document_dir().map(|documents| documents.join(name))
}

fn app_data_app_dir(name: &str) -> Option<PathBuf> {
    dirs::data_dir().map(|app_data| app_data.join(name))
}

pub fn default_library_root() -> PathBuf {
    documents_app_dir(APP_DIR_NAME)
        .map(|dir| dir.join("library"))
        .or_else(|| dirs::home_dir().map(|home| home.join(APP_DIR_NAME).join("library")))
        .unwrap_or_else(|| PathBuf::from(APP_DIR_NAME).join("library"))
}

pub fn default_data_dir() -> PathBuf {
    app_data_app_dir(APP_DIR_NAME).unwrap_or_else(|| {
        default_library_root()
            .parent()
            .map(|parent| parent.to_path_buf())
            .unwrap_or_else(default_library_root)
    })
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
    fn default_db_path_ends_with_data_db() {
        assert!(default_db_path().ends_with("data.db"));
    }
}
