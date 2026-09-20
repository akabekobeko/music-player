import { useState, useSyncExternalStore } from "react";
import { useT } from "@/features/i18n/useT";
import { addToPlaylistStore } from "@/features/playlist/addToPlaylistStore";
import { appendMusicsToPlaylist } from "@/features/playlist/playlistCommands/appendMusicsToPlaylist";
import { createStaticPlaylist } from "@/features/playlist/playlistCommands/createStaticPlaylist";
import { toastStore } from "@/features/toast/toastStore";

/**
 * Logic of `NewPlaylistDialog`: the tracks stashed by the "Add to playlist
 * ▸ New playlist" flow (from the store), the name draft, and the confirm /
 * cancel flow. Confirming creates the playlist (the default name when the
 * draft is blank) and appends the stashed tracks in one go, then reports
 * the result as a toast. `useT` is called here because the default name
 * and the toast text are part of the logic, not of the markup.
 */
export const useNewPlaylistDialog = () => {
  const t = useT();
  const pending = useSyncExternalStore(
    addToPlaylistStore.subscribe,
    addToPlaylistStore.getSnapshot,
  );
  const [name, setName] = useState("");

  const confirm = async (): Promise<void> => {
    if (pending === null) {
      return;
    }

    const trimmed = name.trim();
    const created = await createStaticPlaylist(
      trimmed !== "" ? trimmed : t("playlist.defaultName"),
    );
    addToPlaylistStore.close();
    setName("");
    if (
      created !== null &&
      (await appendMusicsToPlaylist(created.id, pending))
    ) {
      toastStore.show(
        t("playlist.addedToast", { count: pending.length, name: created.name }),
      );
    }
  };

  const cancel = (): void => {
    addToPlaylistStore.close();
    setName("");
  };

  return {
    /** `true` while the flow has stashed tracks, i.e. the dialog is open. */
    open: pending !== null,
    name,
    setName,
    confirm,
    cancel,
  };
};
