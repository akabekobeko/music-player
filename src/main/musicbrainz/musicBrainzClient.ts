import { app } from "electron";
import { buildUserAgent } from "./buildUserAgent";
import {
  DEFAULT_CLIENT_DEPS,
  MusicBrainzClient,
} from "./MusicBrainzClient/MusicBrainzClient";

/**
 * The app-wide client instance. One instance is what makes the rate limit
 * hold across every caller (`docs/specs/v1.2/architecture/rate-limit.md`);
 * IPC handlers must go through this and never construct their own.
 *
 * In development every completed request is logged (status and URL) so
 * the one-per-second spacing can be checked in the console; a packaged
 * build stays silent.
 */
export const musicBrainzClient = new MusicBrainzClient(
  buildUserAgent(app.getVersion()),
  app.isPackaged
    ? DEFAULT_CLIENT_DEPS
    : { ...DEFAULT_CLIENT_DEPS, log: (line) => console.info(line) },
);
