import type { MusicInfoCandidate } from "@mp/ipc";
import { expect, it } from "vitest";
import { defaultAdoptedOf } from "./defaultAdoptedOf";
import type { MusicInfoFormValues } from "./musicInfoSchema";

const values = (
  overrides: Partial<MusicInfoFormValues> = {},
): MusicInfoFormValues => ({
  title: "Title",
  artist: "Artist",
  albumArtist: "Album Artist",
  album: "Album",
  genre: "",
  composer: " ",
  lyricist: "L",
  producer: "P",
  conductor: "C",
  publisher: "Pu",
  year: "",
  track: "0",
  disc: "1",
  bpm: "",
  rating: "",
  ...overrides,
});

const candidate = (
  tags: Partial<MusicInfoCandidate["tags"]> = {},
): MusicInfoCandidate => ({
  recordingId: "r",
  releaseId: "rel",
  score: 100,
  tags: {
    title: "T",
    artist: "A",
    albumArtist: "AA",
    album: "Al",
    genre: "Rock",
    year: 2007,
    track: 3,
    disc: 1,
    composer: "Co",
    lyricist: "L",
    producer: null,
    conductor: "Cd",
    publisher: "Pu",
    ...tags,
  },
  picture: null,
});

it("adopts the missing fields the candidate has a value for", () => {
  const adopted = defaultAdoptedOf(values(), candidate());

  expect(
    Object.entries(adopted)
      .filter(([, on]) => on)
      .map(([field]) => field),
  ).toEqual(["genre", "year", "track", "disc", "composer"]);
});

it("never adopts the title and skips fields the candidate lacks", () => {
  const adopted = defaultAdoptedOf(
    values({ title: "", producer: "" }),
    candidate({ producer: null }),
  );

  expect(adopted.title).toBe(false);
  expect(adopted.producer).toBe(false);
});

it("adopts albumArtist only when the artist is empty too", () => {
  expect(
    defaultAdoptedOf(values({ albumArtist: "" }), candidate()).albumArtist,
  ).toBe(false);
  expect(
    defaultAdoptedOf(values({ artist: "", albumArtist: "" }), candidate())
      .albumArtist,
  ).toBe(true);
});

it("treats a typed track number as present and a mixed (null) value as empty", () => {
  expect(defaultAdoptedOf(values({ track: "5" }), candidate()).track).toBe(
    false,
  );
  expect(defaultAdoptedOf(values({ genre: null }), candidate()).genre).toBe(
    true,
  );
});
