import { expect, it } from "vitest";
import type { Music, MusicInfoCandidate } from "../ipc/types";
import { missingPatchOf } from "./missingPatchOf";

const music = (overrides: Partial<Music> = {}): Music => ({
  id: 1,
  filePath: "/music/a.mp3",
  audioFormat: "mp3",
  title: "Title",
  artist: "",
  albumArtist: "",
  album: "Album",
  disc: 1,
  track: 0,
  year: null,
  genre: "Rock",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: null,
  rating: null,
  pictureId: null,
  picturePath: null,
  addedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const picture = { mimeType: "image/jpeg", data: new Uint8Array([1]) };

const candidate = (
  tags: Partial<MusicInfoCandidate["tags"]> = {},
  withPicture = true,
): MusicInfoCandidate => ({
  recordingId: "r",
  releaseId: "rel",
  score: 100,
  tags: {
    title: "Other Title",
    artist: " Artist ",
    albumArtist: "Album Artist",
    album: "Other Album",
    genre: "Metal",
    year: 2007,
    track: 3,
    disc: 2,
    composer: "  ",
    lyricist: null,
    producer: "Producer",
    conductor: null,
    publisher: "Label",
    ...tags,
  },
  picture: withPicture ? picture : null,
});

it("fills only the missing fields the candidate has, trimming strings", () => {
  const result = missingPatchOf(music(), candidate());

  expect(result.patch).toEqual({
    artist: "Artist",
    albumArtist: "Album Artist",
    producer: "Producer",
    publisher: "Label",
    year: 2007,
    track: 3,
    disc: 2,
  });
  expect(result.picture).toBe(picture);
});

it("never touches title, existing values, or fields the candidate lacks", () => {
  const result = missingPatchOf(
    music({ artist: "Kept", year: 1999 }),
    candidate({ producer: null, publisher: null }),
  );

  expect(result.patch).toEqual({
    albumArtist: "Album Artist",
    track: 3,
    disc: 2,
  });
});

it("leaves the artwork alone when the track already has one or the candidate has none", () => {
  expect(
    missingPatchOf(music({ picturePath: "/images/a.jpg" }), candidate())
      .picture,
  ).toBeUndefined();
  expect(missingPatchOf(music(), candidate({}, false)).picture).toBeUndefined();
});

it("returns an empty patch and no picture when nothing is missing", () => {
  const complete = music({
    artist: "A",
    albumArtist: "AA",
    composer: "C",
    lyricist: "L",
    producer: "P",
    conductor: "Co",
    publisher: "Pu",
    year: 2000,
    track: 1,
    picturePath: "/images/a.jpg",
  });

  expect(missingPatchOf(complete, candidate())).toEqual({
    patch: {},
    picture: undefined,
  });
});
