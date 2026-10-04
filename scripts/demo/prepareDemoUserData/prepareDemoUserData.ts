import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { removeStaleDemoDirs } from "./removeStaleDemoDirs.ts";

/**
 * File that marks a demo directory as completely generated. A directory
 * without it is left over from an interrupted generation.
 */
const READY_MARKER = ".demo-ready";

/** Inputs of {@link prepareDemoUserData}. */
type Params = {
  /** The app's regular userData directory (`<appData>/<productName>`). */
  readonly userDataDir: string;
  /** Version of the demo assets (`DEMO_ASSETS_VERSION`). */
  readonly version: number;
  /** Whether to run the generation even when the directory is ready. */
  readonly regenerate: boolean;
  /** Generates the demo assets into the given demo directory. */
  readonly generate: (demoDir: string) => Promise<void>;
};

/** Result of {@link prepareDemoUserData}. */
type Result = {
  /** Demo directory to use as userData (`<userDataDir>/demo-<version>`). */
  readonly demoDir: string;
  /** Whether the assets were generated in this call. */
  readonly generated: boolean;
};

/**
 * Prepare the demo userData directory of the given assets version.
 *
 * The demo directories of other versions are removed. A directory of the
 * current version that was generated completely is used as it is, with
 * whatever earlier demo runs changed in it; otherwise the assets are
 * generated. A generation that fails leaves the directory unmarked, so the
 * next call runs it again.
 *
 * @param params - See {@link Params}.
 * @returns The demo directory and whether it was generated.
 */
export const prepareDemoUserData = async ({
  userDataDir,
  version,
  regenerate,
  generate,
}: Params): Promise<Result> => {
  const name = `demo-${version}`;
  const demoDir = path.join(userDataDir, name);
  const markerPath = path.join(demoDir, READY_MARKER);
  removeStaleDemoDirs(userDataDir, name);

  if (!regenerate && existsSync(markerPath)) {
    return { demoDir, generated: false };
  }

  rmSync(markerPath, { force: true });
  mkdirSync(demoDir, { recursive: true });
  await generate(demoDir);
  writeFileSync(markerPath, "");
  return { demoDir, generated: true };
};
