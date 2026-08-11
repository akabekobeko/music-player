import path from "node:path";
import { app } from "electron";

/**
 * Artwork directory the importer writes SHA-256-named images into. The only
 * location `media-file://` is allowed to serve.
 *
 * @returns Absolute path of `userData/images`.
 */
export const imagesDirectory = (): string =>
  path.join(app.getPath("userData"), "images");
