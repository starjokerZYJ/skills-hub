use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;
use log::warn;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SkillMetadata {
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub dependencies: Vec<String>,
}

impl SkillMetadata {
    pub fn load<P: AsRef<Path>>(path: P) -> Option<Self> {
        let path = path.as_ref();
        
        // Try skill.yaml first, then skill.json
        let yaml_path = path.join("skill.yaml");
        if yaml_path.exists() {
            return Self::from_yaml(&yaml_path);
        }

        let yml_path = path.join("skill.yml");
        if yml_path.exists() {
            return Self::from_yaml(&yml_path);
        }

        let json_path = path.join("skill.json");
        if json_path.exists() {
            return Self::from_json(&json_path);
        }

        None
    }

    fn from_yaml(path: &Path) -> Option<Self> {
        match fs::read_to_string(path) {
            Ok(content) => match serde_yaml::from_str(&content) {
                Ok(meta) => Some(meta),
                Err(e) => {
                    warn!("Failed to parse skill.yaml at {:?}: {}", path, e);
                    None
                }
            },
            Err(e) => {
                warn!("Failed to read skill.yaml at {:?}: {}", path, e);
                None
            }
        }
    }

    fn from_json(path: &Path) -> Option<Self> {
        match fs::read_to_string(path) {
            Ok(content) => match serde_json::from_str(&content) {
                Ok(meta) => Some(meta),
                Err(e) => {
                    warn!("Failed to parse skill.json at {:?}: {}", path, e);
                    None
                }
            },
            Err(e) => {
                warn!("Failed to read skill.json at {:?}: {}", path, e);
                None
            }
        }
    }
}
