import { expect, it, vi } from "vitest";

vi.mock("../db/connection", () => ({ getDatabase: () => ({}) }));
vi.mock("../library/getMusicsByIds", () => ({
  getMusicsByIds: (_db: unknown, ids: readonly number[]) =>
    ids[0] === 1 ? [{ id: 1, title: "Known" }] : [],
}));
vi.mock("../musicbrainz/musicBrainzClient", () => ({ musicBrainzClient: {} }));
const lookupMusicInfo = vi.fn();
vi.mock("../musicbrainz/lookupMusicInfo/lookupMusicInfo", () => ({
  lookupMusicInfo: (...args: unknown[]) => lookupMusicInfo(...args),
}));

const { onLookupMusic } = await import("./onLookupMusic");
const ev = {} as Electron.IpcMainInvokeEvent;

it("rejects a non-integer id and an id not in the library", async () => {
  expect(await onLookupMusic(ev, { musicId: 1.5 })).toMatchObject({
    ok: false,
    error: { code: "INVALID_REQUEST" },
  });
  expect(await onLookupMusic(ev, { musicId: 99 })).toMatchObject({
    ok: false,
    error: { code: "MUSIC_NOT_FOUND" },
  });
  expect(lookupMusicInfo).not.toHaveBeenCalled();
});

it("returns the candidate, or null for no match", async () => {
  lookupMusicInfo.mockResolvedValueOnce({
    ok: true,
    value: { recordingId: "r" },
  });
  expect(await onLookupMusic(ev, { musicId: 1 })).toEqual({
    ok: true,
    value: { recordingId: "r" },
  });

  lookupMusicInfo.mockResolvedValueOnce({ ok: true, value: null });
  expect(await onLookupMusic(ev, { musicId: 1 })).toEqual({
    ok: true,
    value: null,
  });
});

it("carries the MusicBrainz code into the IpcError", async () => {
  lookupMusicInfo.mockResolvedValueOnce({
    ok: false,
    error: { code: "MB_THROTTLED", message: "busy" },
  });
  expect(await onLookupMusic(ev, { musicId: 1 })).toEqual({
    ok: false,
    error: { name: "MusicBrainzError", code: "MB_THROTTLED", message: "busy" },
  });
});
