import { expect, it } from "vitest";
import { createInitialPlayback } from "./createInitialPlayback";
import { playbackSnapshotsEqual } from "./playbackSnapshotsEqual";
import { snapshotOfPlayback } from "./snapshotOfPlayback";
import type { InternalPlayback } from "./types";

const initial = (
  overrides: Partial<InternalPlayback> = {},
): InternalPlayback => ({ ...createInitialPlayback(1), ...overrides });

it("snapshot equality detects unchanged projections", () => {
  const a = snapshotOfPlayback(initial());
  const b = snapshotOfPlayback(initial());
  expect(playbackSnapshotsEqual(a, b)).toBe(true);
  const c = snapshotOfPlayback(initial({ currentTime: 1, state: "playing" }));
  expect(playbackSnapshotsEqual(a, c)).toBe(false);
});
