import fs from "node:fs";
import type { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
import { net } from "electron";
import { PROTOCOL_MEDIA_STREAM } from "../../shared/constants";
import { getDatabase } from "../db/connection";
import { audioContentType } from "./contentType";
import { fileStreamToWebStream } from "./fileStreamToWebStream";
import { isLibraryMusicPath } from "./isLibraryMusicPath";
import { parseByteRange } from "./parseByteRange";
import { urlToFilePath } from "./urlToFilePath";

/**
 * Handle a `media-stream://` request for an audio file.
 *
 * Serves only tracks registered in the `musics` table — any other path gets
 * `403` (`docs/specs/v1.0/architecture/process-model.md`). Chromium's media
 * stack always sends a `Range` header (`bytes=0-` on the first request, the
 * seek offset afterwards), and every such request gets a `206 Partial
 * Content` response streaming the requested slice with backpressure. A
 * request without `Range` is a plain fallback that returns the whole file
 * via `net.fetch`.
 *
 * @param request - Protocol request from the Renderer.
 * @param db - Library connection; defaults to the app-wide singleton
 *   (injectable for unit tests).
 * @returns The HTTP response.
 */
export const fetchMediaStream = async (
  request: Request,
  db: DatabaseSync = getDatabase(),
): Promise<Response> => {
  const filePath = urlToFilePath(request.url, PROTOCOL_MEDIA_STREAM);
  if (!isLibraryMusicPath(db, filePath)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response("File not found", { status: 404 });
  }

  const range = request.headers.get("Range");
  if (range === null) {
    const response = await net.fetch(pathToFileURL(filePath).href);
    // CORS-clean copy: the audio engine wires this response into a
    // MediaElementAudioSourceNode with `crossOrigin = "anonymous"`; without
    // Access-Control-Allow-Origin the node is tainted and outputs silence.
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  const { size } = fs.statSync(filePath);
  const byteRange = parseByteRange(range, size);
  if (byteRange === null) {
    return new Response("Range not satisfiable", { status: 416 });
  }

  const { start, end } = byteRange;
  const headers = new Headers([
    ["Accept-Ranges", "bytes"],
    ["Content-Type", audioContentType(filePath)],
    ["Content-Length", `${end - start + 1}`],
    ["Content-Range", `bytes ${start}-${end}/${size}`],
    // See above — required for an untainted MediaElementAudioSourceNode.
    ["Access-Control-Allow-Origin", "*"],
  ]);

  const stream = fs.createReadStream(filePath, { start, end });
  return new Response(fileStreamToWebStream(stream), {
    status: 206,
    headers,
  });
};
