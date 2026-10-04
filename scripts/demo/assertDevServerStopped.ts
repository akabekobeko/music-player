import { isPortInUse } from "./isPortInUse.ts";

/** Port of the renderer dev server; the same as in scripts/dev.ts. */
const DEV_SERVER_PORT = 5173;

/**
 * Fail when the dev server port is taken.
 *
 * Called before the demo directory is touched: when the port is taken the
 * launch would fail anyway, and if the holder is a demo run, removing or
 * generating the directory would pull the data out from under it.
 *
 * @returns void.
 */
export const assertDevServerStopped = async (): Promise<void> => {
  if (await isPortInUse(DEV_SERVER_PORT)) {
    throw new Error(
      `Port ${DEV_SERVER_PORT} is in use. Stop the running "pnpm dev" or "pnpm demo" first.`,
    );
  }
};
