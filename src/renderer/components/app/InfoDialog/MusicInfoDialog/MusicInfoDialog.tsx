import { useSyncExternalStore } from "react";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { MusicInfoDialogSession } from "./MusicInfoDialogSession";

/**
 * Track info dialog (track row menu → "Song info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this
 * opens). Reads the tracks from `musicInfoStore` and mounts one
 * `MusicInfoDialogSession` while it holds tracks; the session keys its
 * content on the track ids, so a new track set always starts from a fresh
 * form and artwork state.
 */
export const MusicInfoDialog = () => {
  const state = useSyncExternalStore(
    musicInfoStore.subscribe,
    musicInfoStore.getSnapshot,
  );
  if (state === null) {
    return null;
  }

  return <MusicInfoDialogSession state={state} />;
};
