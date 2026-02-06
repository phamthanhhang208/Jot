import { useEffect, useState } from "react";
import { loadConfig } from "@/lib/config";
import Onboarding from "@/components/Onboarding";

function App() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    loadConfig().then((config) => {
      setConfigured(config.notesRootPath !== null);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (!configured) {
    return <Onboarding onComplete={() => setConfigured(true)} />;
  }

  return <div>Jot loaded</div>;
}

export default App;
