import path from "node:path";
import {
  DEMO_ASSETS_VERSION,
  generateDemoAssets,
} from "./demo/assets/generateDemoAssets.ts";
import { isPortInUse } from "./demo/isPortInUse.ts";
import { prepareDemoUserData } from "./demo/prepareDemoUserData/prepareDemoUserData.ts";
import { resolveUserDataDir } from "./demo/resolveUserDataDir.ts";

/** Port of the renderer dev server; the same as in scripts/dev.ts. */
const DEV_SERVER_PORT = 5173;

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

  // Checked before anything is deleted: when the port is taken the launch
  // would fail anyway, and if the holder is another demo run, removing or
  // generating the directory would pull the data out from under it.
  if (await isPortInUse(DEV_SERVER_PORT)) {
    throw new Error(
      `Port ${DEV_SERVER_PORT} is in use. Stop the running "pnpm dev" or "pnpm demo" first.`,
    );
  }

  const { demoDir, generated } = await prepareDemoUserData({
    userDataDir: resolveUserDataDir(root),
    version: DEMO_ASSETS_VERSION,
    regenerate: false,
    generate: (demoDir) => generateDemoAssets({ root, demoDir, force: false }),
  });
  console.log(`Demo data ${generated ? "generated" : "found"} in ${demoDir}`);

  // scripts/dev.ts hands the environment to Electron, where the main
  // process reads this variable (src/main/main.ts).
  process.env.PARADE_USER_DATA_DIR = demoDir;
  await import("./dev.ts");
}

startDemo();
