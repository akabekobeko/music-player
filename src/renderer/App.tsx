import type { Versions } from "@mp/ipc";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function App() {
  const [count, setCount] = useState(0);
  const [versions, setVersions] = useState<Versions | null>(null);

  useEffect(() => {
    let disposed = false;
    window.mp.app.getVersions().then((result) => {
      if (!disposed && result.ok) {
        setVersions(result.value);
      }
    });
    return () => {
      disposed = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-8 text-center">
      <h1 className="text-4xl font-bold leading-tight">
        Electron + Vite + React
      </h1>
      <div className="py-8">
        <Button variant="outline" onClick={() => setCount((c) => c + 1)}>
          count is {count}
        </Button>
      </div>
      {versions && (
        <div className="mt-8 space-y-1 text-sm text-muted-foreground">
          <p>App: {versions.app}</p>
          <p>Electron: {versions.electron}</p>
          <p>Chrome: {versions.chrome}</p>
          <p>Node: {versions.node}</p>
        </div>
      )}
    </div>
  );
}

export default App;
