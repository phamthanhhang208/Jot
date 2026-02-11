import { useMemo } from "react";
import { Folder, Pin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { useStore } from "@/store";
import { extractTags } from "@/lib/tags";
import type { Note } from "@/types";

const TRASH_FOLDER = "__trash__";

const SPECIAL_FOLDERS = ["All Notes", "Pinned", "Trash"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Extract a short plain-text preview from note content. */
function getPreview(content: string, max = 60): string {
  if (!content) return "";

  let plain: string;
  const trimmed = content.trimStart();

  if (trimmed.startsWith("{") || trimmed.startsWith("[{")) {
    // Tiptap / ProseMirror JSON → walk nodes for text
    try {
      const parsed: unknown = JSON.parse(content);
      const parts: string[] = [];
      function walk(n: unknown) {
        if (n && typeof n === "object") {
          const obj = n as Record<string, unknown>;
          if (typeof obj.text === "string") {
            parts.push(obj.text);
          }
          if (Array.isArray(obj.content)) {
            for (const c of obj.content) walk(c);
          }
          if (Array.isArray(obj.children)) {
            for (const c of obj.children) walk(c);
          }
        }
      }
      if (Array.isArray(parsed)) {
        for (const node of parsed) walk(node);
      } else {
        // Skip the first top-level node (title)
        const doc = parsed as Record<string, unknown>;
        const nodes = Array.isArray(doc.content) ? doc.content.slice(1) : [];
        for (const node of nodes) walk(node);
      }
      plain = parts.join(" ");
    } catch {
      plain = content;
    }
  } else {
    // Plain text / markdown → skip first line (title), strip syntax
    const lines = content.split("\n");
    plain = lines
      .slice(1)
      .join("\n")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/^>\s+/gm, "")
      .replace(/^[-*]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/\n+/g, " ");
  }

  plain = plain.trim();
  return plain.length > max ? plain.slice(0, max) + "\u2026" : plain;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NoteList() {
  const activeFolder = useStore((s) => s.activeFolder);
  const selectedNoteId = useStore((s) => s.selectedNoteId);
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const setSelectedNote = useStore((s) => s.setSelectedNote);
  const createNote = useStore((s) => s.createNote);
  const togglePin = useStore((s) => s.togglePin);
  const moveToTrash = useStore((s) => s.moveToTrash);
  const restoreFromTrash = useStore((s) => s.restoreFromTrash);
  const deleteForever = useStore((s) => s.deleteForever);
  const folders = useStore((s) => s.folders);
  const allNotes = useStore((s) => s.notes);
  const activeTag = useStore((s) => s.activeTag);
  const setActiveTag = useStore((s) => s.setActiveTag);

  const isTrash = activeFolder === "Trash";

  const notes = useMemo(() => {
    const query = search.toLowerCase();
    let filtered: Note[];

    if (activeFolder === "Trash") {
      filtered = allNotes.filter((n) => n.folder === TRASH_FOLDER);
    } else if (activeFolder === "All Notes") {
      filtered = allNotes.filter((n) => n.folder !== TRASH_FOLDER);
    } else if (activeFolder === "Pinned") {
      filtered = allNotes.filter((n) => n.pinned && n.folder !== TRASH_FOLDER);
    } else {
      filtered = allNotes.filter(
        (n) => n.folder === activeFolder && n.folder !== TRASH_FOLDER,
      );
    }

    if (query) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query),
      );
    }

    if (activeTag) {
      filtered = filtered.filter((n) =>
        extractTags(n.content).includes(activeTag),
      );
    }

    return filtered;
  }, [allNotes, activeFolder, search, activeTag]);

  function handleCreate() {
    const folder = SPECIAL_FOLDERS.includes(activeFolder) ? "" : activeFolder;
    createNote(folder);
  }

  return (
    <div className="flex h-screen w-65 flex-col border-r bg-background">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold truncate">{activeFolder}</h2>
          {activeTag && (
            <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0">
              #{activeTag}
              <button
                onClick={() => setActiveTag(null)}
                className="hover:text-foreground cursor-pointer"
                title="Clear tag filter"
              >
                &times;
              </button>
            </span>
          )}
        </div>
        {!isTrash && (
          <Button size="icon-xs" onClick={handleCreate}>
            <Plus className="size-3.5" />
          </Button>
        )}
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* ── Note cards ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {notes.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No notes found
          </p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              selected={note.id === selectedNoteId}
              isTrash={isTrash}
              onSelect={() => setSelectedNote(note.id)}
              onTogglePin={() => togglePin(note.id)}
              onMoveToTrash={() => moveToTrash(note.id)}
              onRestore={() => restoreFromTrash(note.id)}
              onDeleteForever={() => {
                deleteForever(note.id);
                setSelectedNote(null);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NoteCard
// ---------------------------------------------------------------------------

function NoteCard({
  note,
  selected,
  isTrash,
  onSelect,
  onTogglePin,
  onMoveToTrash,
  onRestore,
  onDeleteForever,
}: {
  note: Note;
  selected: boolean;
  isTrash: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onMoveToTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}) {
  const preview = getPreview(note.content);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={onSelect}
          className={`w-full text-left rounded-lg p-2.5 mb-1 transition-colors cursor-pointer border-l-4 ${
            selected
              ? "bg-muted border-primary"
              : "border-transparent hover:bg-muted"
          }`}
        >
          {/* Row 1: title + pin */}
          <div className="flex items-center gap-1">
            <span className="flex-1 truncate text-sm font-semibold">
              {note.title}
            </span>
            {note.pinned && (
              <Pin className="size-3 shrink-0 text-muted-foreground" />
            )}
          </div>

          {/* Row 2: date · preview */}
          <div className="mt-0.5 flex items-baseline gap-1 text-xs text-muted-foreground">
            <span className="shrink-0">{formatDate(note.updatedAt)}</span>
            {preview && (
              <>
                <span>·</span>
                <span className="truncate">{preview}</span>
              </>
            )}
          </div>

          {/* Original folder badge for trashed notes */}
          {isTrash && note.originalFolder && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Folder className="size-3 shrink-0" />
              <span className="truncate">{note.originalFolder}</span>
            </div>
          )}
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {isTrash ? (
          <>
            <ContextMenuItem onClick={onRestore}>Restore</ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={onDeleteForever}>
              Delete Forever
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onClick={onTogglePin}>
              {note.pinned ? "Unpin" : "Pin"}
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={onMoveToTrash}>
              Move to Trash
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
