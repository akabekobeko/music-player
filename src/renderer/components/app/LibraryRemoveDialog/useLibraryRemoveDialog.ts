import { useSyncExternalStore } from "react";
import { useMatch, useNavigate } from "react-router";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import {
  ARTIST_NAME_PATTERN,
  UNKNOWN_ARTIST_PATH,
} from "@/pages/artists/artistPath";

/**
 * Logic of `LibraryRemoveDialog`: the removal target (from the store) and
 * the confirm / close flow. Confirming invokes the matching removal
 * channel; views refetch via the `mp:library:changed` broadcast. Removing
 * the artist currently shown in the Artist view also navigates back to the
 * unselected state, so the content pane never lingers on a vanished artist.
 */
export const useLibraryRemoveDialog = () => {
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

  return { target, confirm, close };
};
