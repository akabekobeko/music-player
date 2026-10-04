import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

/**
 * Names of the demo directories: `demo-<version>`, and the bare `demo` that
 * was used before the assets were versioned.
 */
const DEMO_DIR_PATTERN = /^demo(-\d+)?$/;

/**
 * Remove the demo directories of other versions.
 *
 * `userDataDir` is the app's regular data directory, so only entries named
 * like a demo directory are ever removed.
 *
 * @param userDataDir - The app's regular userData directory.
 * @param currentName - Name of the demo directory to keep.
 * @returns Names of the removed directories.
 */
export const removeStaleDemoDirs = (
  userDataDir: string,
  currentName: string,
): string[] => {
  if (!existsSync(userDataDir)) {
    return [];
  }

  const stale = readdirSync(userDataDir).filter(
    (name) => name !== currentName && DEMO_DIR_PATTERN.test(name),
  );
  for (const name of stale) {
    rmSync(path.join(userDataDir, name), { recursive: true, force: true });
  }

  return stale;
};
