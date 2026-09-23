import { useSyncExternalStore } from "react";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { MusicInfoDialogContent } from "./MusicInfoDialogContent";

/**
 * Track info dialog (track row menu → "Song info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this
 * opens). Reads the tracks from `musicInfoStore` and mounts one
 * `MusicInfoDialogContent` per track set — keyed on the ids, so a new
 * session always starts from a fresh form and artwork state.
 */
export const MusicInfoDialog = () => {
  const musics = useSyncExternalStore(
    musicInfoStore.subscribe,
    musicInfoStore.getSnapshot,
  );
  const primary = musics?.[0];
  if (musics === null || primary === undefined) {
    return null;
  }

  return (
    <MusicInfoDialogContent
      key={musics.map((music) => music.id).join(",")}
      musics={musics}
      primary={primary}
    />
  );
};
