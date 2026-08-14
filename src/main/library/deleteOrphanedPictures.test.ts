import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { deleteOrphanedPictures } from "./deleteOrphanedPictures";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const count = (): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM pictures").get() as { n: number }).n;

it("returns an empty list when no picture is orphaned", () => {
  const pictureId = getOrCreatePictureId(db, "/images/used.jpg");
  registerArtistPictureIfMissing(db, "Artist", pictureId);
  expect(deleteOrphanedPictures(db)).toEqual([]);
  expect(count()).toBe(1);
});

it("deletes unreferenced pictures and returns their paths", () => {
  getOrCreatePictureId(db, "/images/orphan.jpg");
  const keptId = getOrCreatePictureId(db, "/images/kept.jpg");
  registerArtistPictureIfMissing(db, "Artist", keptId);

  expect(deleteOrphanedPictures(db)).toEqual(["/images/orphan.jpg"]);
  expect(count()).toBe(1);
});
