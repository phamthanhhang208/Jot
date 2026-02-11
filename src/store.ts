import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Note } from "./types";
import { extractTags } from "./lib/tags";

const TRASH_FOLDER = "__trash__";

interface AppState {
  notesRootPath: string | null;
  notes: Note[];
  folders: string[];
  activeFolder: string;
  selectedNoteId: string | null;
  search: string;
  darkMode: boolean;
  activeTag: string | null;

  setNotesRootPath: (path: string) => void;
  setNotes: (notes: Note[]) => void;
  setActiveFolder: (folder: string) => void;
  setSelectedNote: (id: string | null) => void;
  setSearch: (query: string) => void;
  toggleDarkMode: () => void;
  createNote: (folder: string) => void;
  updateNote: (id: string, partial: Partial<Note>) => void;
  togglePin: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  deleteForever: (id: string) => void;
  deleteFolder: (folderName: string) => void;
  setFolders: (folders: string[]) => void;
  addFolder: (name: string) => void;
  setActiveTag: (tag: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  notesRootPath: null,
  notes: [],
  folders: [],
  activeFolder: "All Notes",
  selectedNoteId: null,
  search: "",
  darkMode: false,
  activeTag: null,

  setNotesRootPath: (path) => set({ notesRootPath: path }),

  setNotes: (notes) => {
    // Merge note-derived folders with any already-loaded folders (e.g. empty dirs)
    set((s) => {
      const folderSet = new Set<string>(s.folders);
      for (const n of notes) {
        if (n.folder && n.folder !== TRASH_FOLDER) folderSet.add(n.folder);
      }
      return { notes, folders: [...folderSet] };
    });
  },

  setActiveFolder: (folder) => set({ activeFolder: folder, activeTag: null }),

  setSelectedNote: (id) => set({ selectedNoteId: id }),

  setSearch: (query) => set({ search: query }),

  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

  createNote: (folder) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: uuidv4(),
      title: "Untitled",
      content: "",
      folder,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({
      notes: [note, ...s.notes],
      selectedNoteId: note.id,
      folders: !folder || s.folders.includes(folder) ? s.folders : [...s.folders, folder],
    }));
  },

  updateNote: (id, partial) =>
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, ...partial, updatedAt: new Date().toISOString() } : n
      ),
    })),

  togglePin: (id) =>
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
      ),
    })),

  moveToTrash: (id) =>
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id
          ? {
              ...n,
              originalFolder: n.folder !== TRASH_FOLDER ? n.folder : n.originalFolder,
              folder: TRASH_FOLDER,
              updatedAt: new Date().toISOString(),
            }
          : n
      ),
      selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
    })),

  restoreFromTrash: (id) =>
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id
          ? {
              ...n,
              folder: n.originalFolder || "",
              originalFolder: undefined,
              updatedAt: new Date().toISOString(),
            }
          : n
      ),
    })),

  deleteForever: (id) =>
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
    })),

  deleteFolder: (folderName) =>
    set((s) => {
      const now = new Date().toISOString();
      const notes = s.notes.map((n) =>
        n.folder === folderName
          ? { ...n, originalFolder: folderName, folder: TRASH_FOLDER, updatedAt: now }
          : n
      );
      const folders = s.folders.filter((f) => f !== folderName);
      const selectedNoteId =
        s.selectedNoteId && notes.find((n) => n.id === s.selectedNoteId)?.folder === TRASH_FOLDER
          ? null
          : s.selectedNoteId;
      const activeFolder = s.activeFolder === folderName ? "All Notes" : s.activeFolder;
      return { notes, folders, selectedNoteId, activeFolder };
    }),

  setFolders: (folders) => set({ folders }),

  addFolder: (name) =>
    set((s) =>
      s.folders.includes(name) ? s : { folders: [...s.folders, name] }
    ),

  setActiveTag: (tag) => set({ activeTag: tag }),
}));

// Selectors

export function getFilteredNotes(state: AppState): Note[] {
  const { notes, activeFolder, search } = state;
  const query = search.toLowerCase();

  let filtered: Note[];
  if (activeFolder === "Trash") {
    filtered = notes.filter((n) => n.folder === TRASH_FOLDER);
  } else if (activeFolder === "All Notes") {
    filtered = notes.filter((n) => n.folder !== TRASH_FOLDER);
  } else {
    filtered = notes.filter(
      (n) => n.folder === activeFolder && n.folder !== TRASH_FOLDER
    );
  }

  if (query) {
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
    );
  }

  return filtered;
}

export function getPinnedCount(state: AppState): number {
  return state.notes.filter((n) => n.pinned && n.folder !== TRASH_FOLDER).length;
}

export function getTrashCount(state: AppState): number {
  return state.notes.filter((n) => n.folder === TRASH_FOLDER).length;
}

export function getFolderCount(state: AppState, folder: string): number {
  return state.notes.filter((n) => n.folder === folder).length;
}

let _cachedNotes: Note[] = [];
let _cachedTags: { tag: string; count: number }[] = [];

export function getAllTags(state: AppState): { tag: string; count: number }[] {
  if (state.notes === _cachedNotes) return _cachedTags;
  _cachedNotes = state.notes;

  const tagCounts = new Map<string, number>();

  for (const note of state.notes) {
    if (note.folder === TRASH_FOLDER) continue;
    const tags = extractTags(note.content);
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  _cachedTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));

  return _cachedTags;
}
