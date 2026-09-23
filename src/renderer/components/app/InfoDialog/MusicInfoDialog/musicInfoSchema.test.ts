import { expect, it } from "vitest";
import { type MusicInfoFormValues, musicInfoSchema } from "./musicInfoSchema";

const values = (
  overrides: Partial<MusicInfoFormValues> = {},
): MusicInfoFormValues => ({
  title: "T",
  artist: "",
  albumArtist: "",
  album: "",
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
  ...overrides,
});

const issuesOf = (input: MusicInfoFormValues) =>
  musicInfoSchema.safeParse(input).error?.issues ?? [];

it("accepts empty numeric fields", () => {
  expect(issuesOf(values())).toEqual([]);
  expect(issuesOf(values({ track: "", disc: "" }))).toEqual([]);
});

it("accepts mixed (null) values without applying any constraint", () => {
  expect(issuesOf(values({ title: null, year: null, rating: null }))).toEqual(
    [],
  );
});

it("does not require the title (that is a field rule of the single edit)", () => {
  expect(issuesOf(values({ title: "" }))).toEqual([]);
});

it("reports the i18n key of a numeric field out of range, at its path", () => {
  const issues = issuesOf(values({ year: "0", rating: "2.4" }));
  expect(issues.map((issue) => [issue.path, issue.message])).toEqual([
    [["year"], "musicInfo.error.year"],
    [["rating"], "musicInfo.error.rating"],
  ]);
});

it("validates every numeric field against its own range", () => {
  expect(issuesOf(values({ year: "9999" }))).toEqual([]);
  expect(issuesOf(values({ year: "10000" }))).toHaveLength(1);
  expect(issuesOf(values({ track: "-1" }))).toHaveLength(1);
  expect(issuesOf(values({ disc: "0" }))).toHaveLength(1);
  expect(issuesOf(values({ bpm: "0" }))).toHaveLength(1);
  expect(issuesOf(values({ bpm: "999" }))).toEqual([]);
  expect(issuesOf(values({ rating: "5" }))).toEqual([]);
  expect(issuesOf(values({ rating: "5.5" }))).toHaveLength(1);
});

it("never transforms the values", () => {
  const input = values({ year: "2001", artist: "  padded  " });
  const parsed = musicInfoSchema.parse(input);
  expect(parsed).toEqual(input);
});
