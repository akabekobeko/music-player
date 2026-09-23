import type { Music, UpdatedMusic } from "@mp/ipc";
import { albumKeyOf } from "@/features/library/groupAlbums/albumKeyOf";

/**
 * Which album the detail pane shows after an apply
 * (`docs/specs/v1.1/features/route-follow.md`):
 *
 * - none of the selected album's tracks was updated: the same key
 * - the updated tracks now share one album key: that key
 * - they split across several: the same key — the pane closes on the
 *   refetch if the album vanished from the grid (the v1.0 rule), and stays
 *   while it keeps a track
 *
 * @param selectedKey - `albumKey` of the album in the detail pane.
 * @param targets - The dialog's tracks before the write.
 * @param updated - The apply's updated tracks.
 * @returns The `albumKey` to select from now on.
 */
export const nextAlbumKeyOf = (
  selectedKey: string,
  targets: readonly Music[],
  updated: readonly UpdatedMusic[],
): string => {
  const formerKeyById = new Map(
    targets.map((music) => [music.id, albumKeyOf(music)]),
  );
  const affected = updated.filter(
    (entry) => formerKeyById.get(entry.music.id) === selectedKey,
  );
  const keys = new Set(affected.map((entry) => entry.albumKey));
  const [key] = keys;
  return keys.size === 1 && key !== undefined ? key : selectedKey;
};
