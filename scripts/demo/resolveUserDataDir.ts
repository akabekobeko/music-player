import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveAppDataDir } from "./resolveAppDataDir.ts";

/**
 * Resolve the app's regular userData directory
 * (`<appData>/<productName>`); the demo directory is created directly
 * under it.
 *
 * @param root - Project root directory, where package.json lives.
 * @returns Absolute path of the userData directory.
 */
export const resolveUserDataDir = (root: string): string => {
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
  );
};
