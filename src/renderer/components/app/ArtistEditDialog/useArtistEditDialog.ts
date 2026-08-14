import type { IpcError } from "@mp/ipc";
import { useState, useSyncExternalStore } from "react";
import { artistEditStore } from "@/features/library/artistEditStore";
import { setArtistPicture } from "@/features/library/setArtistPicture";

/**
 * Logic of `ArtistEditDialog`: the artist under edit (from the store), the
 * picked file with its object-URL preview, and the apply / close flow. The
 * component only renders what this hook returns.
 */
export const useArtistEditDialog = () => {
  const target = useSyncExternalStore(
    artistEditStore.subscribe,
    artistEditStore.getSnapshot,
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<IpcError | null>(null);

  const selectFile = (next: File): void => {
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setError(null);
  };

  const close = (): void => {
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl(null);
    setApplying(false);
    setError(null);
    artistEditStore.close();
  };

  const apply = async (): Promise<void> => {
    if (target === null || file === null || applying) {
      return;
    }

    setApplying(true);
    const failure = await setArtistPicture(target.name, file);
    if (failure !== null) {
      setError(failure);
      setApplying(false);
      return;
    }

    close();
  };

  return {
    target,
    /** Object URL of the picked file, shown instead of the current picture. */
    previewUrl,
    canApply: file !== null && !applying,
    error,
    selectFile,
    apply,
    close,
  };
};
