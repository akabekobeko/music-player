import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { nextOf, previousOf } from "./derive";

const music = (id: number): Music => ({ id }) as Music;

const queue = [music(1), music(2), music(3)];

it("returns the neighbours of a mid-queue track", () => {
  expect(previousOf(queue, music(2))?.id).toBe(1);
  expect(nextOf(queue, music(2))?.id).toBe(3);
});

it("returns null before the head and after the tail", () => {
  expect(previousOf(queue, music(1))).toBeNull();
  expect(nextOf(queue, music(3))).toBeNull();
});

it("returns null when the current track is not in the queue", () => {
  expect(previousOf(queue, music(99))).toBeNull();
  expect(nextOf(queue, music(99))).toBeNull();
});

it("returns null without a current track or with an empty queue", () => {
  expect(previousOf(queue, null)).toBeNull();
  expect(nextOf([], music(1))).toBeNull();
});

it("matches by id, not by object identity", () => {
  expect(nextOf(queue, { ...music(1) })?.id).toBe(2);
});
