import path from "node:path";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  resolve: {
    alias: {
      // Electron 42+ fetches its binary lazily on first bin launch, so importing
      // the real module from Node throws ENOENT (missing path.txt). Main-process
      // unit tests never need the real runtime — swap it for a Node-safe stub.
      electron: path.resolve(__dirname, "src/test/electron.mock.ts"),
      // Mirror the Renderer vite config's alias so its modules resolve here.
      "@": path.resolve(__dirname, "src/renderer"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
