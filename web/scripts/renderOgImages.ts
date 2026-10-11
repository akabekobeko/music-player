import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { en } from "../src/i18n/en.ts";
import { ja } from "../src/i18n/ja.ts";

/**
 * Render the OGP images into `public/` (docs/specs/web/features/pages.md):
 * `og-image.png` (English tagline) and `og-image-ja.png`. Electron draws
 * them offscreen so they use the site's font and colours; the `electron`
 * package comes from the root workspace.
 *
 * Usage: `pnpm --filter parade-web og:render`
 */

const webRoot = path.join(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const fontPath = require.resolve(
  "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
);
// The `electron` package exports the path of its executable; resolving it
// this way works without the .bin shim (and so on Windows too).
const electronPath: string = require("electron");
const iconPath = path.join(webRoot, "public/icon.svg");

const images = [
  { file: "og-image.png", lang: "en", tagline: en["site.tagline"] },
  { file: "og-image-ja.png", lang: "ja", tagline: ja["site.tagline"] },
];

for (const image of images) {
  const output = path.join(webRoot, "public", image.file);
  const result = spawnSync(
    electronPath,
    [
      path.join(webRoot, "scripts/og/renderOgImage.mjs"),
      iconPath,
      fontPath,
      image.lang,
      en["site.name"],
      image.tagline,
      output,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error(
      `rendering ${image.file} failed: ${result.error?.message ?? `exit code ${result.status}`}`,
    );
    process.exit(1);
  }
  console.log(`${image.file}: ${image.tagline}`);
}
