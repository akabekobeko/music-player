import { expect, it } from "vitest";
import { readFixture } from "../fixtures/readFixture";
import {
  type Release,
  type ReleaseMedium,
  type ReleaseTrack,
  releaseSchema,
} from "../schemas/releaseSchema";
import { toMusicInfoCandidate } from "./toMusicInfoCandidate";

const yearZero = releaseSchema.parse(readFixture("release-year-zero.json"));
const compilation = releaseSchema.parse(
  readFixture("release-compilation.json"),
);

const at = (
  release: Release,
  mediumIndex: number,
  trackIndex: number,
): { medium: ReleaseMedium; track: ReleaseTrack } => {
  const medium = release.media?.[mediumIndex];
  const track = medium?.tracks?.[trackIndex];
  if (medium === undefined || track === undefined) {
    throw new Error("fixture track missing");
  }

  return { medium, track };
};

const picture = { mimeType: "image/jpeg", data: new Uint8Array([1]) };

it("maps every tag of an album track (producers, work composer, label, group genre)", () => {
  const candidate = toMusicInfoCandidate({
    release: yearZero,
    ...at(yearZero, 0, 0),
    score: 100,
    picture,
  });

  expect(candidate).toEqual({
    recordingId: "7a1b2c3d-4444-4e5f-8a9b-000000000001",
    releaseId: "0f6a5c2e-1111-4a5b-9c2d-000000000001",
    score: 100,
    tags: {
      title: "HYPERPOWER!",
      artist: "Nine Inch Nails",
      albumArtist: "Nine Inch Nails",
      album: "Year Zero",
      genre: "Industrial rock",
      year: 2007,
      track: 1,
      disc: 1,
      composer: "Trent Reznor",
      lyricist: null,
      producer: "Trent Reznor, Atticus Ross",
      conductor: null,
      publisher: "Interscope Records",
    },
    picture,
  });
});

it("joins a featuring credit and merges composers across the works of a medley", () => {
  const candidate = toMusicInfoCandidate({
    release: yearZero,
    ...at(yearZero, 0, 1),
    score: 100,
    picture: null,
  });

  expect(candidate.tags.artist).toBe("Nine Inch Nails feat. Saul Williams");
  expect(candidate.tags.composer).toBe("Trent Reznor, Saul Williams");
  expect(candidate.tags.lyricist).toBe("Trent Reznor");
  expect(candidate.tags.producer).toBeNull();
  expect(candidate.picture).toBeNull();
});

it("prefers the target credit over the canonical artist name", () => {
  const candidate = toMusicInfoCandidate({
    release: yearZero,
    ...at(yearZero, 0, 2),
    score: 97,
    picture: null,
  });

  expect(candidate.tags.conductor).toBe("Maestro T. R.");
  expect(candidate.tags.producer).toBe("Trent Reznor");
  expect(candidate.score).toBe(97);
});

it("takes the disc number from the medium position", () => {
  const candidate = toMusicInfoCandidate({
    release: yearZero,
    ...at(yearZero, 1, 0),
    score: 100,
    picture: null,
  });

  expect(candidate.tags.disc).toBe(2);
  expect(candidate.tags.track).toBe(1);
  expect(candidate.tags.title).toBe("Zero-Sum (Bonus)");
});

it("falls back to the first release date, release genres and no label on a compilation", () => {
  const candidate = toMusicInfoCandidate({
    release: compilation,
    ...at(compilation, 0, 0),
    score: 92,
    picture: null,
  });

  expect(candidate.tags).toEqual({
    title: "Opening Act",
    artist: "Artist X & Artist Y",
    albumArtist: "Various Artists",
    album: "Now That Is What I Call a Fixture",
    genre: "Pop",
    year: 1999,
    track: 1,
    disc: 1,
    composer: null,
    lyricist: null,
    producer: null,
    conductor: null,
    publisher: null,
  });
});

it("falls back to the recording title when the track title is empty", () => {
  const { medium, track } = at(yearZero, 0, 2);
  const candidate = toMusicInfoCandidate({
    release: yearZero,
    medium,
    track: { ...track, title: "" },
    score: 100,
    picture: null,
  });

  expect(candidate.tags.title).toBe("Survivalism");
});

it("returns null year and genre when neither the release nor the group has them", () => {
  const { medium, track } = at(compilation, 0, 1);
  const candidate = toMusicInfoCandidate({
    release: { ...compilation, genres: [], "release-group": undefined },
    medium,
    track,
    score: 100,
    picture: null,
  });

  expect(candidate.tags.year).toBeNull();
  expect(candidate.tags.genre).toBeNull();
  expect(candidate.tags.artist).toBe("Artist Z");
});

it("uses the recording genres when the group and release lists are empty", () => {
  const { medium, track } = at(yearZero, 0, 2);
  const candidate = toMusicInfoCandidate({
    release: {
      ...yearZero,
      genres: [],
      "release-group": { ...yearZero["release-group"], id: "rg", genres: [] },
    },
    medium,
    track,
    score: 100,
    picture: null,
  });

  expect(candidate.tags.genre).toBe("Electronic");
});
