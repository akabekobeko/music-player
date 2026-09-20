import { useSyncExternalStore } from "react";
import { useMatch, useNavigate } from "react-router";
import { useT } from "@/features/i18n/useT";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import {
  ARTIST_NAME_PATTERN,
  UNKNOWN_ARTIST_PATH,
} from "@/pages/artists/artistPath";

/**
 * Logic of `LibraryRemoveDialog`: the removal target (from the store), its
 * display name, and the confirm / close flow. `useT` is called here because
 * the unknown-artist bucket's name is part of the logic, not of the markup.
 * Confirming invokes the matching removal
 * channel; views refetch via the `mp:library:changed` broadcast. Removing
 * the artist currently shown in the Artist view also navigates back to the
 * unselected state, so the content pane never lingers on a vanished artist.
 */
export const useLibraryRemoveDialog = () => {
  const t = useT();
  const navigate = useNavigate();
  const target = useSyncExternalStore(
    libraryRemoveStore.subscribe,
    libraryRemoveStore.getSnapshot,
  );
  const namedArtist = useMatch(ARTIST_NAME_PATTERN)?.params.artistName;
  const selectedArtist =
    useMatch(UNKNOWN_ARTIST_PATH) !== null ? "" : namedArtist;

  const confirm = async (): Promise<void> => {
    if (target === null) {
      return;
    }

    if (target.kind === "artist") {
      await window.mp.library.removeArtist({ artist: target.artist });
      if (selectedArtist === target.artist) {
        navigate("/artists");
      }
    } else {
      await window.mp.library.removeAlbum({ albumKey: target.albumKey });
    }

    libraryRemoveStore.close();
  };

  const close = (): void => {
    libraryRemoveStore.close();
  };

  /** Name of the artist / album under removal; `""` while closed. */
  const name =
    target === null
      ? ""
      : target.kind === "artist"
        ? target.artist !== ""
          ? target.artist
          : t("artist.unknown")
        : target.album;

  return { target, name, confirm, close };
};
