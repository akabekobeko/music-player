import path from "node:path";
import { assertDevServerStopped } from "./demo/assertDevServerStopped.ts";
import {
  DEMO_ASSETS_VERSION,
  generateDemoAssets,
} from "./demo/assets/generateDemoAssets.ts";
import { prepareDemoUserData } from "./demo/prepareDemoUserData/prepareDemoUserData.ts";
import { resolveUserDataDir } from "./demo/resolveUserDataDir.ts";

/**
 * Generate the demo assets again (`pnpm demo:assets`).
 *
 * Runs the generation on the demo userData directory of the current assets
 * version even when it exists, for checking a change of the seed data,
 * and updates `docs/demo/CREDITS.md`. Pass `--force` to recreate the
 * pictures, the covers and the track even when they exist. See
 * `docs/demo/README.md`.
 */
async function regenerateDemoAssets(): Promise<void> {
  const root = path.join(import.meta.dirname, "..");
  const force = process.argv.includes("--force");

  // The database of a running demo would be replaced under it.
  await assertDevServerStopped();

  const { demoDir } = await prepareDemoUserData({
    userDataDir: resolveUserDataDir(root),
    version: DEMO_ASSETS_VERSION,
    regenerate: true,
    generate: (demoDir) =>
      generateDemoAssets({ root, demoDir, force, updateCredits: true }),
  });
  console.log(`Demo data generated in ${demoDir}`);
}

regenerateDemoAssets();
