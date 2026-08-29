import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// URL.pathname keeps the leading slash before a Windows drive letter
// ("/D:/..."), which breaks path resolution there - fileURLToPath does not.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  build: {
    target: "node24",
    outDir: "../../dist/main",
    lib: {
      entry: "main.ts",
      formats: ["es"],
      fileName: () => "main.js",
    },
    minify: false,
    emptyOutDir: true,
    rolldownOptions: {
      external: [
        "electron",
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
    },
  },
});
