import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { abortableSleep } from "./abortableSleep";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("resolves after the delay", async () => {
  let done = false;
  const sleep = abortableSleep(1000).then(() => {
    done = true;
  });

  await vi.advanceTimersByTimeAsync(999);
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await sleep;
  expect(done).toBe(true);
});

it("resolves early when the signal aborts", async () => {
  const controller = new AbortController();
  let done = false;
  const sleep = abortableSleep(60_000, controller.signal).then(() => {
    done = true;
  });

  await vi.advanceTimersByTimeAsync(10);
  controller.abort();
  await sleep;
  expect(done).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it("resolves immediately for an already aborted signal", async () => {
  const controller = new AbortController();
  controller.abort();

  await abortableSleep(60_000, controller.signal);
  expect(vi.getTimerCount()).toBe(0);
});
