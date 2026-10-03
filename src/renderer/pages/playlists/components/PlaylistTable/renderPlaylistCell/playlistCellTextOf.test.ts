import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { playlistCellTextOf } from "./playlistCellTextOf";

const music = (patch: Partial<Music> = {}): Music => ({
  id: 1,
  filePath: "/m/1.flac",
  audioFormat: "flac",
  title: "Title",
  artist: "Artist",
  albumArtist: "Album Artist",
  album: "Album",
  disc: 1,
  track: 3,
  year: 1999,
  genre: "Rock",
  composer: "Composer",
  lyricist: "Lyricist",
  producer: "Producer",
  conductor: "Conductor",
  publisher: "Publisher",
  durationMs: 225_000,
  bpm: 120,
  rating: null,
  pictureId: null,
  picturePath: null,
  // No UTC designator: parsed as local time, so the date is the same in
  // every time zone the tests run in.
  addedAt: "2026-10-03T12:34:56",
  updatedAt: "",
  ...patch,
});

it("shows text tags as they are", () => {
  const row = music();
  expect(playlistCellTextOf("title", row, "en")).toBe("Title");
  expect(playlistCellTextOf("artist", row, "en")).toBe("Artist");
  expect(playlistCellTextOf("album", row, "en")).toBe("Album");
  expect(playlistCellTextOf("albumArtist", row, "en")).toBe("Album Artist");
  expect(playlistCellTextOf("genre", row, "en")).toBe("Rock");
  expect(playlistCellTextOf("composer", row, "en")).toBe("Composer");
  expect(playlistCellTextOf("lyricist", row, "en")).toBe("Lyricist");
  expect(playlistCellTextOf("producer", row, "en")).toBe("Producer");
  expect(playlistCellTextOf("conductor", row, "en")).toBe("Conductor");
  expect(playlistCellTextOf("publisher", row, "en")).toBe("Publisher");
  expect(playlistCellTextOf("audioFormat", row, "en")).toBe("flac");
});

it("leaves the cell of an unset text tag blank", () => {
  expect(playlistCellTextOf("artist", music({ artist: "" }), "en")).toBe("");
});

it("shows the year and the bpm, blank when unknown", () => {
  expect(playlistCellTextOf("year", music(), "en")).toBe("1999");
  expect(playlistCellTextOf("bpm", music(), "en")).toBe("120");
  expect(playlistCellTextOf("year", music({ year: null }), "en")).toBe("");
  expect(playlistCellTextOf("bpm", music({ bpm: null }), "en")).toBe("");
});

it("shows the track number, blank for an untagged track", () => {
  expect(playlistCellTextOf("track", music(), "en")).toBe("3");
  expect(playlistCellTextOf("track", music({ track: 0 }), "en")).toBe("");
});

it("always shows the disc number", () => {
  expect(playlistCellTextOf("disc", music(), "en")).toBe("1");
});

it("shows the added date without the time in the locale's style", () => {
  expect(playlistCellTextOf("addedAt", music(), "en")).toBe("Oct 3, 2026");
  expect(playlistCellTextOf("addedAt", music(), "ja")).toBe("2026/10/03");
});

it("shows the duration as m:ss, also when it could not be measured", () => {
  expect(playlistCellTextOf("duration", music(), "en")).toBe("3:45");
  expect(playlistCellTextOf("duration", music({ durationMs: 0 }), "en")).toBe(
    "0:00",
  );
});
