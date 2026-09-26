import type { MusicInfoCandidate } from "@mp/ipc";
import { expect, it } from "vitest";
import { NO_ADOPTED } from "./candidateFields";
import { effectiveValuesOf } from "./effectiveValuesOf";
import type { MusicInfoFormValues } from "./musicInfoSchema";

const values: MusicInfoFormValues = {
  title: "Title",
  artist: "",
  albumArtist: "",
  album: "Album",
  genre: "",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  year: "",
  track: "0",
  disc: "1",
  bpm: "",
  rating: "",
};

const candidate: MusicInfoCandidate = {
  recordingId: "r",
  releaseId: "rel",
  score: 100,
  tags: {
    title: "T",
    artist: "A",
    albumArtist: null,
    album: "Al",
    genre: "Rock",
    year: 2007,
    track: 3,
    disc: 2,
    composer: null,
    lyricist: null,
    producer: null,
    conductor: null,
    publisher: null,
  },
  picture: null,
};

it("returns the form values untouched before a fetch or with nothing adopted", () => {
  expect(effectiveValuesOf(values, null, NO_ADOPTED)).toBe(values);
  expect(effectiveValuesOf(values, candidate, NO_ADOPTED)).toEqual(values);
});

it("replaces adopted fields with the candidate text, numbers as decimal text", () => {
  const effective = effectiveValuesOf(values, candidate, {
    ...NO_ADOPTED,
    artist: true,
    year: true,
    track: true,
    disc: true,
  });

  expect(effective).toEqual({
    ...values,
    artist: "A",
    year: "2007",
    track: "3",
    disc: "2",
  });
});

it("leaves a field alone when adopted but the candidate has no value", () => {
  expect(
    effectiveValuesOf(values, candidate, { ...NO_ADOPTED, composer: true }),
  ).toEqual(values);
});
