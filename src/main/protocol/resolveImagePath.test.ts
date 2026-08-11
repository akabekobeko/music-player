import path from "node:path";
import { expect, it } from "vitest";
import { resolveImagePath } from "./resolveImagePath";

it("resolves a path inside the images directory", () => {
  const imagesDir = path.join("/data", "images");

  expect(resolveImagePath(path.join(imagesDir, "abc.jpg"), imagesDir)).toBe(
    path.join(imagesDir, "abc.jpg"),
  );
});

it("rejects a traversal escaping the images directory", () => {
  const imagesDir = path.join("/data", "images");

  expect(
    resolveImagePath(path.join(imagesDir, "..", "settings.json"), imagesDir),
  ).toBeNull();
  expect(resolveImagePath("/etc/passwd", imagesDir)).toBeNull();
});

it("rejects the images directory itself", () => {
  const imagesDir = path.join("/data", "images");

  expect(resolveImagePath(imagesDir, imagesDir)).toBeNull();
});

it("rejects a sibling directory sharing the prefix", () => {
  // "/data/images-evil" starts with "/data/images" as a string but is not
  // inside it — the separator-suffixed comparison must reject it.
  const imagesDir = path.join("/data", "images");

  expect(
    resolveImagePath(path.join("/data", "images-evil", "a.jpg"), imagesDir),
  ).toBeNull();
});
