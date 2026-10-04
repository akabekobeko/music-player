import { expect, it } from "vitest";
import { renderSquarePhotoSvg } from "./renderSquarePhotoSvg.ts";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff]);

it("embeds the photograph as a data URI in a square document", () => {
  const svg = renderSquarePhotoSvg({ jpeg, size: 512, align: "middle" });

  expect(svg).toContain(
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">',
  );
  expect(svg).toContain(
    `href="data:image/jpeg;base64,${Buffer.from(jpeg).toString("base64")}"`,
  );
});

it("covers the square and keeps the middle by default alignment", () => {
  expect(renderSquarePhotoSvg({ jpeg, size: 512, align: "middle" })).toContain(
    'preserveAspectRatio="xMidYMid slice"',
  );
});

it("keeps the start or the end when asked", () => {
  expect(renderSquarePhotoSvg({ jpeg, size: 512, align: "start" })).toContain(
    'preserveAspectRatio="xMinYMin slice"',
  );
  expect(renderSquarePhotoSvg({ jpeg, size: 512, align: "end" })).toContain(
    'preserveAspectRatio="xMaxYMax slice"',
  );
});
