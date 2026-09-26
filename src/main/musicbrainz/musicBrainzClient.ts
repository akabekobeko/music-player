import { app } from "electron";
import { buildUserAgent } from "./buildUserAgent";
import { MusicBrainzClient } from "./MusicBrainzClient/MusicBrainzClient";

/**
 * The app-wide client instance. One instance is what makes the rate limit
 * hold across every caller (`docs/specs/v1.2/architecture/rate-limit.md`);
 * IPC handlers must go through this and never construct their own.
 */
export const musicBrainzClient = new MusicBrainzClient(
  buildUserAgent(app.getVersion()),
);
