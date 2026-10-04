import { expect, it } from "vitest";
import { buildDemoLibrary } from "./buildDemoLibrary.ts";

const library = buildDemoLibrary();
const albums = library.artists.flatMap((artist) => artist.albums);
const tracks = albums.flatMap((album) => album.tracks);

/** Initial the Artist view files a name under, as `initialOf` decides. */
const initialOf = (name: string): string => {
  const first = name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .charAt(0);
  return /^[a-z]$/.test(first) ? first.toUpperCase() : "#";
};

it("is deterministic", () => {
  expect(buildDemoLibrary()).toEqual(library);
});

it("covers every initial from A to Z and the other section", () => {
  const initials = new Set(
    library.artists.map((artist) => initialOf(artist.name)),
  );

  expect([...initials].sort().join("")).toBe("#ABCDEFGHIJKLMNOPQRSTUVWXYZ");
});

it("spreads the artists unevenly over the initials", () => {
  const counts = new Map<string, number>();
  for (const artist of library.artists) {
    const initial = initialOf(artist.name);
    counts.set(initial, (counts.get(initial) ?? 0) + 1);
  }

  expect(counts.get("A")).toBeGreaterThanOrEqual(5);
  expect(counts.get("B")).toBeGreaterThanOrEqual(5);
  expect(counts.get("Q")).toBe(1);
  expect(counts.get("X")).toBe(1);
});

it("mixes names with a leading The, all capitals and all lower case", () => {
  const names = library.artists.map((artist) => artist.name);

  expect(
    names.filter((name) => name.startsWith("The ")).length,
  ).toBeGreaterThan(5);
  expect(
    names.filter((name) => /[A-Z]/.test(name) && name === name.toUpperCase())
      .length,
  ).toBeGreaterThan(5);
  expect(
    names.filter((name) => /[a-z]/.test(name) && name === name.toLowerCase())
      .length,
  ).toBeGreaterThan(5);
});

it("credits only artists of the given seeds as guests", () => {
  const custom = buildDemoLibrary([
    {
      name: "First Artist",
      genre: "Hip Hop",
      startYear: 2000,
      albumCount: 5,
      playable: { albumIndex: 0, albumTitle: "Album", trackTitle: "Track" },
    },
    { name: "Second Artist", genre: "Hip Hop", startYear: 2001, albumCount: 5 },
  ]);
  const names = new Set(
    custom.artists.flatMap((artist) =>
      artist.albums.flatMap((album) =>
        album.tracks.map((track) => track.artist),
      ),
    ),
  );

  expect([...names].sort()).toEqual([
    "First Artist",
    "First Artist feat. Second Artist",
    "Second Artist",
    "Second Artist feat. First Artist",
  ]);
});

it("credits no guest when the library has a single artist", () => {
  const custom = buildDemoLibrary([
    {
      name: "Only Artist",
      genre: "Hip Hop",
      startYear: 2000,
      albumCount: 5,
      playable: { albumIndex: 0, albumTitle: "Album", trackTitle: "Track" },
    },
  ]);
  const tracks = custom.artists.flatMap((artist) =>
    artist.albums.flatMap((album) => album.tracks),
  );

  expect(tracks.every((track) => track.artist === "Only Artist")).toBe(true);
});

it("names a cover after its title so a renamed album gets a new file", () => {
  const coverOf = (albumTitle: string) =>
    buildDemoLibrary([
      {
        name: "山田太郎",
        slug: "yamada-taro",
        genre: "Pop",
        startYear: 2000,
        albumCount: 1,
        playable: { albumIndex: 0, albumTitle, trackTitle: "Track" },
      },
    ]).artists[0]?.albums[0]?.coverPath;

  expect(coverOf("四季")).toMatch(
    /^images\/albums\/yamada-taro--album-1-[0-9a-f]{8}\.jpg$/,
  );
  expect(coverOf("四季")).toBe(coverOf("四季"));
  expect(coverOf("四季")).not.toBe(coverOf("日々のうた"));
});

it("gives every artist between 1 and 15 albums, with one at 15", () => {
  const counts = library.artists.map((artist) => artist.albums.length);

  expect(Math.min(...counts)).toBe(1);
  expect(Math.max(...counts)).toBe(15);
});

it("keeps album titles unique within an artist", () => {
  for (const artist of library.artists) {
    const titles = artist.albums.map((album) => album.title);
    expect(new Set(titles).size).toBe(titles.length);
  }
});

it("keeps file and image paths unique", () => {
  expect(new Set(tracks.map((track) => track.filePath)).size).toBe(
    tracks.length,
  );
  expect(new Set(albums.map((album) => album.coverPath)).size).toBe(
    albums.length,
  );
  expect(
    new Set(library.artists.map((artist) => artist.picturePath)).size,
  ).toBe(library.artists.length);
});

it("spreads the albums over several decades and genres", () => {
  const decades = new Set(
    albums.map((album) =>
      album.year === null ? null : Math.floor(album.year / 10),
    ),
  );
  const genres = new Set(albums.map((album) => album.genre));

  expect(decades.size).toBeGreaterThanOrEqual(7);
  expect(decades.has(null)).toBe(true);
  expect(genres.size).toBe(10);
});

it("defines exactly one playable track, by an artist filed under M", () => {
  const playable = tracks.filter((track) => track.playable);

  expect(playable).toEqual([library.playableTrack]);
  expect(library.playableTrack).toMatchObject({
    filePath: "musics/Milo Ashgrove/Modulations/01 Test Tone Serenade.m4a",
    audioFormat: "m4a",
    title: "Test Tone Serenade",
    artist: "Milo Ashgrove",
    album: "Modulations",
    genre: "Electronic",
    durationMs: 107_000,
  });
});

it("builds My Best with about 20 tracks including the playable one", () => {
  const [myBest] = library.playlists;

  expect(library.playlists).toHaveLength(1);
  expect(myBest?.name).toBe("My Best");
  expect(myBest?.tracks).toHaveLength(20);
  expect(myBest?.tracks[0]).toBe(library.playableTrack);
});

it("names the smart playlists after genres, one matching the playable track", () => {
  expect(library.smartPlaylists.map((playlist) => playlist.name)).toEqual([
    "Electronic",
    "Jazz",
    "Rock",
  ]);
});

it("adds the playable album last so date sorting lists it first", () => {
  const latest = tracks.reduce((a, b) => (a.addedAt >= b.addedAt ? a : b));

  expect(latest.album).toBe(library.playableTrack.album);
});
