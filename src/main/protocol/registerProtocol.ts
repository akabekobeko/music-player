import { protocol } from "electron";
import {
  PROTOCOL_MEDIA_FILE,
  PROTOCOL_MEDIA_STREAM,
} from "../../shared/constants";
import { fetchMediaFile } from "./fetchMediaFile";
import { fetchMediaStream } from "./fetchMediaStream";

// Privileged registration must happen before the app's `ready` event, so it
// runs as a module side effect when Main imports this file.
//
// `supportFetchAPI` on media-stream is required: the audio engine uses the
// same URL for both `<audio src>` (streaming) and `fetch()` (full read for
// buffer playback). `corsEnabled` is equally required: the engine loads the
// element with `crossOrigin = "anonymous"` so the
// MediaElementAudioSourceNode stays untainted (audible), and a CORS-mode
// request to a scheme without this privilege fails outright
// (MEDIA_ELEMENT_ERROR: Format error) —
// docs/specs/v1.0/architecture/process-model.md.
protocol.registerSchemesAsPrivileged([
  {
    scheme: PROTOCOL_MEDIA_FILE,
    privileges: { bypassCSP: true },
  },
  {
    scheme: PROTOCOL_MEDIA_STREAM,
    privileges: {
      bypassCSP: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

/**
 * Wire both media protocols up to their handlers.
 *
 * Call during `whenReady`, after the database is open — `media-stream://`
 * validates every request against the `musics` table.
 *
 * @returns void.
 */
export const registerProtocolHandlers = (): void => {
  protocol.handle(PROTOCOL_MEDIA_FILE, (request) => fetchMediaFile(request));
  protocol.handle(PROTOCOL_MEDIA_STREAM, (request) =>
    fetchMediaStream(request),
  );
};
