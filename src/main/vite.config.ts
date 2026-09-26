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

// `import.meta.env.DEV` follows NODE_ENV, which Vite reads from the
// environment (`vite build` only defaults it to production when unset). Derive
// it from the mode here, before Vite resolves it, so a stray NODE_ENV in the
// caller's shell or CI can neither keep development-only code in a production
// bundle nor strip it from a development one.
const nodeEnvOf = (mode: string): "development" | "production" =>
  mode === "development" ? "development" : "production";

export default defineConfig(({ mode }) => {
  process.env.NODE_ENV = nodeEnvOf(mode);
  return {
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
  };
});
