import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// URL.pathname keeps the leading slash before a Windows drive letter
// ("/D:/..."), which breaks path resolution there - fileURLToPath does not.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  base: "./",
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
  build: {
    target: "chrome152",
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
});
