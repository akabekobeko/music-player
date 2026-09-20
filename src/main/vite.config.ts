import { readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// URL.pathname keeps the leading slash before a Windows drive letter
// ("/D:/..."), which breaks path resolution there - fileURLToPath does not.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// electron-builder names the packaged app's userData directory after
// `productName`, so the same value is injected into the main process to make
// unpackaged runs share that directory (see README "Development userData
// Directory").
const pkg = JSON.parse(
  readFileSync(path.join(__dirname, "../../package.json"), "utf-8"),
) as { name: string; productName?: string };

export default defineConfig({
  root: __dirname,
  define: {
    __APP_PRODUCT_NAME__: JSON.stringify(pkg.productName ?? pkg.name),
  },
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
