import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { rewriteDemoDatabasePaths } from "./rewriteDemoDatabasePaths.ts";

/** Directory name of the demo data; removal is refused for any other name. */
export const DEMO_DIR_NAME = "demo";

/** Inputs of {@link prepareDemoUserData}. */
type Params = {
  /** Source directory of the committed demo data (`docs/demo/assets`). */
  readonly assetsDir: string;
  /**
   * Destination directory used as userData while the demo runs. Its base
   * name must be {@link DEMO_DIR_NAME}.
   */
  readonly demoDir: string;
};

/**
 * Recreate the demo userData directory from the committed assets.
 *
 * An existing directory is removed first so every launch starts from the
 * latest assets, whatever an earlier run changed and whatever structure an
 * older version left behind. The database paths are then rewritten to point
 * into the new directory.
 *
 * @param params - Source and destination directories.
 * @returns void.
 */
export const prepareDemoUserData = ({ assetsDir, demoDir }: Params): void => {
  // The directory is deleted recursively, so never accept a path that is
  // not the dedicated demo directory.
  if (path.basename(demoDir) !== DEMO_DIR_NAME) {
    throw new Error(`Refusing to recreate a non-demo directory: ${demoDir}`);
  }

  if (!existsSync(path.join(assetsDir, "app.db"))) {
    throw new Error(`Demo assets are missing: ${assetsDir}`);
  }

  rmSync(demoDir, { recursive: true, force: true });
  cpSync(assetsDir, demoDir, {
    recursive: true,
    // Skip OS metadata such as .DS_Store.
    filter: (source) => !path.basename(source).startsWith("."),
  });
  rewriteDemoDatabasePaths(path.join(demoDir, "app.db"), demoDir);
};
