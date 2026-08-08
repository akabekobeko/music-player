import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, net } from "electron";
import { PROTOCOL_MEDIA_FILE } from "../../shared/constants";
import { resolveImagePath } from "./pathValidation";
import { urlToFilePath } from "./urlToFilePath";

/**
 * Artwork directory the importer writes SHA-256-named images into. The only
 * location `media-file://` is allowed to serve.
 *
 * @returns Absolute path of `userData/images`.
 */
export const imagesDirectory = (): string =>
  path.join(app.getPath("userData"), "images");

/**
 * Handle a `media-file://` request for an artwork image.
 *
 * Serves only paths that resolve inside {@link imagesDirectory} — traversal
 * attempts and everything else get `403`
 * (`docs/specs/v1.0/architecture/process-model.md`). Delivery goes through
 * `net.fetch(file://…)`, which fills in the image `Content-Type`.
 *
 * @param request - Protocol request from the Renderer.
 * @param imagesDir - Allowed directory; defaults to {@link imagesDirectory}
 *   (injectable for unit tests).
 * @returns The HTTP response.
 */
export const fetchMediaFile = async (
  request: Request,
  imagesDir: string = imagesDirectory(),
): Promise<Response> => {
  const filePath = urlToFilePath(request.url, PROTOCOL_MEDIA_FILE);
  const resolved = resolveImagePath(filePath, imagesDir);
  if (resolved === null) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return new Response("File not found", { status: 404 });
  }

  return await net.fetch(pathToFileURL(resolved).href);
};
