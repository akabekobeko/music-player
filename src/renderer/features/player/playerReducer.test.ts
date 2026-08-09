import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { playerReducer } from "./playerReducer";
import { INITIAL_PLAYER_STATE } from "./types";

const music = (id: number): Music =>
  ({
    id,
    filePath: `/m/${id}.mp3`,
    audioFormat: "mp3",
    title: `Track ${id}`,
    artist: "Artist",
    albumArtist: "",
    album: "Album",
    disc: 1,
    track: id,
    year: null,
    genre: "",
    composer: "",
    durationMs: 1000,
    bpm: null,
    rating: null,
    pictureId: null,
    addedAt: "2026-08-09T00:00:00.000Z",
    updatedAt: "2026-08-09T00:00:00.000Z",
  }) as Music;

it("played replaces the queue and sets the current track", () => {
  const queue = [music(1), music(2)];
  const state = playerReducer(INITIAL_PLAYER_STATE, {
    type: "played",
    music: queue[1] as Music,
    queue,
    source: "artist",
  });
  expect(state.queue).toBe(queue);
  expect(state.current).toBe(queue[1]);
  expect(state.queueSource).toBe("artist");
});

it("currentChanged moves the current track without touching the queue", () => {
  const queue = [music(1), music(2)];
  const before = {
    queue,
    queueSource: "album" as const,
    current: queue[0] as Music,
  };
  const state = playerReducer(before, {
    type: "currentChanged",
    music: queue[1] as Music,
  });
  expect(state.queue).toBe(queue);
  expect(state.queueSource).toBe("album");
  expect(state.current).toBe(queue[1]);
});

it("queueInsertedNext inserts right after the current track", () => {
  const queue = [music(1), music(2), music(3)];
  const before = {
    queue,
    queueSource: "artist" as const,
    current: queue[1] as Music,
  };
  const state = playerReducer(before, {
    type: "queueInsertedNext",
    musics: [music(8), music(9)],
  });
  expect(state.queue.map((m) => m.id)).toEqual([1, 2, 8, 9, 3]);
  expect(state.current).toBe(queue[1]);
});

it("queueInsertedNext goes to the head without a current track", () => {
  const state = playerReducer(
    { queue: [music(1)], queueSource: "none", current: null },
    { type: "queueInsertedNext", musics: [music(9)] },
  );
  expect(state.queue.map((m) => m.id)).toEqual([9, 1]);
});

it("queueAppended adds to the tail", () => {
  const state = playerReducer(
    {
      queue: [music(1)],
      queueSource: "artist",
      current: music(1),
    },
    { type: "queueAppended", musics: [music(2), music(3)] },
  );
  expect(state.queue.map((m) => m.id)).toEqual([1, 2, 3]);
});

it("queueReplaced keeps the current track", () => {
  const current = music(1);
  const before = {
    queue: [current],
    queueSource: "artist" as const,
    current,
  };
  const nextQueue = [music(2), music(3)];
  const state = playerReducer(before, {
    type: "queueReplaced",
    queue: nextQueue,
    source: "playlist",
  });
  expect(state.queue).toBe(nextQueue);
  expect(state.queueSource).toBe("playlist");
  expect(state.current).toBe(current);
});
