import { expect, it } from "vitest";
import type { UpdateMusicsRequest } from "../types";
import { validateUpdateMusicsRequest } from "./validateUpdateMusicsRequest";

const png = { mimeType: "image/png", data: new Uint8Array([1, 2, 3]) };

it("accepts a tag-only change", () => {
  expect(
    validateUpdateMusicsRequest({ musicIds: [1, 2], patch: { title: "T" } }),
  ).toBeNull();
});

it("accepts an artwork-only change and an artwork removal", () => {
  expect(
    validateUpdateMusicsRequest({ musicIds: [1], patch: {}, picture: png }),
  ).toBeNull();
  expect(
    validateUpdateMusicsRequest({ musicIds: [1], patch: {}, picture: null }),
  ).toBeNull();
});

it("rejects a missing request", () => {
  expect(validateUpdateMusicsRequest(undefined)?.code).toBe("INVALID_REQUEST");
});

it("rejects an empty id list", () => {
  expect(
    validateUpdateMusicsRequest({ musicIds: [], patch: { title: "T" } })
      ?.message,
  ).toMatch(/at least one/i);
});

it("rejects non-integer ids", () => {
  expect(
    validateUpdateMusicsRequest({
      musicIds: [1.5],
      patch: { title: "T" },
    })?.message,
  ).toMatch(/integers/);
});

it("rejects duplicated ids", () => {
  expect(
    validateUpdateMusicsRequest({ musicIds: [1, 1], patch: { title: "T" } })
      ?.message,
  ).toMatch(/repeat/);
});

it("rejects a request that changes nothing", () => {
  expect(
    validateUpdateMusicsRequest({ musicIds: [1], patch: {} })?.message,
  ).toMatch(/changes nothing/);
});

it("rejects a missing patch", () => {
  expect(
    validateUpdateMusicsRequest({
      musicIds: [1],
    } as unknown as UpdateMusicsRequest)?.message,
  ).toMatch(/patch/);
});

it("rejects an unsupported image type", () => {
  expect(
    validateUpdateMusicsRequest({
      musicIds: [1],
      patch: {},
      picture: { mimeType: "image/tiff", data: new Uint8Array([1]) },
    })?.message,
  ).toMatch(/Unsupported image type/);
});

it("rejects an empty image", () => {
  expect(
    validateUpdateMusicsRequest({
      musicIds: [1],
      patch: {},
      picture: { mimeType: "image/png", data: new Uint8Array() },
    })?.message,
  ).toMatch(/empty/);
});
