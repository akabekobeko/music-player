import { expect, it } from "vitest";
import type { DemoArtistSeed } from "../types.ts";
import { buildDemoLibrary } from "./buildDemoLibrary.ts";

const seedsWithPlayableGenre = (
  genre: DemoArtistSeed["genre"],
): DemoArtistSeed[] => [
  {
    name: "Playable Artist",
    genre,
    startYear: 2000,
    albumCount: 1,
    playable: { albumIndex: 0, albumTitle: "Album", trackTitle: "Track" },
  },
  { name: "Other Artist", genre: "Folk", startYear: 2005, albumCount: 2 },
];

it("opens My Best with the playable track", () => {
  const library = buildDemoLibrary(seedsWithPlayableGenre("Electronic"));

  expect(library.playlists[0]?.tracks[0]).toBe(library.playableTrack);
});

it("puts at most one track per artist into My Best", () => {
  const library = buildDemoLibrary(seedsWithPlayableGenre("Electronic"));
  const artists = library.playlists[0]?.tracks.map(
    (track) => track.albumArtist,
  );

  expect(new Set(artists).size).toBe(artists?.length);
});

it("sorts the playable genre's smart playlist by import date, newest first", () => {
  const [first] = buildDemoLibrary(
    seedsWithPlayableGenre("Electronic"),
  ).smartPlaylists;

  expect(first).toMatchObject({
    name: "Electronic",
    rules: { sort: { field: "addedAt", order: "desc" } },
  });
});

it("never creates two smart playlists for the same genre", () => {
  for (const genre of ["Jazz", "Rock"] as const) {
    const names = buildDemoLibrary(
      seedsWithPlayableGenre(genre),
    ).smartPlaylists.map((playlist) => playlist.name);

    expect(names[0]).toBe(genre);
    expect(new Set(names).size).toBe(names.length);
  }
});
