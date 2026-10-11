import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { processCapture } from "./mosaic.ts";
import { isScene, parseManifest } from "./screenshotManifest.ts";

/**
 * Pixelate and crop the raw screenshots into `src/assets/screenshots/`
 * (docs/specs/web/features/screenshots.md).
 *
 * Usage: `pnpm --filter parade-web screenshots:mask -- <input-dir>`
 *
 * Every `<scene>.png` in the input directory is processed; a file that is
 * not one of the spec's scenes is an error, as is a manifest scene without
 * a capture (its mask would otherwise be skipped unnoticed). Scenes listed
 * in `screenshots.manifest.json` get their `mask` regions pixelated and are
 * then cut to `crop`; the other scenes are re-encoded as they are. The raw
 * captures stay outside the repository; only the output is committed.
 */

const webRoot = path.join(import.meta.dirname, "..");
const manifestPath = path.join(webRoot, "screenshots.manifest.json");
const outputDir = path.join(webRoot, "src/assets/screenshots");

/** Output above this size is flagged so an oversized capture is noticed. */
const SIZE_LIMIT_BYTES = 1024 * 1024;

const main = async (): Promise<void> => {
  // pnpm passes the arguments after `--` through, including the `--`
  // itself on some versions.
  const argument = process.argv.slice(2).find((arg) => arg !== "--");
  if (argument === undefined) {
    throw new Error(
      "Usage: pnpm --filter parade-web screenshots:mask -- <input-dir>",
    );
  }
  // `pnpm --filter` runs the script in web/; INIT_CWD is where it was typed.
  const inputDir = path.resolve(
    process.env.INIT_CWD ?? process.cwd(),
    argument,
  );
  if (!(await stat(inputDir)).isDirectory()) {
    throw new Error(`${inputDir} is not a directory`);
  }
  const manifest = parseManifest(await readFile(manifestPath, "utf8"));
  const files = (await readdir(inputDir))
    .filter((name) => name.endsWith(".png"))
    .sort();
  if (files.length === 0) {
    throw new Error(`No .png files in ${inputDir}`);
  }
  const scenes = files.map((name) => name.slice(0, -".png".length));
  const unknown = scenes.filter((scene) => !isScene(scene));
  if (unknown.length > 0) {
    throw new Error(
      `Not a scene of docs/specs/web/features/screenshots.md: ${unknown.join(", ")}`,
    );
  }
  const missing = Object.keys(manifest).filter(
    (scene) => !scenes.includes(scene),
  );
  if (missing.length > 0) {
    throw new Error(
      `In the manifest but not in ${inputDir}: ${missing.join(", ")}`,
    );
  }
  await mkdir(outputDir, { recursive: true });

  for (const scene of scenes) {
    if (!isScene(scene)) continue;
    const name = `${scene}.png`;
    const result = await processCapture(
      await readFile(path.join(inputDir, name)),
      manifest[scene],
    );
    await writeFile(path.join(outputDir, name), result.png);
    const mb = (result.png.byteLength / SIZE_LIMIT_BYTES).toFixed(2);
    const flag = result.png.byteLength > SIZE_LIMIT_BYTES ? " (over 1 MB)" : "";
    console.log(
      `${scene}: ${result.width} x ${result.height}, ${mb} MB${flag}`,
    );
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
