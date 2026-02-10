import { useEffect, useRef, useState } from "react";
import { loadConfig } from "@/lib/config";
import { ensureDirs, loadAllNotes, loadFolders, saveNote, deleteFile } from "@/lib/fs";
import { useStore } from "@/store";
import type { Note } from "@/types";

async function syncNotesToDisk(
  rootPath: string,
  prev: Note[],
  current: Note[],
) {
  const prevMap = new Map(prev.map((n) => [n.id, n]));
  const currentMap = new Map(current.map((n) => [n.id, n]));

  // Save new or changed notes
  for (const note of current) {
    const prevNote = prevMap.get(note.id);
    if (!prevNote || prevNote.updatedAt !== note.updatedAt) {
      if (prevNote && prevNote.folder !== note.folder) {
        await deleteFile(rootPath, prevNote);
      }
      await saveNote(rootPath, note);
    }
  }

  // Delete notes that were removed entirely
  for (const prevNote of prev) {
    if (!currentMap.has(prevNote.id)) {
      await deleteFile(rootPath, prevNote);
    }
  }
}

/**
 * Loads config, hydrates the Zustand store, and sets up
 * debounced file-sync on every notes change.
 *
 * Returns:
 *  - `undefined` while loading
 *  - `null` if no notesRootPath is configured (show onboarding)
 *  - the path string once initialised
 */
export function useAppInit(): string | null | undefined {
  const storeRootPath = useStore((s) => s.notesRootPath);
  const [loading, setLoading] = useState(true);

  const hydratedRef = useRef(false);
  const prevNotesRef = useRef<Note[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncUnsubRef = useRef<(() => void) | null>(null);

  // ── Step 1: load config on mount ──────────────────────────────────────
  useEffect(() => {
    loadConfig().then((config) => {
      if (config.notesRootPath) {
        useStore.getState().setNotesRootPath(config.notesRootPath);
      }
      setLoading(false);
    });
  }, []);

  // ── Step 2: hydrate store & set up sync subscription ──────────────────
  useEffect(() => {
    if (!storeRootPath || hydratedRef.current) return;
    hydratedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        await ensureDirs(storeRootPath);
        const [folders, notes] = await Promise.all([
          loadFolders(storeRootPath),
          loadAllNotes(storeRootPath),
        ]);
        if (cancelled) return;

        // Set folders first so setNotes merges rather than overwrites
        useStore.getState().setFolders(folders);
        prevNotesRef.current = notes;
        useStore.getState().setNotes(notes);

        // Subscribe to notes changes & debounce saves
        syncUnsubRef.current = useStore.subscribe((state, prev) => {
          if (state.notes === prev.notes) return;

          if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
          }
          timerRef.current = setTimeout(() => {
            const current = useStore.getState().notes;
            const prevNotes = prevNotesRef.current;
            syncNotesToDisk(storeRootPath, prevNotes, current);
            prevNotesRef.current = current;
          }, 800);
        });
      } catch (err) {
        console.error("Failed to hydrate notes:", err);
      }
    })();

    return () => {
      cancelled = true;
      hydratedRef.current = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      syncUnsubRef.current?.();
      syncUnsubRef.current = null;
    };
  }, [storeRootPath]);

  if (loading) return undefined;
  return storeRootPath;
}
