import path from "node:path";
import { assertDevServerStopped } from "./demo/assertDevServerStopped.ts";
import {
  DEMO_ASSETS_VERSION,
  generateDemoAssets,
} from "./demo/assets/generateDemoAssets.ts";
import { prepareDemoUserData } from "./demo/prepareDemoUserData/prepareDemoUserData.ts";
import { resolveUserDataDir } from "./demo/resolveUserDataDir.ts";

/**
 * Start the development environment on the demo data (`pnpm demo`).
 *
 * Uses the demo userData directory of the current assets version,
 * generating it first when it does not exist, then runs the regular
 * development flow with userData redirected to it. See
 * `docs/demo/README.md`.
 */
async function startDemo(): Promise<void> {
  const root = path.join(import.meta.dirname, "..");

  await assertDevServerStopped();

  const { demoDir, generated } = await prepareDemoUserData({
    userDataDir: resolveUserDataDir(root),
    version: DEMO_ASSETS_VERSION,
    regenerate: false,
    // Launching must not change tracked files, so the credits stay as
    // they are.
    generate: (demoDir) =>
      generateDemoAssets({
        root,
        demoDir,
        force: false,
        updateCredits: false,
      }),
  });
  console.log(`Demo data ${generated ? "generated" : "found"} in ${demoDir}`);

  // scripts/dev.ts hands the environment to Electron, where the main
  // process reads this variable (src/main/main.ts).
  process.env.PARADE_USER_DATA_DIR = demoDir;
  await import("./dev.ts");
}

startDemo();
