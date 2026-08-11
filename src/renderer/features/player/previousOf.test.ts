import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { previousOf } from "./previousOf";

const music = (id: number): Music => ({ id }) as Music;

const queue = [music(1), music(2), music(3)];

it("returns the neighbour of a mid-queue track", () => {
  expect(previousOf(queue, music(2))?.id).toBe(1);
});

it("returns null before the head", () => {
  expect(previousOf(queue, music(1))).toBeNull();
});

it("resolves a replaced queue: no previous", () => {
  // Queue replacement policy: the playing track is outside the new queue.
  expect(previousOf(queue, music(99))).toBeNull();
});

it("returns null before anything has played", () => {
  expect(previousOf(queue, null)).toBeNull();
});

it("returns null with an empty queue", () => {
  expect(previousOf([], music(1))).toBeNull();
});
