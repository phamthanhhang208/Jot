import { useEffect } from "react";
import { loadConfig } from "@/lib/config";
import { useAppInit } from "@/hooks/useInit";
import { useStore } from "@/store";
import Onboarding from "@/components/Onboarding";
import Sidebar from "@/components/Sidebar";
import NoteList from "@/components/NoteList";
import JotEditor from "@/components/JotEditor";

function App() {
  const notesRootPath = useAppInit();
  const darkMode = useStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (notesRootPath === undefined) return null;

  if (notesRootPath === null) {
    return (
      <Onboarding
        onComplete={async () => {
          const config = await loadConfig();
          if (config.notesRootPath) {
            useStore.getState().setNotesRootPath(config.notesRootPath);
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <NoteList />
      <JotEditor />
    </div>
  );
}

export default App;
