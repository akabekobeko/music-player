import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import type { PlaybackSnapshot } from "../audio/types";
import {
  metadataInitOf,
  playbackStateOf,
  positionStateOf,
} from "./mediaSession";

const music = (patch: Partial<Music> = {}): Music =>
  ({
    id: 1,
    filePath: "/m/a.mp3",
    audioFormat: "mp3",
    title: "Song",
    artist: "Artist",
    albumArtist: "",
    album: "Album",
    disc: 1,
    track: 1,
    year: null,
    genre: "",
    composer: "",
    durationMs: 1000,
    bpm: null,
    rating: null,
    pictureId: null,
    picturePath: null,
    addedAt: "",
    updatedAt: "",
    ...patch,
  }) as Music;

const snapshot = (patch: Partial<PlaybackSnapshot>): PlaybackSnapshot => ({
  state: "playing",
  currentTime: 0,
  duration: 0,
  volume: 1,
  seeking: false,
  bufferReady: false,
  error: null,
  ...patch,
});

it("builds metadata with title / artist / album", () => {
  expect(metadataInitOf(music())).toEqual({
    title: "Song",
    artist: "Artist",
    album: "Album",
    artwork: [],
  });
});

it("uses the media-file URL for the artwork", () => {
  const init = metadataInitOf(music({ picturePath: "/images/a b.jpg" }));
  expect(init?.artwork).toEqual([{ src: "media-file:///images/a%20b.jpg" }]);
});

it("returns null to clear the metadata", () => {
  expect(metadataInitOf(null)).toBeNull();
});

it("maps engine states onto MediaSession playback states", () => {
  expect(playbackStateOf("playing")).toBe("playing");
  expect(playbackStateOf("paused")).toBe("paused");
  expect(playbackStateOf("stopped")).toBe("none");
  expect(playbackStateOf("loading")).toBe("none");
  expect(playbackStateOf("error")).toBe("none");
});

it("builds a clamped position state once the duration is known", () => {
  expect(positionStateOf(snapshot({ currentTime: 30, duration: 200 }))).toEqual(
    { duration: 200, position: 30, playbackRate: 1 },
  );
  expect(
    positionStateOf(snapshot({ currentTime: 250, duration: 200 }))?.position,
  ).toBe(200);
  expect(
    positionStateOf(snapshot({ currentTime: -1, duration: 200 }))?.position,
  ).toBe(0);
});

it("returns null while the duration is unknown", () => {
  expect(positionStateOf(snapshot({ currentTime: 5, duration: 0 }))).toBeNull();
});
