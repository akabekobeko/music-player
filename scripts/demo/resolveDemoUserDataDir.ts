import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEMO_DIR_NAME } from "./prepareDemoUserData/prepareDemoUserData.ts";
import { resolveAppDataDir } from "./resolveAppDataDir.ts";

/**
 * Resolve the demo userData directory: `demo` directly under the app's
 * regular data directory (`<appData>/<productName>/demo`).
 *
 * @param root - Project root directory, where package.json lives.
 * @returns Absolute path of the demo directory.
 */
export const resolveDemoUserDataDir = (root: string): string => {
  const pkg = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf-8"),
  ) as { name: string; productName?: string };

  return path.join(
    resolveAppDataDir({
      platform: process.platform,
      env: process.env,
      homeDir: os.homedir(),
    }),
    // Same rule as `__APP_PRODUCT_NAME__` in src/main/vite.config.ts.
    pkg.productName ?? pkg.name,
    DEMO_DIR_NAME,
  );
};
