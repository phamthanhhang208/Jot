import { useRef, useState } from "react";
import {
  FileText,
  Pin,
  Folder,
  FolderPlus,
  Trash2,
  Settings,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStore, getPinnedCount, getTrashCount, getFolderCount } from "@/store";
import { createFolder } from "@/lib/fs";

const TRASH_FOLDER = "__trash__";

export default function Sidebar() {
  const activeFolder = useStore((s) => s.activeFolder);
  const setActiveFolder = useStore((s) => s.setActiveFolder);
  const addFolder = useStore((s) => s.addFolder);
  const notes = useStore((s) => s.notes);

  const folders = useStore((s) => s.folders);
  const allNotesCount = notes.filter((n) => n.folder !== TRASH_FOLDER).length;
  const pinnedCount = useStore(getPinnedCount);
  const trashCount = useStore(getTrashCount);

  const [collapsed, setCollapsed] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleNewFolderClick() {
    if (collapsed) {
      setCollapsed(false);
      setTimeout(() => {
        setCreatingFolder(true);
        setNewFolderName("");
        setTimeout(() => inputRef.current?.focus(), 0);
      }, 200);
      return;
    }
    setCreatingFolder(true);
    setNewFolderName("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitFolder() {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      addFolder(trimmed);
      setActiveFolder(trimmed);
      const rootPath = useStore.getState().notesRootPath;
      if (rootPath) {
        createFolder(rootPath, trimmed).catch(console.error);
      }
    }
    setCreatingFolder(false);
    setNewFolderName("");
  }

  function cancelFolder() {
    setCreatingFolder(false);
    setNewFolderName("");
  }

  return (
    <aside
      className="flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r transition-[width] duration-200 overflow-hidden"
      style={{ width: collapsed ? 48 : 200 }}
    >
      {/* ── Scrollable body ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 pt-4 pb-2 space-y-4">
        {/* Smart Folders */}
        <section>
          {!collapsed && <SectionLabel>Smart Folders</SectionLabel>}
          <Row
            icon={<FileText className="size-4 shrink-0" />}
            label="All Notes"
            count={allNotesCount}
            active={activeFolder === "All Notes"}
            variant="smart"
            collapsed={collapsed}
            onClick={() => setActiveFolder("All Notes")}
          />
          <Row
            icon={<Pin className="size-4 shrink-0" />}
            label="Pinned"
            count={pinnedCount}
            active={activeFolder === "Pinned"}
            variant="smart"
            collapsed={collapsed}
            onClick={() => setActiveFolder("Pinned")}
          />
        </section>

        {/* Folders */}
        <section>
          {!collapsed && <SectionLabel>Folders</SectionLabel>}
          {folders.map((folder) => (
            <Row
              key={folder}
              icon={<Folder className="size-4 shrink-0" />}
              label={folder}
              count={getFolderCount(useStore.getState(), folder)}
              active={activeFolder === folder}
              variant="folder"
              collapsed={collapsed}
              onClick={() => setActiveFolder(folder)}
            />
          ))}

          {!collapsed && creatingFolder ? (
            <div className="px-2 py-1">
              <Input
                ref={inputRef}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitFolder();
                  if (e.key === "Escape") cancelFolder();
                }}
                onBlur={commitFolder}
                placeholder="Folder name"
                className="h-7 text-sm"
              />
            </div>
          ) : (
            <button
              onClick={handleNewFolderClick}
              className={`flex w-full items-center rounded-md py-1.5 text-sm text-muted-foreground hover:bg-muted cursor-pointer ${
                collapsed ? "justify-center px-0" : "gap-2 px-2"
              }`}
              title={collapsed ? "New Folder" : undefined}
            >
              {collapsed ? (
                <FolderPlus className="size-4 shrink-0" />
              ) : (
                <>
                  <span className="text-base leading-none">+</span>
                  <span className="truncate">New Folder...</span>
                </>
              )}
            </button>
          )}
        </section>

        {/* System */}
        <section className="border-t pt-3">
          {!collapsed && <SectionLabel>System</SectionLabel>}
          <Row
            icon={<Trash2 className="size-4 shrink-0" />}
            label="Trash"
            count={trashCount}
            active={activeFolder === "Trash"}
            variant="trash"
            collapsed={collapsed}
            onClick={() => setActiveFolder("Trash")}
          />
        </section>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────── */}
      <div
        className={`flex items-center border-t px-2 py-2 text-muted-foreground ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && <Settings className="size-4 shrink-0" />}
        {!collapsed && (
          <span className="text-[10px] uppercase tracking-wide">Local Storage</span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hover:text-foreground cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground select-none">
      {children}
    </p>
  );
}

function Row({
  icon,
  label,
  count,
  active,
  variant,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  variant: "smart" | "folder" | "trash";
  collapsed: boolean;
  onClick: () => void;
}) {
  const base =
    "flex w-full items-center rounded-md py-1.5 text-sm cursor-pointer select-none";

  let stateClass: string;
  if (active && variant === "smart") {
    stateClass = "bg-primary text-primary-foreground";
  } else if (active) {
    stateClass = "bg-muted";
  } else {
    stateClass = "hover:bg-muted";
  }

  const textClass = variant === "trash" && !active ? "text-destructive" : "";

  return (
    <button
      onClick={onClick}
      className={`${base} ${stateClass} ${textClass} ${
        collapsed ? "justify-center px-0" : "gap-2 px-2"
      }`}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {count > 0 && (
            <span className="text-xs tabular-nums opacity-60">{count}</span>
          )}
        </>
      )}
    </button>
  );
}
