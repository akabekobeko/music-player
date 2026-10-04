import path from "node:path";

/** Inputs of {@link resolveAppDataDir}. */
type Params = {
  /** Platform to resolve for (`process.platform`). */
  readonly platform: NodeJS.Platform;
  /**
   * Environment variables (`process.env`). `APPDATA` is read on Windows and
   * `XDG_CONFIG_HOME` on Linux.
   */
  readonly env: Readonly<Record<string, string | undefined>>;
  /** Home directory of the current user (`os.homedir()`). */
  readonly homeDir: string;
};

/**
 * Resolve the per-user application data root, the directory Electron
 * reports as `app.getPath("appData")`.
 *
 * The demo script prepares the data before Electron starts, so it cannot ask
 * Electron and mirrors its rule instead.
 *
 * @param params - Platform, environment and home directory.
 * @returns Absolute path of the application data root.
 */
export const resolveAppDataDir = ({
  platform,
  env,
  homeDir,
}: Params): string => {
  if (platform === "darwin") {
    return path.join(homeDir, "Library", "Application Support");
  }

  if (platform === "win32") {
    return env.APPDATA || path.join(homeDir, "AppData", "Roaming");
  }

  return env.XDG_CONFIG_HOME || path.join(homeDir, ".config");
};
