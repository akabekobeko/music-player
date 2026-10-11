import { z } from "zod";

/**
 * The scenes the top page uses, in the order of
 * docs/specs/web/features/screenshots.md. Captures with other names are
 * refused so a stray file never lands in the committed assets.
 */
export const SCENES = [
  "artists",
  "artists-light",
  "albums",
  "playlists",
  "music-info",
  "player",
  "settings",
] as const;

export type Scene = (typeof SCENES)[number];

export const isScene = (name: string): name is Scene =>
  (SCENES as readonly string[]).includes(name);

/** A rectangle in pixels of the captured (2x) image. */
const rectSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/**
 * Per-scene processing recorded in `web/screenshots.manifest.json`
 * (docs/specs/web/features/screenshots.md). `mask` regions are pixelated
 * first, in the coordinates of the full capture; `crop` is then cut out of
 * the masked image. Unknown keys are rejected so a typo cannot silently
 * skip a mask.
 */
const sceneSchema = z
  .object({
    mask: z.array(rectSchema).optional(),
    crop: rectSchema.optional(),
  })
  .strict();

export const manifestSchema = z.partialRecord(z.enum(SCENES), sceneSchema);

export type Rect = z.infer<typeof rectSchema>;
export type SceneManifest = z.infer<typeof sceneSchema>;
export type ScreenshotManifest = z.infer<typeof manifestSchema>;

/**
 * Parse the manifest JSON, rejecting anything that is not a map of scene
 * name to mask / crop rectangles.
 *
 * @param json - Contents of `screenshots.manifest.json`.
 * @returns The manifest.
 */
export const parseManifest = (json: string): ScreenshotManifest =>
  manifestSchema.parse(JSON.parse(json));

/**
 * Check that a rectangle lies inside an image of the given size.
 *
 * @param rect - The rectangle.
 * @param width - Image width.
 * @param height - Image height.
 * @returns Whether the rectangle fits.
 */
export const fitsInside = (
  rect: Rect,
  width: number,
  height: number,
): boolean => rect.x + rect.width <= width && rect.y + rect.height <= height;
