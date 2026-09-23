import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  type AudioFormat,
  loadTrack,
  type PictureInfo,
  PictureKind,
  saveTrack,
  type Track,
} from "@akabeko/music-metadata-editor";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MusicPictureInput, MusicTagPatch } from "../../ipc/types";
import {
  TEMP_FILE_SUFFIX,
  type WriteMusicFileDeps,
  writeMusicFile,
} from "./writeMusicFile";

/**
 * Round-trip coverage over every format Parade supports, against the real
 * mme writers (`docs/specs/v1.1/roadmap.md`, Phase 1). Fixtures are copied
 * from mme's own test suite (`src/test/fixtures/audio/README.md`). Numeric
 * deletion and the rating need mme 1.2.0 (`null` deletion markers, rating
 * in ID3v2 / Vorbis Comment / APE).
 */

const FIXTURES = path.resolve(
  import.meta.dirname,
  "../../../test/fixtures/audio",
);

/** One fixture per format: the file every tag test starts from. */
const FORMATS: ReadonlyArray<{ format: AudioFormat; file: string }> = [
  { format: "mp3", file: "v23-basic.mp3" },
  { format: "flac", file: "basic.flac" },
  { format: "m4a", file: "basic.m4a" },
  { format: "ogg", file: "vorbis-basic.ogg" },
  { format: "opus", file: "opus-basic.opus" },
  { format: "wav", file: "id3.wav" },
  { format: "aiff", file: "id3.aiff" },
  { format: "wma", file: "both-descriptions.wma" },
  { format: "ape", file: "basic.ape" },
];

/** Fixtures that ship with an embedded front cover. */
const WITH_PICTURE: ReadonlyArray<{ format: AudioFormat; file: string }> = [
  { format: "mp3", file: "v24-with-extras.mp3" },
  { format: "flac", file: "with-picture.flac" },
  { format: "m4a", file: "with-picture.m4a" },
  { format: "ape", file: "with-picture.ape" },
];

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03, 0x04,
]);
const NEW_COVER: MusicPictureInput = { mimeType: "image/png", data: PNG };

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "parade-write-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

/** Copy a fixture into the work dir and return the copy's path. */
const stage = async (file: string): Promise<string> => {
  const target = path.join(workDir, file);
  await copyFile(path.join(FIXTURES, file), target);
  return target;
};

const write = (
  filePath: string,
  patch: MusicTagPatch,
  picture?: MusicPictureInput | null,
): Promise<Track> => writeMusicFile(filePath, patch, picture);

const frontCoverOf = (track: Track): PictureInfo | undefined =>
  track.pictures.find((picture) => picture.kind === PictureKind.CoverFront);

for (const { format, file } of FORMATS) {
  it(`${format}: writes text fields and keeps everything else`, async () => {
    const filePath = await stage(file);
    const before = await loadTrack(filePath);
    const patch: MusicTagPatch = {
      artist: "New Artist",
      album: "New Album",
      genre: "Edited",
      composer: "Comp",
    };

    const after = await write(filePath, patch);

    expect(after.tag.artist).toBe("New Artist");
    expect(after.tag.album).toBe("New Album");
    expect(after.tag.genre).toBe("Edited");
    expect(after.tag.composer).toBe("Comp");
    for (const [field, value] of Object.entries(before.tag)) {
      if (!(field in patch)) {
        expect(after.tag[field as keyof Track["tag"]], field).toEqual(value);
      }
    }
    expect(await readdir(workDir)).toEqual([file]);
  });

  it(`${format}: clears text fields with an empty string`, async () => {
    const filePath = await stage(file);

    const after = await write(filePath, { album: "", artist: "" });

    expect(after.tag.album ?? "").toBe("");
    expect(after.tag.artist ?? "").toBe("");
    expect(after.tag.title).toBeDefined();
  });

  it(`${format}: sets the year, keeping the day part of a recording date`, async () => {
    const filePath = await stage(file);
    const before = await loadTrack(filePath);

    const after = await write(filePath, { year: 2001 });

    expect(after.tag.year).toBe(2001);
    const day = before.tag.recordingDate;
    if (day !== undefined && /^\d{4}/.test(day)) {
      expect(after.tag.recordingDate).toBe(`2001${day.slice(4)}`);
    }
  });

  it(`${format}: clears the year`, async () => {
    const filePath = await stage(file);
    await write(filePath, { year: 1999 });

    const after = await write(filePath, { year: null });

    expect(after.tag.year).toBeUndefined();
    expect(after.tag.recordingDate).toBeUndefined();
  });

  it(`${format}: writes track, disc and bpm`, async () => {
    const filePath = await stage(file);

    const after = await write(filePath, { track: 7, disc: 2, bpm: 128 });

    expect(after.tag.trackNumber).toBe(7);
    expect(after.tag.discNumber).toBe(2);
    expect(after.tag.bpm).toBe(128);
  });

  it(`${format}: clears bpm`, async () => {
    const filePath = await stage(file);
    await write(filePath, { bpm: 128 });

    const after = await write(filePath, { bpm: null });

    expect(after.tag.bpm).toBeUndefined();
  });

  it(`${format}: writes and clears the rating`, async () => {
    const filePath = await stage(file);

    const set = await write(filePath, { rating: 0.6 });
    expect(set.tag.rating).toBeCloseTo(0.6, 1);

    const cleared = await write(filePath, { rating: null });
    expect(cleared.tag.rating).toBeUndefined();
  });

  it(`${format}: embeds a front cover`, async () => {
    const filePath = await stage(file);

    const after = await write(filePath, {}, NEW_COVER);

    expect(frontCoverOf(after)?.data).toEqual(PNG);
    expect(after.tag.title).toBeDefined();
  });
}

