import { expect, it } from "vitest";
import { toDataUrl } from "./toDataUrl";

it("encodes the bytes as a base64 data URL with the MIME type", () => {
  expect(
    toDataUrl({ mimeType: "image/png", data: new Uint8Array([72, 105, 33]) }),
  ).toBe("data:image/png;base64,SGkh");
});

it("handles data larger than one encoding chunk", () => {
  const data = new Uint8Array(0x8000 + 3).fill(65);
  const url = toDataUrl({ mimeType: "image/jpeg", data });

  expect(url.startsWith("data:image/jpeg;base64,")).toBe(true);
  expect(atob(url.slice("data:image/jpeg;base64,".length))).toHaveLength(
    0x8000 + 3,
  );
});
