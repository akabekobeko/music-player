import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  base: "./",
  build: {
    target: "chrome146",
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
});
