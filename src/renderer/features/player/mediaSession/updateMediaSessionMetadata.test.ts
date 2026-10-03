import type { Music } from "@mp/ipc";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ArtworkBlobUrlCache } from "./artworkBlobUrlCache";
import { updateMediaSessionMetadata } from "./updateMediaSessionMetadata";

/** Stand-in for the DOM class: keeps the init fields readable. */
class FakeMediaMetadata {
  readonly title: string;
  readonly artwork: readonly MediaImage[];

  constructor(init: MediaMetadataInit) {
    this.title = init.title ?? "";
    this.artwork = init.artwork ?? [];
  }
}

const session: { metadata: FakeMediaMetadata | null } = { metadata: null };

beforeEach(() => {
  session.metadata = null;
  vi.stubGlobal("navigator", { mediaSession: session });
  vi.stubGlobal("MediaMetadata", FakeMediaMetadata);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const music = (title: string, picturePath: string | null): Music =>
  ({ id: 1, title, artist: "Artist", album: "Album", picturePath }) as Music;

/** Cache over fake browser APIs; each fetch waits for its `respond()`. */
const fakeCache = () => {
  const responders: (() => void)[] = [];
  let created = 0;
  const revoked: string[] = [];
  const cache = new ArtworkBlobUrlCache({
    fetch: () =>
      new Promise((resolve) => {
        responders.push(() => {
          resolve(new Response("image-bytes"));
        });
      }),
    createObjectURL: () => {
      created += 1;
      return `blob:app/${created}`;
    },
    revokeObjectURL: (url) => {
      revoked.push(url);
    },
  });

  /** Answer the n-th fetch and let the resulting publish settle. */
  const respond = async (index: number): Promise<void> => {
    responders[index]?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  return { cache, respond, revoked };
};

const published = (): { title: string; src: string[] } | null =>
  session.metadata === null
    ? null
    : {
        title: session.metadata.title,
        src: session.metadata.artwork.map((image) => image.src),
      };

it("publishes the text at once and the artwork when it is loaded", async () => {
  const { cache, respond } = fakeCache();

  updateMediaSessionMetadata(music("A", "/images/a.jpg"), cache);
  expect(published()).toEqual({ title: "A", src: [] });

  await respond(0);
  expect(published()).toEqual({ title: "A", src: ["blob:app/1"] });
});

it("publishes no artwork for a track without a picture", async () => {
  const { cache, respond } = fakeCache();

  updateMediaSessionMetadata(music("A", null), cache);
  await respond(0);

  expect(published()).toEqual({ title: "A", src: [] });
});

it("reuses the loaded URL for the next track of the same album", async () => {
  const { cache, respond, revoked } = fakeCache();
  updateMediaSessionMetadata(music("A", "/images/a.jpg"), cache);
  await respond(0);

  updateMediaSessionMetadata(music("B", "/images/a.jpg"), cache);

  expect(published()).toEqual({ title: "B", src: ["blob:app/1"] });
  expect(revoked).toEqual([]);
});

it("drops the previous artwork when the track changes album", async () => {
  const { cache, respond, revoked } = fakeCache();
  updateMediaSessionMetadata(music("A", "/images/a.jpg"), cache);
  await respond(0);

  updateMediaSessionMetadata(music("B", "/images/b.jpg"), cache);
  expect(published()).toEqual({ title: "B", src: [] });

  await respond(1);
  expect(published()).toEqual({ title: "B", src: ["blob:app/2"] });
  expect(revoked).toEqual(["blob:app/1"]);
});

it("keeps the later track when an earlier artwork load finishes late", async () => {
  const { cache, respond, revoked } = fakeCache();
  updateMediaSessionMetadata(music("A", "/images/a.jpg"), cache);
  updateMediaSessionMetadata(music("B", "/images/b.jpg"), cache);

  // The first load was aborted: its late response becomes no Blob URL.
  await respond(0);
  expect(published()).toEqual({ title: "B", src: [] });

  await respond(1);
  expect(published()).toEqual({ title: "B", src: ["blob:app/1"] });
  expect(revoked).toEqual([]);
});

it("keeps the later track when both share an artwork still loading", async () => {
  const { cache, respond } = fakeCache();
  updateMediaSessionMetadata(music("A", "/images/a.jpg"), cache);
  updateMediaSessionMetadata(music("B", "/images/a.jpg"), cache);

  await respond(0);

  expect(published()).toEqual({ title: "B", src: ["blob:app/1"] });
});

it("clears the metadata and the artwork for null", async () => {
  const { cache, respond, revoked } = fakeCache();
  updateMediaSessionMetadata(music("A", "/images/a.jpg"), cache);
  await respond(0);

  updateMediaSessionMetadata(null, cache);

  expect(published()).toBeNull();
  await respond(1);
  expect(revoked).toEqual(["blob:app/1"]);
});

it("does nothing without MediaSession", () => {
  vi.stubGlobal("navigator", {});
  const { cache } = fakeCache();

  updateMediaSessionMetadata(music("A", "/images/a.jpg"), cache);

  expect(session.metadata).toBeNull();
});
