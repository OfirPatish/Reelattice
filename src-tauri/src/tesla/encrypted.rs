use std::fs::File;
use std::io::Read;
use std::path::Path;

const ENCRYPTED_CLIPS_FOLDER: &str = "EncryptedClips";
const STANDARD_CLIP_FOLDERS: &[&str] = &["RecentClips", "SentryClips", "SavedClips"];
/// Skip header heuristics on tiny files (test stubs, empty placeholders).
const MIN_HEADER_CHECK_BYTES: u64 = 512;

/// Tesla 2026.20+ stores encrypted footage under `EncryptedClips` on the USB drive.
pub fn path_in_encrypted_clips_folder(path: &Path) -> bool {
    path.components()
        .filter_map(|component| component.as_os_str().to_str())
        .any(|part| part.eq_ignore_ascii_case(ENCRYPTED_CLIPS_FOLDER))
}

pub fn path_in_standard_tesla_clip_tree(path: &Path) -> bool {
    path.components()
        .filter_map(|component| component.as_os_str().to_str())
        .any(|part| {
            STANDARD_CLIP_FOLDERS
                .iter()
                .any(|folder| part.eq_ignore_ascii_case(folder))
        })
}

/// Playable Tesla clips are standard MP4 containers (`ftyp` atom near the start).
pub fn has_standard_mp4_header(path: &Path) -> bool {
    let mut file = match File::open(path) {
        Ok(file) => file,
        Err(_) => return false,
    };

    let mut header = [0u8; 32];
    let read_len = file.read(&mut header).unwrap_or(0);
    if read_len < 8 {
        return false;
    }

    header[..read_len]
        .windows(4)
        .any(|window| window == b"ftyp")
}

pub fn is_likely_encrypted_clip(path: &Path) -> bool {
    if path_in_encrypted_clips_folder(path) {
        return true;
    }

    if path_in_standard_tesla_clip_tree(path) {
        return false;
    }

    let is_mp4 = path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("mp4"))
        .unwrap_or(false);

    if !is_mp4 {
        return false;
    }

    let file_size = std::fs::metadata(path).map(|meta| meta.len()).unwrap_or(0);
    if file_size <= MIN_HEADER_CHECK_BYTES {
        return false;
    }

    !has_standard_mp4_header(path)
}

/// True when `path` is the `EncryptedClips` folder itself (not a parent TeslaCam root).
pub fn is_encrypted_clips_dir(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.eq_ignore_ascii_case(ENCRYPTED_CLIPS_FOLDER))
        .unwrap_or(false)
}

pub fn scan_paths_for_encrypted_folder(paths: &[String]) -> bool {
    paths.iter().any(|path_str| {
        Path::new(path_str)
            .components()
            .filter_map(|component| component.as_os_str().to_str())
            .any(|part| part.eq_ignore_ascii_case(ENCRYPTED_CLIPS_FOLDER))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn detects_encrypted_clips_folder_in_path() {
        let path = Path::new(r"D:\TeslaCam\EncryptedClips\2026-06-16_02-11-07-front.mp4");
        assert!(path_in_encrypted_clips_folder(path));
    }

    #[test]
    fn ignores_normal_clip_paths() {
        let path = Path::new(r"D:\TeslaCam\SentryClips\2026-06-16_02-11-07-front.mp4");
        assert!(!path_in_encrypted_clips_folder(path));
    }

    #[test]
    fn encrypted_folder_path_counts_even_without_header_check() {
        let path = PathBuf::from(r"C:\USB\EncryptedClips\2026-06-16_02-11-07-front.mp4");
        assert!(is_likely_encrypted_clip(&path));
    }

    #[test]
    fn scan_paths_for_encrypted_folder_matches_input_paths() {
        let paths = vec![
            r"D:\TeslaCam\SentryClips".to_string(),
            r"E:\USB\EncryptedClips".to_string(),
        ];
        assert!(scan_paths_for_encrypted_folder(&paths));
    }
}
