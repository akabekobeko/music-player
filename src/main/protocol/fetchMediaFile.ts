import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { net } from "electron";
import { PROTOCOL_MEDIA_FILE } from "../../shared/constants";
import { imagesDirectory } from "./imagesDirectory";
import { resolveImagePath } from "./resolveImagePath";
import { urlToFilePath } from "./urlToFilePath";
import { withCorsHeader } from "./withCorsHeader";

/**
 * Handle a `media-file://` request for an artwork image.
 *
 * Serves only paths that resolve inside
 * {@link import("./imagesDirectory").imagesDirectory} — traversal attempts
 * and everything else get `403`
 * (`docs/specs/v1.0/architecture/process-model.md`). Delivery goes through
 * `net.fetch(file://…)`, which fills in the image `Content-Type`.
 *
 * Every response, errors included, carries `Access-Control-Allow-Origin` so
 * the Renderer can read it with `fetch` (MediaSession artwork as a Blob
 * URL): the scheme is cross-origin to the app, an opaque response has no
 * readable body, and an error without the header would surface as a CORS
 * failure instead of its status.
 *
 * @param request - Protocol request from the Renderer.
 * @param imagesDir - Allowed directory; defaults to
 *   {@link import("./imagesDirectory").imagesDirectory} (injectable for unit
 *   tests).
 * @returns The HTTP response.
 */
export const fetchMediaFile = async (
  request: Request,
  imagesDir: string = imagesDirectory(),
): Promise<Response> => {
  const filePath = urlToFilePath(request.url, PROTOCOL_MEDIA_FILE);
  const resolved = resolveImagePath(filePath, imagesDir);
  if (resolved === null) {
    return withCorsHeader(new Response("Forbidden", { status: 403 }));
  }

  if (!fs.existsSync(resolved)) {
    return withCorsHeader(new Response("File not found", { status: 404 }));
  }

  return withCorsHeader(await net.fetch(pathToFileURL(resolved).href));
};
