import { createReadStream, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { fileStreamToWebStream } from "./fileStreamToWebStream";

let tempDir: string | null = null;

afterEach(() => {
  if (tempDir !== null) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

const makeFile = (content: string): string => {
  tempDir = mkdtempSync(path.join(tmpdir(), "music-player-webstream-"));
  const filePath = path.join(tempDir, "data.bin");
  writeFileSync(filePath, content);
  return filePath;
};

it("streams the whole file content", async () => {
  const filePath = makeFile("hello web stream");

  const stream = fileStreamToWebStream(createReadStream(filePath));
  const text = await new Response(stream).text();

  expect(text).toBe("hello web stream");
});

it("streams a byte-bounded slice", async () => {
  const filePath = makeFile("0123456789");

  const stream = fileStreamToWebStream(
    createReadStream(filePath, { start: 3, end: 6 }),
  );
  const text = await new Response(stream).text();

  expect(text).toBe("3456");
});

it("propagates a read error to the consumer", async () => {
  const filePath = makeFile("x");
  rmSync(filePath);

  const stream = fileStreamToWebStream(createReadStream(filePath));

  await expect(new Response(stream).text()).rejects.toThrow();
});
