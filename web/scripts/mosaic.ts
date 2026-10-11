import sharp from "sharp";
import {
  fitsInside,
  type Rect,
  type SceneManifest,
} from "./screenshotManifest.ts";

/** A decoded image: RGBA pixels and their dimensions. */
export type RawImage = {
  readonly data: Buffer;
  readonly width: number;
  readonly height: number;
};

const CHANNELS = 4 as const;

/**
 * Size of a mosaic block: each `MOSAIC_FACTOR` x `MOSAIC_FACTOR` square of
 * a masked region becomes one flat colour.
 */
export const MOSAIC_FACTOR = 16;

const rawOptions = (image: RawImage) => ({
  raw: { width: image.width, height: image.height, channels: CHANNELS },
});

/**
 * Dimensions of the reduced image a region is shrunk to before being scaled
 * back up with nearest-neighbour sampling. At least 1 x 1 so a region
 * narrower than one block still becomes a single flat colour.
 *
 * @param rect - The region.
 * @returns The reduced width and height.
 */
export const reducedSize = (rect: Rect): { width: number; height: number } => ({
  width: Math.max(1, Math.floor(rect.width / MOSAIC_FACTOR)),
  height: Math.max(1, Math.floor(rect.height / MOSAIC_FACTOR)),
});

/**
 * Render the mosaic of one region: the region is shrunk by the mosaic
 * factor (averaging its pixels) and scaled back with nearest-neighbour
 * sampling, so every block becomes one flat colour. A blur would keep
 * enough signal to be undone; this does not.
 *
 * @param image - The whole image.
 * @param rect - Region to pixelate, in pixels of `image`.
 * @returns The mosaic block, RGBA, of the region's size.
 */
const mosaicBlock = async (image: RawImage, rect: Rect): Promise<Buffer> => {
  if (!fitsInside(rect, image.width, image.height)) {
    throw new Error(
      `mask ${JSON.stringify(rect)} lies outside the ${image.width} x ${image.height} image`,
    );
  }
  const reduced = reducedSize(rect);
  // Two pipelines on purpose: sharp applies a single resize per pipeline,
  // so chaining the shrink and the enlarge would collapse into one.
  const shrunk = await sharp(image.data, rawOptions(image))
    .extract({
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
    })
    .resize(reduced.width, reduced.height, { fit: "fill" })
    .raw()
    .toBuffer();
  return sharp(shrunk, {
    raw: { width: reduced.width, height: reduced.height, channels: CHANNELS },
  })
    .resize(rect.width, rect.height, { fit: "fill", kernel: "nearest" })
    .raw()
    .toBuffer();
};

/**
 * Replace regions of the image with mosaics of themselves, in one composite
 * pass over the image.
 *
 * @param image - The whole image.
 * @param rects - Regions to pixelate, in pixels of `image`.
 * @returns The image with the regions replaced.
 */
export const pixelate = async (
  image: RawImage,
  rects: readonly Rect[],
): Promise<RawImage> => {
  if (rects.length === 0) {
    return image;
  }
  const blocks = await Promise.all(
    rects.map((rect) => mosaicBlock(image, rect)),
  );
  const data = await sharp(image.data, rawOptions(image))
    .composite(
      rects.map((rect, index) => ({
        input: blocks[index],
        raw: { width: rect.width, height: rect.height, channels: CHANNELS },
        left: rect.x,
        top: rect.y,
      })),
    )
    .raw()
    .toBuffer();
  return { data, width: image.width, height: image.height };
};

/**
 * Apply a scene's manifest entry to a capture: pixelate every `mask`
 * region, then cut out `crop`.
 *
 * @param png - The raw capture, PNG encoded.
 * @param manifest - The scene's entry, or `undefined` to only re-encode.
 * @returns The processed PNG and its dimensions.
 */
export const processCapture = async (
  png: Buffer,
  manifest: SceneManifest | undefined,
): Promise<{ png: Buffer; width: number; height: number }> => {
  // Force RGBA so the raw buffer always has four channels, whatever the
  // capture was saved as (a greyscale PNG would give two).
  const source = sharp(png).toColourspace("srgb").ensureAlpha();
  const { width, height } = await source.metadata();
  const image = await pixelate(
    { data: await source.raw().toBuffer(), width, height },
    manifest?.mask ?? [],
  );
  let output = sharp(image.data, rawOptions(image));
  let size = { width, height };
  const crop = manifest?.crop;
  if (crop !== undefined) {
    if (!fitsInside(crop, width, height)) {
      throw new Error(
        `crop ${JSON.stringify(crop)} lies outside the ${width} x ${height} image`,
      );
    }
    output = output.extract({
      left: crop.x,
      top: crop.y,
      width: crop.width,
      height: crop.height,
    });
    size = { width: crop.width, height: crop.height };
  }
  return {
    // No `effort` / `palette`: those quantise the colours, which is lossy.
    png: await output
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer(),
    ...size,
  };
};
