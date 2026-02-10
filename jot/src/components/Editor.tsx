import { useRef } from "react";
import { Pin, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

const TRASH_FOLDER = "__trash__";

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  const date = d
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toUpperCase();
  return `${date} · ${time}`;
}

function extractTitle(content: string): string {
  const firstLine = content.split("\n")[0]?.replace(/^#+\s*/, "").trim();
  return firstLine || "Untitled";
}

export default function Editor() {
  const selectedNoteId = useStore((s) => s.selectedNoteId);
  const notes = useStore((s) => s.notes);
  const updateNote = useStore((s) => s.updateNote);
  const togglePin = useStore((s) => s.togglePin);
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const moveToTrash = useStore((s) => s.moveToTrash);
  const restoreFromTrash = useStore((s) => s.restoreFromTrash);
  const deleteForever = useStore((s) => s.deleteForever);
  const setSelectedNote = useStore((s) => s.setSelectedNote);

  const note = notes.find((n) => n.id === selectedNoteId) ?? null;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!note) {
    return (
      <div className="flex flex-1 min-w-0 items-center justify-center text-muted-foreground">
        Select a note or create a new one
      </div>
    );
  }

  const isTrash = note.folder === TRASH_FOLDER;

  function handleContentChange(value: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const title = extractTitle(value);
      updateNote(note!.id, { content: value, title });
    }, 800);
  }

  function handleDeleteForever() {
    deleteForever(note!.id);
    setSelectedNote(null);
  }

  return (
    <div className="flex flex-1 min-w-0 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePin(note.id)}
            className={
              note.pinned ? "text-yellow-500" : "text-muted-foreground"
            }
          >
            <Pin className="size-4" />
          </Button>
          <p className="text-xs uppercase text-muted-foreground tracking-wide">
            {formatDateHeader(note.createdAt)}
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <textarea
            key={note.id}
            className="w-full h-full min-h-[calc(100vh-12rem)] resize-none bg-transparent outline-none font-mono text-sm leading-relaxed"
            defaultValue={note.content}
            onChange={(e) => handleContentChange(e.target.value)}
            readOnly={isTrash}
            placeholder="Start writing…"
          />
        </div>
      </div>

      {/* Bottom bar */}
      {isTrash ? (
        <div className="flex items-center justify-center gap-3 border-t border-destructive bg-destructive/10 px-6 py-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => restoreFromTrash(note.id)}
          >
            Restore
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteForever}>
            Delete Forever
          </Button>
        </div>
      ) : (
        <div className="flex justify-end border-t px-6 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => moveToTrash(note.id)}
          >
            Move to Trash
          </Button>
        </div>
      )}
    </div>
  );
}
