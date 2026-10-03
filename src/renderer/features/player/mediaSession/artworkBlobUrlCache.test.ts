import { expect, it, vi } from "vitest";
import {
  ArtworkBlobUrlCache,
  type ArtworkBlobUrlDeps,
} from "./artworkBlobUrlCache";

/** Fake browser APIs: Blob URLs are numbered in creation order. */
const fakeDeps = (patch: Partial<ArtworkBlobUrlDeps> = {}) => {
  let created = 0;
  return {
    fetch: vi.fn(
      async (_url: string, _signal: AbortSignal) => new Response("image-bytes"),
    ),
    createObjectURL: vi.fn((_blob: Blob) => {
      created += 1;
      return `blob:app/${created}`;
    }),
    revokeObjectURL: vi.fn((_url: string) => {}),
    ...patch,
  };
};

it("loads the artwork from its media-file URL as a Blob URL", async () => {
  const deps = fakeDeps();
  const cache = new ArtworkBlobUrlCache(deps);

  expect(await cache.load("/images/a b.jpg")).toBe("blob:app/1");
  expect(deps.fetch).toHaveBeenCalledWith(
    "media-file:///images/a%20b.jpg",
    expect.any(AbortSignal),
  );
  expect(deps.revokeObjectURL).not.toHaveBeenCalled();
});

it("peeks the URL only once it is loaded for the same artwork", async () => {
  const cache = new ArtworkBlobUrlCache(fakeDeps());

  const pending = cache.load("/images/a.jpg");
  expect(cache.peek("/images/a.jpg")).toBeNull();

  await pending;
  expect(cache.peek("/images/a.jpg")).toBe("blob:app/1");
  expect(cache.peek("/images/b.jpg")).toBeNull();
  expect(cache.peek(null)).toBeNull();
});

it("shares one load between tracks of the same artwork", async () => {
  const deps = fakeDeps();
  const cache = new ArtworkBlobUrlCache(deps);

  const first = cache.load("/images/a.jpg");
  const second = cache.load("/images/a.jpg");

  expect(await first).toBe("blob:app/1");
  expect(await second).toBe("blob:app/1");
  expect(await cache.load("/images/a.jpg")).toBe("blob:app/1");
  expect(deps.fetch).toHaveBeenCalledTimes(1);
  expect(deps.revokeObjectURL).not.toHaveBeenCalled();
});

it("revokes the previous URL when the artwork changes", async () => {
  const deps = fakeDeps();
  const cache = new ArtworkBlobUrlCache(deps);
  await cache.load("/images/a.jpg");

  expect(await cache.load("/images/b.jpg")).toBe("blob:app/2");
  expect(deps.revokeObjectURL).toHaveBeenCalledTimes(1);
  expect(deps.revokeObjectURL).toHaveBeenCalledWith("blob:app/1");
  expect(cache.peek("/images/a.jpg")).toBeNull();
});

it("revokes the URL when the next track has no artwork", async () => {
  const deps = fakeDeps();
  const cache = new ArtworkBlobUrlCache(deps);
  await cache.load("/images/a.jpg");

  expect(await cache.load(null)).toBeNull();
  expect(deps.revokeObjectURL).toHaveBeenCalledWith("blob:app/1");
  expect(deps.fetch).toHaveBeenCalledTimes(1);
});

it("aborts a load replaced before it finished and resolves it to null", async () => {
  // Like the real fetch: rejects once its signal is aborted.
  const fetch = vi.fn(
    (_url: string, signal: AbortSignal) =>
      new Promise<Response>((resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(signal.reason);
        });
        setTimeout(() => {
          resolve(new Response("image-bytes"));
        }, 0);
      }),
  );
  const deps = fakeDeps({ fetch });
  const cache = new ArtworkBlobUrlCache(deps);

  const replaced = cache.load("/images/a.jpg");
  const current = cache.load("/images/b.jpg");

  expect(await replaced).toBeNull();
  expect(await current).toBe("blob:app/1");
  expect(fetch.mock.calls[0]?.[1].aborted).toBe(true);
  expect(deps.createObjectURL).toHaveBeenCalledTimes(1);
  expect(deps.revokeObjectURL).not.toHaveBeenCalled();
  expect(cache.peek("/images/b.jpg")).toBe("blob:app/1");
});

it("creates no Blob URL for a response that arrives after the abort", async () => {
  // A fetch that ignores the signal: the entry is replaced while the
  // response is in flight, so its image must not become a Blob URL.
  const deps = fakeDeps();
  const cache = new ArtworkBlobUrlCache(deps);

  const replaced = cache.load("/images/a.jpg");
  const current = cache.load(null);

  expect(await replaced).toBeNull();
  expect(await current).toBeNull();
  expect(deps.createObjectURL).not.toHaveBeenCalled();
  expect(deps.revokeObjectURL).not.toHaveBeenCalled();
});

it("resolves to null without a Blob URL when the image is missing", async () => {
  const deps = fakeDeps({
    fetch: vi.fn(async () => new Response("File not found", { status: 404 })),
  });
  const cache = new ArtworkBlobUrlCache(deps);

  expect(await cache.load("/images/a.jpg")).toBeNull();
  expect(deps.createObjectURL).not.toHaveBeenCalled();
});

it("does not fetch a failed artwork again until the artwork changes", async () => {
  const fetch = vi
    .fn<ArtworkBlobUrlDeps["fetch"]>()
    .mockRejectedValueOnce(new Error("read failed"))
    .mockResolvedValue(new Response("image-bytes"));
  const deps = fakeDeps({ fetch });
  const cache = new ArtworkBlobUrlCache(deps);

  expect(await cache.load("/images/a.jpg")).toBeNull();
  expect(await cache.load("/images/a.jpg")).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);

  expect(await cache.load("/images/b.jpg")).toBe("blob:app/1");
  expect(deps.revokeObjectURL).not.toHaveBeenCalled();
});
