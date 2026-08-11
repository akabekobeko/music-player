import { expect, it } from "vitest";
import { playbackStateOf } from "./playbackStateOf";

it("maps engine states onto MediaSession playback states", () => {
  expect(playbackStateOf("playing")).toBe("playing");
  expect(playbackStateOf("paused")).toBe("paused");
  expect(playbackStateOf("stopped")).toBe("none");
  expect(playbackStateOf("loading")).toBe("none");
  expect(playbackStateOf("error")).toBe("none");
});
