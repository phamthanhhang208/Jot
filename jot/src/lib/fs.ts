import {
  readTextFile,
  writeTextFile,
  mkdir,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";
import type { Note } from "@/types";

const TRASH_FOLDER = "__trash__";
const TRASH_DIR = ".trash";

// ---------------------------------------------------------------------------
// Internal helpers – front matter
// ---------------------------------------------------------------------------

function parseFrontMatter(raw: string): {
  meta: Record<string, string>;
  content: string;
} {
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== "---") {
    return { meta: {}, content: raw };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    return { meta: {}, content: raw };
  }

  const meta: Record<string, string> = {};
  for (let i = 1; i < endIndex; i++) {
    const colonIdx = lines[i].indexOf(":");
    if (colonIdx > 0) {
      const key = lines[i].slice(0, colonIdx).trim();
      const value = lines[i].slice(colonIdx + 1).trim();
      meta[key] = value;
    }
  }

  const contentLines = lines.slice(endIndex + 1);
  if (contentLines.length > 0 && contentLines[0].trim() === "") {
    contentLines.shift();
  }

  return { meta, content: contentLines.join("\n") };
}

function buildFrontMatter(note: Note): string {
  return [
    "---",
    `title: ${note.title}`,
    `id: ${note.id}`,
    `folder: ${note.folder}`,
    `pinned: ${note.pinned}`,
    `createdAt: ${note.createdAt}`,
    `updatedAt: ${note.updatedAt}`,
    "---",
  ].join("\n");
}


// ---------------------------------------------------------------------------
// Exported API
// ---------------------------------------------------------------------------

export async function ensureDirs(rootPath: string): Promise<void> {
  await mkdir(rootPath, { recursive: true });
}

export async function saveNote(
  rootPath: string,
  note: Note,
): Promise<void> {
  let dir: string;
  if (note.folder === TRASH_FOLDER) {
    dir = `${rootPath}/${TRASH_DIR}`;
  } else if (note.folder) {
    dir = `${rootPath}/${note.folder}`;
  } else {
    dir = rootPath;
  }

  await mkdir(dir, { recursive: true });

  const fileContent = buildFrontMatter(note) + "\n\n" + note.content;
  await writeTextFile(`${dir}/${note.id}.md`, fileContent);
}

export async function loadAllNotes(
  rootPath: string,
): Promise<Note[]> {
  const notes: Note[] = [];

  let topEntries;
  try {
    topEntries = await readDir(rootPath);
  } catch {
    return notes;
  }

  // Load .md files directly in the root (no folder)
  for (const entry of topEntries) {
    if (entry.isDirectory || !entry.name.endsWith(".md")) continue;

    try {
      const raw = await readTextFile(`${rootPath}/${entry.name}`);
      const { meta, content } = parseFrontMatter(raw);

      notes.push({
        id: meta.id ?? entry.name.replace(/\.md$/, ""),
        title: meta.title ?? "Untitled",
        content,
        folder: meta.folder ?? "",
        pinned: meta.pinned === "true",
        createdAt: meta.createdAt ?? new Date().toISOString(),
        updatedAt: meta.updatedAt ?? new Date().toISOString(),
      });
    } catch {
      // skip files that can't be read/parsed
    }
  }

  // Load .md files inside subdirectories
  for (const entry of topEntries) {
    if (!entry.isDirectory) continue;

    const folderName = entry.name;
    const isTrash = folderName === TRASH_DIR;
    const dirPath = `${rootPath}/${folderName}`;

    try {
      const mdFiles = await readDir(dirPath);

      for (const file of mdFiles) {
        if (!file.name.endsWith(".md")) continue;

        try {
          const raw = await readTextFile(`${dirPath}/${file.name}`);
          const { meta, content } = parseFrontMatter(raw);

          notes.push({
            id: meta.id ?? file.name.replace(/\.md$/, ""),
            title: meta.title ?? "Untitled",
            content,
            folder: isTrash
              ? TRASH_FOLDER
              : (meta.folder ?? folderName),
            pinned: meta.pinned === "true",
            createdAt: meta.createdAt ?? new Date().toISOString(),
            updatedAt: meta.updatedAt ?? new Date().toISOString(),
          });
        } catch {
          // skip files that can't be read/parsed
        }
      }
    } catch {
      // skip directories that can't be read
    }
  }

  return notes;
}

/** Read subdirectories in rootPath and return them as folder names. */
export async function loadFolders(rootPath: string): Promise<string[]> {
  try {
    const entries = await readDir(rootPath);
    return entries
      .filter((e) => e.isDirectory && e.name !== TRASH_DIR && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/** Create a folder directory on disk. */
export async function createFolder(
  rootPath: string,
  name: string,
): Promise<void> {
  await mkdir(`${rootPath}/${name}`, { recursive: true });
}

export async function deleteFile(
  rootPath: string,
  note: Note,
): Promise<void> {
  let dir: string;
  if (note.folder === TRASH_FOLDER) {
    dir = `${rootPath}/${TRASH_DIR}`;
  } else if (note.folder) {
    dir = `${rootPath}/${note.folder}`;
  } else {
    dir = rootPath;
  }

  const filePath = `${dir}/${note.id}.md`;

  try {
    await remove(filePath);
  } catch {
    // file may not exist, ignore
  }
}
