import path from "node:path";
import { isPortInUse } from "./demo/isPortInUse.ts";
import { prepareDemoUserData } from "./demo/prepareDemoUserData/prepareDemoUserData.ts";
import { resolveDemoUserDataDir } from "./demo/resolveDemoUserDataDir.ts";

/** Port of the renderer dev server; the same as in scripts/dev.ts. */
const DEV_SERVER_PORT = 5173;

/**
 * Start the development environment on the demo data (`pnpm demo`).
 *
 * Recreates the demo userData directory from `docs/demo/assets`, then runs
 * the regular development flow with userData redirected to it. See
 * `docs/demo/README.md`.
 */
async function startDemo(): Promise<void> {
  const root = path.join(import.meta.dirname, "..");
  const demoDir = resolveDemoUserDataDir(root);

  // Checked before anything is deleted: when the port is taken the launch
  // would fail anyway, and if the holder is another demo run, recreating
  // the directory would pull the data out from under it.
  if (await isPortInUse(DEV_SERVER_PORT)) {
    throw new Error(
      `Port ${DEV_SERVER_PORT} is in use. Stop the running "pnpm dev" or "pnpm demo" first.`,
    );
  }

  prepareDemoUserData({
    assetsDir: path.join(root, "docs/demo/assets"),
    demoDir,
  });
  console.log(`Demo data prepared in ${demoDir}`);

  // scripts/dev.ts hands the environment to Electron, where the main
  // process reads this variable (src/main/main.ts).
  process.env.PARADE_USER_DATA_DIR = demoDir;
  await import("./dev.ts");
}

startDemo();