for (const { format, file } of WITH_PICTURE) {
  it(`${format}: replaces the front cover`, async () => {
    const filePath = await stage(file);
    const before = await loadTrack(filePath);
    expect(frontCoverOf(before)).toBeDefined();

    const after = await write(filePath, {}, NEW_COVER);

    expect(after.pictures).toHaveLength(1);
    expect(frontCoverOf(after)?.data).toEqual(PNG);
  });

  it(`${format}: removes the front cover`, async () => {
    const filePath = await stage(file);

    const after = await write(filePath, {}, null);

    expect(after.pictures).toEqual([]);
    expect(after.tag.title).toBeDefined();
  });
}

for (const { format, file } of FORMATS.filter((entry) =>
  ["mp3", "flac"].includes(entry.format),
)) {
  it(`${format}: keeps a back cover when replacing the front cover`, async () => {
    const filePath = await stage(file);
    const original = await loadTrack(filePath);
    const back: PictureInfo = {
      mimeType: "image/png",
      kind: PictureKind.CoverBack,
      data: new Uint8Array([...PNG, 0xff]),
    };
    const seeded: Track = {
      ...original,
      pictures: [
        {
          mimeType: "image/png",
          kind: PictureKind.CoverFront,
          data: new Uint8Array([...PNG, 0xee]),
        },
        back,
      ],
    };
    await saveTrack(seeded, { source: filePath });

    const after = await write(filePath, {}, NEW_COVER);

    expect(frontCoverOf(after)?.data).toEqual(PNG);
    expect(
      after.pictures.find((picture) => picture.kind === PictureKind.CoverBack)
        ?.data,
    ).toEqual(back.data);
  });
}

// --- Failure paths, with fakes so no real file is harmed ------------------

const fakeDeps = (
  overrides: Partial<WriteMusicFileDeps>,
): WriteMusicFileDeps => ({
  loadTrack: vi.fn(
    async (): Promise<Track> => ({
      audioFormat: "mp3",
      tag: { title: "T" },
      pictures: [],
      chapters: [],
      additionalFields: {},
      warnings: [],
    }),
  ),
  saveTrack: vi.fn(async () => {}),
  rename: vi.fn(async () => {}),
  unlink: vi.fn(async () => {}),
  ...overrides,
});

it("writes into a sibling temporary file and renames it over the original", async () => {
  const deps = fakeDeps({});

  await writeMusicFile("/m/a.mp3", { title: "X" }, undefined, deps);

  expect(deps.saveTrack).toHaveBeenCalledWith(expect.anything(), {
    source: "/m/a.mp3",
    outputPath: `/m/a.mp3${TEMP_FILE_SUFFIX}`,
  });
  expect(deps.rename).toHaveBeenCalledWith(
    `/m/a.mp3${TEMP_FILE_SUFFIX}`,
    "/m/a.mp3",
  );
  expect(deps.unlink).not.toHaveBeenCalled();
});

it("deletes the temporary file and rethrows when saveTrack fails", async () => {
  const deps = fakeDeps({
    saveTrack: vi.fn(async () => {
      throw new Error("bad tag");
    }),
  });

  await expect(
    writeMusicFile("/m/a.mp3", { title: "X" }, undefined, deps),
  ).rejects.toThrow("bad tag");
  expect(deps.rename).not.toHaveBeenCalled();
  expect(deps.unlink).toHaveBeenCalledWith(`/m/a.mp3${TEMP_FILE_SUFFIX}`);
});

it("deletes the temporary file and rethrows when rename fails", async () => {
  const deps = fakeDeps({
    rename: vi.fn(async () => {
      throw Object.assign(new Error("busy"), { code: "EBUSY" });
    }),
  });

  await expect(
    writeMusicFile("/m/a.mp3", { title: "X" }, undefined, deps),
  ).rejects.toMatchObject({ code: "EBUSY" });
  expect(deps.unlink).toHaveBeenCalledWith(`/m/a.mp3${TEMP_FILE_SUFFIX}`);
});

it("still rethrows the original error when the cleanup itself fails", async () => {
  const deps = fakeDeps({
    saveTrack: vi.fn(async () => {
      throw new Error("bad tag");
    }),
    unlink: vi.fn(async () => {
      throw new Error("ENOENT");
    }),
  });

  await expect(
    writeMusicFile("/m/a.mp3", { title: "X" }, undefined, deps),
  ).rejects.toThrow("bad tag");
});
