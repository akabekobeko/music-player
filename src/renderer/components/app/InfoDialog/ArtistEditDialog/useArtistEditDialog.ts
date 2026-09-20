import type { IpcError } from "@mp/ipc";
import { useState, useSyncExternalStore } from "react";
import { artistEditStore } from "@/features/library/artistEditStore";
import { setArtistInitial } from "@/features/library/setArtistInitial";
import { setArtistPicture } from "@/features/library/setArtistPicture";
import { artistInitialOf } from "@/pages/artists/components/ArtistListPanel/artistInitialOf";
import {
  type Initial,
  OTHER_INITIAL,
} from "@/pages/artists/components/ArtistListPanel/initials";

/**
 * Logic of `ArtistEditDialog` (context / row menu → "Artist Info"): the
 * artist under edit (from the store), the picked file with its object-URL
 * preview, the initial choice, and the apply / close flow. The component
 * only renders what this hook returns.
 *
 * The initial tile shown as selected is the stored choice, or the automatic
 * classification when none is stored, until the user picks another tile.
 * Applying stores an A–Z pick (overriding the classification) and clears
 * the stored choice on "Other" — only when the pick actually changes what
 * the library holds.
 */
export const useArtistEditDialog = () => {
  const target = useSyncExternalStore(
    artistEditStore.subscribe,
    artistEditStore.getSnapshot,
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Keyed by artist name so a pick never leaks into another artist's session.
  const [picked, setPicked] = useState<{
    readonly name: string;
    readonly initial: Initial;
  } | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<IpcError | null>(null);

  const pickedInitial =
    picked !== null && target !== null && picked.name === target.name
      ? picked.initial
      : null;
  const selectedInitial =
    pickedInitial ??
    (target !== null
      ? artistInitialOf({
          name: target.name,
          musicCount: target.musicCount,
          picturePath: target.picturePath,
          initial: target.initial,
        })
      : OTHER_INITIAL);
  /** Value the library would hold after applying the current pick. */
  const nextStoredInitial =
    selectedInitial === OTHER_INITIAL ? null : selectedInitial;
  const initialChanged =
    target !== null && nextStoredInitial !== target.initial;

  const selectFile = (next: File): void => {
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setError(null);
  };

  const selectInitial = (next: Initial): void => {
    if (target !== null) {
      setPicked({ name: target.name, initial: next });
      setError(null);
    }
  };

  const close = (): void => {
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl(null);
    setPicked(null);
    setApplying(false);
    setError(null);
    artistEditStore.close();
  };

  const apply = async (): Promise<void> => {
    if (target === null || applying || (file === null && !initialChanged)) {
      return;
    }

    setApplying(true);
    if (file !== null) {
      const failure = await setArtistPicture(target.name, file);
      if (failure !== null) {
        setError(failure);
        setApplying(false);
        return;
      }
    }

    if (initialChanged) {
      const failure = await setArtistInitial(target.name, nextStoredInitial);
      if (failure !== null) {
        setError(failure);
        setApplying(false);
        return;
      }
    }

    close();
  };

  return {
    target,
    /** Object URL of the picked file, shown instead of the current picture. */
    previewUrl,
    /** Tile to show as the current choice. */
    selectedInitial,
    canApply: (file !== null || initialChanged) && !applying,
    error,
    selectFile,
    selectInitial,
    apply,
    close,
  };
};
