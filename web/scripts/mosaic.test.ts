import sharp from "sharp";
import { expect, it } from "vitest";
import {
  MOSAIC_FACTOR,
  pixelate,
  processCapture,
  type RawImage,
  reducedSize,
} from "./mosaic";

/** A 64 x 32 image whose red channel rises with x and green with y. */
const gradient = (): RawImage => {
  const width = 64;
  const height = 32;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = x * 4;
      data[i + 1] = y * 8;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
};

const pixel = (image: RawImage, x: number, y: number): number[] => {
  const i = (y * image.width + x) * 4;
  return [...image.data.subarray(i, i + 4)];
};

it("flattens every mosaic block of the region to one colour", async () => {
  const image = gradient();
  const out = await pixelate(image, [{ x: 32, y: 0, width: 32, height: 32 }]);
  // The region is two 16 x 16 blocks wide and two high; each is uniform.
  for (const [bx, by] of [
    [32, 0],
    [48, 0],
    [32, 16],
    [48, 16],
  ] as const) {
    const first = pixel(out, bx, by);
    for (let y = by; y < by + 16; y++) {
      for (let x = bx; x < bx + 16; x++) {
        expect(pixel(out, x, y)).toEqual(first);
      }
    }
  }
  // Neighbouring blocks differ, so the mosaic still carries coarse colour.
  expect(pixel(out, 32, 0)).not.toEqual(pixel(out, 48, 0));
  expect(pixel(out, 32, 0)).not.toEqual(pixel(out, 32, 16));
});

it("leaves the pixels outside the region untouched", async () => {
  const image = gradient();
  const out = await pixelate(image, [{ x: 32, y: 0, width: 32, height: 32 }]);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < 32; x++) {
      expect(pixel(out, x, y)).toEqual(pixel(image, x, y));
    }
  }
});

it("pixelates several regions in one pass", async () => {
  const image = gradient();
  const out = await pixelate(image, [
    { x: 0, y: 0, width: 16, height: 16 },
    { x: 48, y: 16, width: 16, height: 16 },
  ]);
  expect(pixel(out, 0, 0)).toEqual(pixel(out, 15, 15));
  expect(pixel(out, 48, 16)).toEqual(pixel(out, 63, 31));
  expect(pixel(out, 16, 0)).toEqual(pixel(image, 16, 0));
});

it("rejects a region outside the image", async () => {
  await expect(
    pixelate(gradient(), [{ x: 40, y: 0, width: 32, height: 32 }]),
  ).rejects.toThrow(/outside/);
});

it("reduces a region by the mosaic factor, never below one pixel", () => {
  expect(reducedSize({ x: 0, y: 0, width: 160, height: 48 })).toEqual({
    width: 160 / MOSAIC_FACTOR,
    height: 48 / MOSAIC_FACTOR,
  });
  expect(reducedSize({ x: 0, y: 0, width: 8, height: 8 })).toEqual({
    width: 1,
    height: 1,
  });
});

it("accepts a greyscale capture", async () => {
  const png = await sharp(Buffer.alloc(32 * 32, 128), {
    raw: { width: 32, height: 32, channels: 1 },
  })
    .png()
    .toBuffer();
  const result = await processCapture(png, {
    mask: [{ x: 0, y: 0, width: 16, height: 16 }],
  });
  expect(result).toMatchObject({ width: 32, height: 32 });
  expect((await sharp(result.png).metadata()).channels).toBe(4);
});

it("masks and then crops a PNG capture", async () => {
  const image = gradient();
  const png = await sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .png()
    .toBuffer();
  const result = await processCapture(png, {
    mask: [{ x: 0, y: 0, width: 16, height: 16 }],
    crop: { x: 0, y: 0, width: 32, height: 16 },
  });
  expect(result).toMatchObject({ width: 32, height: 16 });
  const out: RawImage = {
    data: await sharp(result.png).raw().toBuffer(),
    width: 32,
    height: 16,
  };
  // Masked block is flat; the unmasked gradient next to it is not.
  expect(pixel(out, 0, 0)).toEqual(pixel(out, 15, 15));
  expect(pixel(out, 16, 0)).not.toEqual(pixel(out, 31, 15));
});

it("re-encodes a capture without a manifest entry as it is", async () => {
  const image = gradient();
  const png = await sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .png()
    .toBuffer();
  const result = await processCapture(png, undefined);
  expect(result).toMatchObject({ width: 64, height: 32 });
  expect(await sharp(result.png).raw().toBuffer()).toEqual(image.data);
});
