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
    lyricist: "",
    producer: "",
    conductor: "",
    publisher: "",
    durationMs: 1000,
    bpm: null,
    rating: null,
    pictureId: null,
    addedAt: "2026-08-09T00:00:00.000Z",
    updatedAt: "2026-08-09T00:00:00.000Z",
  }) as Music;

it("played replaces both queues and sets the current track", () => {
  const queue = [music(1), music(2)];
  const state = playerReducer(INITIAL_PLAYER_STATE, {
    type: "played",
    music: queue[1] as Music,
    queue,
    orderedQueue: queue,
    source: "artist",
    shuffle: false,
  });
  expect(state.queue).toBe(queue);
  expect(state.orderedQueue).toBe(queue);
  expect(state.current).toBe(queue[1]);
  expect(state.queueSource).toBe("artist");
  expect(state.shuffle).toBe(false);
});

it("played keeps the shuffled and ordered queues apart", () => {
  const ordered = [music(1), music(2), music(3)];
  const shuffled = [music(2), music(1), music(3)];
  const state = playerReducer(INITIAL_PLAYER_STATE, {
    type: "played",
    music: shuffled[0] as Music,
    queue: shuffled,
    orderedQueue: ordered,
    source: "album",
    shuffle: true,
  });
  expect(state.queue).toBe(shuffled);
  expect(state.orderedQueue).toBe(ordered);
  expect(state.shuffle).toBe(true);
});

it("currentChanged moves the current track without touching the queue", () => {
  const queue = [music(1), music(2)];
  const before = {
    queue,
    orderedQueue: queue,
    queueSource: "album" as const,
    current: queue[0] as Music,
    shuffle: false,
  };
  const state = playerReducer(before, {
    type: "currentChanged",
    music: queue[1] as Music,
  });
  expect(state.queue).toBe(queue);
  expect(state.queueSource).toBe("album");
  expect(state.current).toBe(queue[1]);
});

it("queueInsertedNext inserts right after the current track in both orders", () => {
  const queue = [music(2), music(1), music(3)];
  const ordered = [music(1), music(2), music(3)];
  const before = {
    queue,
    orderedQueue: ordered,
    queueSource: "artist" as const,
    current: queue[1] as Music,
    shuffle: true,
  };
  const state = playerReducer(before, {
    type: "queueInsertedNext",
    musics: [music(8), music(9)],
  });
  expect(state.queue.map((m) => m.id)).toEqual([2, 1, 8, 9, 3]);
  expect(state.orderedQueue.map((m) => m.id)).toEqual([1, 8, 9, 2, 3]);
  expect(state.current).toBe(queue[1]);
});

it("queueInsertedNext goes to the head without a current track", () => {
  const state = playerReducer(
    {
      queue: [music(1)],
      orderedQueue: [music(1)],
      queueSource: "none",
      current: null,
      shuffle: false,
    },
    { type: "queueInsertedNext", musics: [music(9)] },
  );
  expect(state.queue.map((m) => m.id)).toEqual([9, 1]);
  expect(state.orderedQueue.map((m) => m.id)).toEqual([9, 1]);
});

it("queueAppended adds to the tail of both orders", () => {
  const state = playerReducer(
    {
      queue: [music(1)],
      orderedQueue: [music(1)],
      queueSource: "artist",
      current: music(1),
      shuffle: false,
    },
    { type: "queueAppended", musics: [music(2), music(3)] },
  );
  expect(state.queue.map((m) => m.id)).toEqual([1, 2, 3]);
  expect(state.orderedQueue.map((m) => m.id)).toEqual([1, 2, 3]);
});

it("queueReplaced keeps the current track and resets both orders", () => {
  const current = music(1);
  const before = {
    queue: [current],
    orderedQueue: [current],
    queueSource: "artist" as const,
    current,
    shuffle: false,
  };
  const nextQueue = [music(2), music(3)];
  const state = playerReducer(before, {
    type: "queueReplaced",
    queue: nextQueue,
    source: "playlist",
  });
  expect(state.queue).toBe(nextQueue);
  expect(state.orderedQueue).toBe(nextQueue);
  expect(state.queueSource).toBe("playlist");
  expect(state.current).toBe(current);
});

it("shuffleChanged swaps the playback order and keeps the ordered queue", () => {
  const ordered = [music(1), music(2), music(3)];
  const before = {
    queue: ordered,
    orderedQueue: ordered,
    queueSource: "playlist" as const,
    current: ordered[0] as Music,
    shuffle: false,
  };
  const shuffled = [music(1), music(3), music(2)];
  const state = playerReducer(before, {
    type: "shuffleChanged",
    shuffle: true,
    queue: shuffled,
  });
  expect(state.shuffle).toBe(true);
  expect(state.queue).toBe(shuffled);
  expect(state.orderedQueue).toBe(ordered);
  expect(state.current).toBe(ordered[0]);
});

it("shuffleChanged off restores the ordered queue passed by the command", () => {
  const ordered = [music(1), music(2), music(3)];
  const before = {
    queue: [music(3), music(1), music(2)],
    orderedQueue: ordered,
    queueSource: "album" as const,
    current: ordered[2] as Music,
    shuffle: true,
  };
  const state = playerReducer(before, {
    type: "shuffleChanged",
    shuffle: false,
    queue: ordered,
  });
  expect(state.shuffle).toBe(false);
  expect(state.queue).toBe(ordered);
  expect(state.orderedQueue).toBe(ordered);
});
