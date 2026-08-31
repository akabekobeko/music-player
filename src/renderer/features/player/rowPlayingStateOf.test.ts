import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { rowPlayingStateOf } from "./rowPlayingStateOf";

const music = (id: number): Music => ({ id }) as Music;

it("marks the current track as playing while playing", () => {
  expect(rowPlayingStateOf(music(1), "playing", music(1))).toBe("playing");
});

it("marks the current track as playing while loading", () => {
  expect(rowPlayingStateOf(music(1), "loading", music(1))).toBe("playing");
});

it("marks the current track as paused while paused", () => {
  expect(rowPlayingStateOf(music(1), "paused", music(1))).toBe("paused");
});

it("leaves the current track unmarked when stopped", () => {
  expect(rowPlayingStateOf(music(1), "stopped", music(1))).toBeNull();
});

it("leaves the current track unmarked on error", () => {
  expect(rowPlayingStateOf(music(1), "error", music(1))).toBeNull();
});

it("leaves other tracks unmarked regardless of state", () => {
  expect(rowPlayingStateOf(music(1), "playing", music(2))).toBeNull();
  expect(rowPlayingStateOf(null, "playing", music(2))).toBeNull();
});
