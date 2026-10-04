import path from "node:path";

/** Inputs of {@link resolveUnpackagedUserDataPath}. */
type Params = {
  /** Electron's per-user application data root (`app.getPath("appData")`). */
  readonly appData: string;
  /** `productName` from package.json; names the shared data directory. */
  readonly productName: string;
  /**
   * Value of the `PARADE_USER_DATA_DIR` environment variable. Unset or empty
   * means no override. `pnpm demo` sets it to the demo data directory
   * (`docs/demo/README.md`).
   */
  readonly override: string | undefined;
};

/**
 * Resolve the userData directory of an unpackaged run.
 *
 * Without an override this is the directory electron-builder derives from
 * `productName`, so development and the packaged app share one library. An
 * override redirects the whole run to another directory, which isolates it
 * from the regular data.
 *
 * @param params - Paths and the optional override.
 * @returns Absolute path to use as userData.
 */
export const resolveUnpackagedUserDataPath = ({
  appData,
  productName,
  override,
}: Params): string =>
  override !== undefined && override !== ""
    ? path.resolve(override)
    : path.join(appData, productName);
