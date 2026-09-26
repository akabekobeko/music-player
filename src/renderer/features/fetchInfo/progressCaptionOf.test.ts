import { expect, it } from "vitest";
import { progressCaptionOf } from "./progressCaptionOf";

const groups = [[{ album: "X" }, { album: "X" }], [{ album: "" }]];

const push = (current: number) => ({
  current,
  total: 3,
  filePath: `/${current}.mp3`,
  result: "updated" as const,
});

it("names the first album before any push", () => {
  expect(progressCaptionOf(groups, null)).toEqual({
    kind: "searching",
    album: "X",
  });
});

it("shows the processed file while inside a group", () => {
  expect(progressCaptionOf(groups, push(1))).toEqual({
    kind: "processed",
    filePath: "/1.mp3",
  });
});

it("names the next album when the next track starts a group", () => {
  expect(progressCaptionOf(groups, push(2))).toEqual({
    kind: "searching",
    album: "",
  });
});

it("returns null once every track is done", () => {
  expect(progressCaptionOf(groups, push(3))).toBeNull();
  expect(progressCaptionOf([], null)).toBeNull();
});
