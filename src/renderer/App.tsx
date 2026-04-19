import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  const versions = window.electronAPI?.versions;

  return (
    <div className="mx-auto max-w-3xl p-8 text-center">
      <h1 className="text-4xl font-bold leading-tight">
        Electron + Vite + React
      </h1>
      <div className="py-8">
        <button
          className="cursor-pointer rounded-lg border border-transparent bg-gray-100 px-5 py-2.5 font-medium transition-colors hover:border-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
          onClick={() => setCount((c) => c + 1)}
        >
          count is {count}
        </button>
      </div>
      {versions && (
        <div className="mt-8 space-y-1 text-sm text-gray-400">
          <p>Electron: {versions.electron}</p>
          <p>Chrome: {versions.chrome}</p>
          <p>Node: {versions.node}</p>
        </div>
      )}
    </div>
  );
}

export default App;
