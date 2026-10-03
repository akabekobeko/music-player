import { expect, it } from "vitest";
import { sanitizePlaylistColumns } from "./sanitizePlaylistColumns";

it("keeps a well-formed layout", () => {
  expect(
    sanitizePlaylistColumns({
      visibleIds: ["artist", "year"],
      widths: { title: 320, artist: 180 },
    }),
  ).toEqual({
    visibleIds: ["artist", "year"],
    widths: { title: 320, artist: 180 },
  });
});

it("keeps an empty layout (every optional column hidden)", () => {
  expect(sanitizePlaylistColumns({ visibleIds: [], widths: {} })).toEqual({
    visibleIds: [],
    widths: {},
  });
});

it("returns undefined for non-object input", () => {
  expect(sanitizePlaylistColumns(undefined)).toBeUndefined();
  expect(sanitizePlaylistColumns(null)).toBeUndefined();
  expect(sanitizePlaylistColumns("artist")).toBeUndefined();
  expect(sanitizePlaylistColumns(42)).toBeUndefined();
});

it("returns undefined when visibleIds is not an array", () => {
  expect(sanitizePlaylistColumns({ widths: { title: 320 } })).toBeUndefined();
  expect(
    sanitizePlaylistColumns({ visibleIds: "artist", widths: { title: 320 } }),
  ).toBeUndefined();
  expect(
    sanitizePlaylistColumns({ visibleIds: { 0: "artist" }, widths: {} }),
  ).toBeUndefined();
  expect(sanitizePlaylistColumns(["artist"])).toBeUndefined();
});

it("drops duplicate and non-string visibleIds, keeping the first order", () => {
  expect(
    sanitizePlaylistColumns({
      visibleIds: ["year", "artist", 1, null, "year", ["album"], "artist"],
      widths: {},
    })?.visibleIds,
  ).toEqual(["year", "artist"]);
});

it("keeps unknown column ids (the Renderer drops them)", () => {
  expect(
    sanitizePlaylistColumns({ visibleIds: ["lyrics"], widths: { lyrics: 90 } }),
  ).toEqual({ visibleIds: ["lyrics"], widths: { lyrics: 90 } });
});

it("rounds widths to integers", () => {
  expect(
    sanitizePlaylistColumns({
      visibleIds: [],
      widths: { title: 320.4, artist: 180.5, album: 0.5 },
    })?.widths,
  ).toEqual({ title: 320, artist: 181, album: 1 });
});

it("drops widths that are not finite numbers of 1 or more", () => {
  expect(
    sanitizePlaylistColumns({
      visibleIds: [],
      widths: {
        title: 0.4,
        artist: 0,
        album: -120,
        genre: Number.NaN,
        year: Number.POSITIVE_INFINITY,
        track: "72",
        disc: null,
        composer: { px: 160 },
        duration: 72,
      },
    })?.widths,
  ).toEqual({ duration: 72 });
});

it("empties widths that are not a key-value object, keeping visibleIds", () => {
  for (const widths of [undefined, null, "wide", 320, [320, 180], true]) {
    expect(sanitizePlaylistColumns({ visibleIds: ["artist"], widths })).toEqual(
      { visibleIds: ["artist"], widths: {} },
    );
  }
});

it("never lets a crafted widths key reach a prototype", () => {
  const columns = sanitizePlaylistColumns(
    JSON.parse(
      '{"visibleIds":[],"widths":{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}},"title":320}}',
    ),
  );
  expect(columns?.widths).toEqual({ title: 320 });
  expect(Object.getPrototypeOf(columns?.widths)).toBe(Object.prototype);
  expect(({} as { polluted?: number }).polluted).toBeUndefined();
});

it("drops a numeric __proto__ width and ignores inherited widths", () => {
  const own = sanitizePlaylistColumns(
    JSON.parse('{"visibleIds":[],"widths":{"__proto__":300,"title":320}}'),
  );
  expect(Object.keys(own?.widths ?? {})).toEqual(["title"]);

  const inherited = sanitizePlaylistColumns({
    visibleIds: [],
    widths: Object.create({ artist: 180 }),
  });
  expect(inherited?.widths).toEqual({});
});

it("drops unknown keys of the layout itself", () => {
  expect(
    sanitizePlaylistColumns({ visibleIds: [], widths: {}, order: ["title"] }),
  ).toEqual({ visibleIds: [], widths: {} });
});
