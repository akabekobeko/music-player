import { useSyncExternalStore } from "react";
import { useMatch, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import {
  ARTIST_NAME_PATTERN,
  UNKNOWN_ARTIST_PATH,
} from "@/pages/artists/artistPath";

/**
 * Artist / album removal confirmation (context or row menu → "Remove from
 * library"), mounted once in the AppLayout (the menu that started the flow
 * is gone by the time this opens).
 *
 * Confirming invokes the matching removal channel; views refetch via the
 * `mp:library:changed` broadcast. Removing the artist currently shown in
 * the Artist view also navigates back to the unselected state, so the
 * content pane never lingers on a vanished artist.
 */
export const LibraryRemoveDialog = () => {
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

  const name =
    target === null
      ? ""
      : target.kind === "artist"
        ? target.artist !== ""
          ? target.artist
          : t("artist.unknown")
        : target.album;

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          libraryRemoveStore.close();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("library.removeTitle")}</DialogTitle>
          <DialogDescription className="whitespace-pre-line break-all">
            {t(
              target?.kind === "artist"
                ? "library.removeArtistMessage"
                : "library.removeAlbumMessage",
              { name },
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => libraryRemoveStore.close()}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => void confirm()}>
            {t("library.remove")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
