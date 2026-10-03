import { expect, it } from "vitest";
import { dictionaries } from "./dictionaries";

it("every locale defines the same key set", () => {
  const enKeys = Object.keys(dictionaries.en).sort();
  const jaKeys = Object.keys(dictionaries.ja).sort();
  expect(jaKeys).toEqual(enKeys);
});

it("names a Playlist column like the same field of the music info dialog", () => {
  // `addedAt` is left out: the column shows the date only, the dialog the
  // date and the time, and the Japanese names differ accordingly.
  const pairs = [
    ["title", "title"],
    ["artist", "artist"],
    ["album", "album"],
    ["albumArtist", "albumArtist"],
    ["genre", "genre"],
    ["year", "year"],
    ["track", "track"],
    ["disc", "disc"],
    ["composer", "composer"],
    ["lyricist", "lyricist"],
    ["producer", "producer"],
    ["conductor", "conductor"],
    ["publisher", "publisher"],
    ["bpm", "bpm"],
    ["rating", "rating"],
    ["audioFormat", "format"],
    ["duration", "duration"],
  ] as const;
  for (const dictionary of Object.values(dictionaries)) {
    for (const [column, field] of pairs) {
      expect(dictionary[`playlist.column.${column}`]).toBe(
        dictionary[`musicInfo.field.${field}`],
      );
    }
  }
});
