import { expect, it } from "vitest";
import { readFixture } from "../fixtures/readFixture";
import { releaseSchema } from "./releaseSchema";

it("parses the saved album release and keeps the read fields", () => {
  const release = releaseSchema.parse(readFixture("release-year-zero.json"));

  expect(release.id).toBe("0f6a5c2e-1111-4a5b-9c2d-000000000001");
  expect(release.title).toBe("Year Zero");
  expect(release.date).toBe("2007-04-17");
  expect(release["artist-credit"]).toEqual([
    { name: "Nine Inch Nails", joinphrase: "" },
  ]);
  expect(release["release-group"]).toEqual({
    id: "2e3d1f4a-2222-4b6c-8d3e-000000000001",
    "first-release-date": "2007-04-13",
    genres: [
      { name: "industrial", count: 3 },
      { name: "industrial rock", count: 5 },
    ],
  });
  expect(release["label-info"]).toEqual([
    { label: null },
    { label: { name: "Interscope Records" } },
    { label: { name: "Nothing Records" } },
  ]);
  expect(release.media).toHaveLength(2);
  expect(release.media?.[0]?.tracks).toHaveLength(3);
  expect(release.media?.[1]?.tracks?.[0]?.length).toBeNull();
});

it("keeps the relationship chain down to the work artists", () => {
  const release = releaseSchema.parse(readFixture("release-year-zero.json"));
  const relations = release.media?.[0]?.tracks?.[0]?.recording.relations;

  expect(relations?.map((relation) => relation.type)).toEqual([
    "producer",
    "producer",
    "performance",
  ]);
  expect(relations?.[2]?.work?.relations).toEqual([
    {
      type: "composer",
      "target-type": "artist",
      "target-credit": "",
      artist: { name: "Trent Reznor" },
    },
  ]);
});

it("strips undeclared fields (release relations, type ids, direction, canonical artist)", () => {
  const release = releaseSchema.parse(readFixture("release-year-zero.json"));
  const relation = release.media?.[0]?.tracks?.[0]?.recording.relations?.[0];

  expect(release).not.toHaveProperty("relations");
  expect(release).not.toHaveProperty("cover-art-archive");
  expect(relation).not.toHaveProperty("type-id");
  expect(relation).not.toHaveProperty("direction");
  expect(release["artist-credit"]?.[0]).not.toHaveProperty("artist");
  expect(release.media?.[0]?.tracks?.[0]).not.toHaveProperty("number");
});

it("parses the compilation release with missing date, labels and recording relations", () => {
  const release = releaseSchema.parse(readFixture("release-compilation.json"));

  expect(release.date).toBeUndefined();
  expect(release["label-info"]).toBeUndefined();
  expect(release["release-group"]?.["first-release-date"]).toBe("1999-11");
  expect(release.media?.[0]?.tracks?.[0]?.recording.relations).toBeUndefined();
  expect(release.media?.[0]?.tracks?.[1]?.length).toBeUndefined();
});

it("requires the MBIDs and titles the matching depends on", () => {
  expect(() => releaseSchema.parse({ title: "x" })).toThrow();
  expect(() =>
    releaseSchema.parse({
      id: "r",
      title: "x",
      media: [{ position: 1, tracks: [{ id: "t", position: 1, title: "t" }] }],
    }),
  ).toThrow();
});
