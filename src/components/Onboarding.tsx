import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { homeDir } from "@tauri-apps/api/path";
import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveConfig } from "@/lib/config";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePickFolder() {
    const result = await open({
      directory: true,
      multiple: false,
      defaultPath: await homeDir(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="max-w-lg mx-auto text-center px-6">
        {/* Header */}
        <h1 className="text-4xl font-bold">Jot</h1>
        <h2 className="text-xl font-semibold mt-4">
          Choose where to store your notes
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Jot saves every note as a plain markdown file in one folder. Store it
          anywhere — your Documents folder, iCloud Drive, Dropbox — your notes,
          your control.
        </p>

        {/* Folder picker */}
        <div className="mt-8">
          <Button size="lg" onClick={handlePickFolder}>
            <Folder />
            Choose Folder
          </Button>
        </div>

        {/* Selected path + actions */}
        {selectedPath && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <code className="block bg-muted px-3 py-2 rounded font-mono text-sm break-all text-left">
              {selectedPath}
            </code>
            <div className="flex gap-2">
              <Button onClick={handleConfirm} disabled={saving}>
                {saving ? "Saving\u2026" : "Confirm & Continue"}
              </Button>
              <Button
                variant="ghost"
                onClick={handlePickFolder}
                disabled={saving}
              >
                Change Folder
              </Button>
            </div>
          </div>
        )}

        {/* Tip */}
        <p className="mt-12 text-sm text-muted-foreground">
          💡 Tip: Choose an iCloud or Dropbox folder to automatically sync notes
          across your devices
        </p>
      </div>
    </div>
  );
}
