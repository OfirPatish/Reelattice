use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::tesla::parser::{is_tesla_cam_root, resolve_tesla_cam_root};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TeslaCamDriveMatch {
    pub volume_id: String,
    pub mount_path: String,
    pub tesla_cam_root: String,
    pub volume_label: String,
    pub drive_letter: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeslaCamDriveDetectedPayload {
    pub drives: Vec<TeslaCamDriveMatch>,
}

pub fn scan_teslacam_drives() -> Vec<TeslaCamDriveMatch> {
    scan_teslacam_drives_platform()
}

#[cfg(windows)]
fn scan_teslacam_drives_platform() -> Vec<TeslaCamDriveMatch> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    use windows::core::PCWSTR;
    use windows::Win32::Storage::FileSystem::{
        GetDriveTypeW, GetLogicalDrives, GetVolumeInformationW,
    };

    fn drive_root(letter: char) -> PathBuf {
        PathBuf::from(format!("{}:\\", letter))
    }

    fn wide_path(path: &Path) -> Vec<u16> {
        OsStr::new(path.as_os_str())
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    }

    fn drive_type(root: &Path) -> u32 {
        let wide = wide_path(root);
        unsafe { GetDriveTypeW(PCWSTR(wide.as_ptr())) }
    }

    fn is_candidate_drive(letter: char, drive_type: u32) -> bool {
        if letter == 'C' {
            return false;
        }

        // DRIVE_REMOVABLE = 2, DRIVE_FIXED = 3
        matches!(drive_type, 2 | 3)
    }

    fn volume_info(root: &Path) -> (String, String) {
        let mut label_buf = [0u16; 256];
        let mut serial: u32 = 0;
        let wide = wide_path(root);

        let ok = unsafe {
            GetVolumeInformationW(
                PCWSTR(wide.as_ptr()),
                Some(&mut label_buf),
                Some(&mut serial),
                None,
                None,
                None,
            )
        };

        if ok.is_err() {
            return (
                format!("path-{}", root.to_string_lossy().to_lowercase()),
                String::new(),
            );
        }

        let label_end = label_buf
            .iter()
            .position(|&ch| ch == 0)
            .unwrap_or(label_buf.len());
        let label = String::from_utf16_lossy(&label_buf[..label_end])
            .trim()
            .to_string();

        let volume_id = if serial != 0 {
            format!("{serial:08X}-{label}")
        } else if !label.is_empty() {
            format!("label-{label}")
        } else {
            format!("path-{}", root.to_string_lossy().to_lowercase())
        };

        (volume_id, label)
    }

    let mut results = Vec::new();
    let bitmask = unsafe { GetLogicalDrives() };

    for index in 0..26 {
        if bitmask & (1 << index) == 0 {
            continue;
        }

        let letter = (b'A' + index) as char;
        let mount = drive_root(letter);
        if !is_candidate_drive(letter, drive_type(&mount)) {
            continue;
        }

        let resolved = resolve_tesla_cam_root(&mount);
        if !is_tesla_cam_root(&resolved) {
            continue;
        }

        let (volume_id, volume_label) = volume_info(&mount);
        results.push(TeslaCamDriveMatch {
            volume_id,
            mount_path: mount.to_string_lossy().to_string(),
            tesla_cam_root: resolved.to_string_lossy().to_string(),
            volume_label,
            drive_letter: format!("{letter}:"),
        });
    }

    results
}

#[cfg(not(windows))]
fn scan_teslacam_drives_platform() -> Vec<TeslaCamDriveMatch> {
    Vec::new()
}

