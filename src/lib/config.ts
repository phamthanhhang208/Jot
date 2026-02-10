import { appDataDir, join } from "@tauri-apps/api/path";
import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from "@tauri-apps/plugin-fs";

export interface AppConfig {
  notesRootPath: string | null;
}

const CONFIG_FILENAME = "config.json";

async function getConfigPath(): Promise<string> {
  const dir = await appDataDir();
  return await join(dir, CONFIG_FILENAME);
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const path = await getConfigPath();
    const fileExists = await exists(path);
    if (!fileExists) {
      return { notesRootPath: null };
    }
    const content = await readTextFile(path);
    return JSON.parse(content) as AppConfig;
  } catch {
    return { notesRootPath: null };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const dir = await appDataDir();
  const dirExists = await exists(dir);
  if (!dirExists) {
    await mkdir(dir, { recursive: true });
  }
  const path = await getConfigPath();
  await writeTextFile(path, JSON.stringify(config, null, 2));
}
