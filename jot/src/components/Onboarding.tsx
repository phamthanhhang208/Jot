import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { homeDir } from "@tauri-apps/api/path";
import { Cloud, Box, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveConfig } from "@/lib/config";

interface OnboardingProps {
  onComplete: () => void;
}

const ICLOUD_SUBPATH =
  "Library/Mobile Documents/com~apple~CloudDocs";
const DROPBOX_SUBPATH = "Dropbox";

interface FolderOption {
  icon: React.ReactNode;
  label: string;
  subtext: string;
  getDefaultPath: () => Promise<string>;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const options: FolderOption[] = [
    {
      icon: <Cloud className="size-5 shrink-0 text-muted-foreground" />,
      label: "iCloud Drive",
      subtext: `~/${ICLOUD_SUBPATH}`,
      getDefaultPath: async () => {
        const home = await homeDir();
        return `${home}${ICLOUD_SUBPATH}`;
      },
    },
    {
      icon: <Box className="size-5 shrink-0 text-muted-foreground" />,
      label: "Dropbox",
      subtext: `~/${DROPBOX_SUBPATH}`,
      getDefaultPath: async () => {
        const home = await homeDir();
        return `${home}${DROPBOX_SUBPATH}`;
      },
    },
    {
      icon: <Folder className="size-5 shrink-0 text-muted-foreground" />,
      label: "Choose folder\u2026",
      subtext: "Pick any folder on your Mac",
      getDefaultPath: async () => {
        return await homeDir();
      },
    },
  ];

  async function handlePickFolder(option: FolderOption) {
    const defaultPath = await option.getDefaultPath();
    const result = await open({
      directory: true,
      multiple: false,
      defaultPath,
    });
    if (result) {
      setSelectedPath(result as string);
    }
  }

  async function handleConfirm() {
    if (!selectedPath) return;
    setSaving(true);
    try {
      await saveConfig({ notesRootPath: selectedPath });
      onComplete();
    } catch (err) {
      console.error("Failed to save config:", err);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <Card className="w-full max-w-[480px] rounded-xl border shadow-lg">
        <CardContent className="flex flex-col gap-6 p-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Jot</h1>
            <h2 className="text-lg font-semibold">
              Where should we store your notes?
            </h2>
            <p className="text-sm text-muted-foreground">
              Jot saves every note as a .md file. Choose a cloud-synced folder
              (iCloud, Dropbox) to keep notes in sync across devices.
            </p>
          </div>

          {selectedPath === null ? (
            /* Folder suggestion cards */
            <div className="flex flex-col gap-2">
              {options.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  className="h-auto justify-start gap-3 px-4 py-3 text-left"
                  onClick={() => handlePickFolder(option)}
                >
                  {option.icon}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {option.subtext}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            /* Confirmation view */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">
                  Your notes will be stored in:
                </p>
                <code className="block rounded bg-muted p-2 font-mono text-sm break-all">
                  {selectedPath}
                </code>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirm} disabled={saving}>
                  {saving ? "Saving\u2026" : "Confirm & Continue"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPath(null)}
                  disabled={saving}
                >
                  Change
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
