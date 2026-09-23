import type {
  IpcError,
  Music,
  MusicPictureInput,
  UpdateMusicsSummary,
} from "@mp/ipc";
import { useForm, useStore } from "@tanstack/react-form";
import { useState, useSyncExternalStore } from "react";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { updateMusics } from "@/features/library/updateMusics";
import { updateProgressStore } from "@/features/library/updateProgressStore";
import {
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { IMAGE_EXTENSION_BY_MIME } from "../../../../../shared/IMAGE_EXTENSION_BY_MIME";
import { diffFormValues } from "./diffFormValues";
import { mergeMusics } from "./mergeMusics";
import { musicInfoSchema } from "./musicInfoSchema";
import { toMusicTagPatch } from "./toMusicTagPatch";

/**
 * Artwork edit, kept outside the form
 * (`docs/specs/v1.1/features/artwork-edit.md`): untouched, a picked file
 * to embed, or the removal of the current artwork.
 */
export type PictureChange = null | { readonly file: File } | "clear";

/**
 * Logic of the music info dialog (`docs/specs/v1.1/features/music-info-dialog.md`):
 * the tag form (TanStack Form validated by the zod schema on every change),
 * the artwork change with its preview, and the apply / close flow
 * (`docs/specs/v1.1/features/apply-flow.md`). Mounted once per dialog
 * session — `MusicInfoDialog` keys the content on the tracks — so every
 * piece of state starts fresh with the tracks it belongs to.
 *
 * Apply is enabled only when something changed (a form value differs from
 * its default, or the artwork was edited) and nothing is invalid. A change
 * edited back to its initial text counts as unchanged (`isDefaultValue`,
 * never the sticky `isDirty`).
 *
 * Several tracks open on their merged values
 * (`docs/specs/v1.1/features/multi-edit.md`): a field that differs between
 * them is "mixed" (`null`) and stays out of the patch until edited; the
 * artwork shows only when every track has the same one, and a pick or a
 * removal applies to all of them.
 *
 * @param musics - Tracks under edit; never empty.
 */
export const useMusicInfoDialog = (musics: readonly Music[]) => {
  const [initialValues] = useState(() => mergeMusics(musics));
  const form = useForm({
    defaultValues: initialValues,
    validators: { onChange: musicInfoSchema },
  });
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const isValid = useStore(form.store, (state) => state.isValid);

  const [pictureChange, setPictureChange] = useState<PictureChange>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [unsupportedImageType, setUnsupportedImageType] = useState<
    string | null
  >(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<IpcError | null>(null);
  const [failures, setFailures] = useState<UpdateMusicsSummary["failed"]>([]);
  const progress = useSyncExternalStore(
    updateProgressStore.subscribe,
    updateProgressStore.getSnapshot,
  );
  const { current } = usePlayerState();
  const commands = usePlayerCommands();

  /** The current track is among the targets — applying stops playback. */
  const stopsPlayback =
    current !== null && musics.some((music) => music.id === current.id);
  /** Some target has an artwork, so Remove has something to clear. */
  const hasArtwork = musics.some((music) => music.picturePath !== null);
  /** The artwork every target shares, `null` when absent or mixed. */
  const sharedPicturePath = sharedPicturePathOf(musics);

  const revokePreview = (): void => {
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const selectFile = (file: File): void => {
    if (IMAGE_EXTENSION_BY_MIME[file.type.toLowerCase()] === undefined) {
      setUnsupportedImageType(file.type === "" ? file.name : file.type);
      return;
    }

    revokePreview();
    setUnsupportedImageType(null);
    setPictureChange({ file });
    setPreviewUrl(URL.createObjectURL(file));
  };

  /**
   * Drop the picked file; with an artwork on any track this also asks for
   * its removal, without one it merely returns to "untouched".
   */
  const removeArtwork = (): void => {
    revokePreview();
    setUnsupportedImageType(null);
    setPictureChange(hasArtwork ? "clear" : null);
  };

  const close = (): void => {
    if (applying) {
      return;
    }

    revokePreview();
    musicInfoStore.close();
  };

  const canApply =
    (!isDefaultValue || pictureChange !== null) && isValid && !applying;

  const apply = async (): Promise<void> => {
    if (!canApply) {
      return;
    }

    const patch = toMusicTagPatch(
      diffFormValues(initialValues, form.state.values),
    );
    const picture = await pictureInputOf(pictureChange);
    if (stopsPlayback) {
      commands.stop();
    }

    setApplying(true);
    setError(null);
    setFailures([]);
    updateProgressStore.reset();
    const result = await updateMusics({
      musicIds: musics.map((music) => music.id),
      patch,
      ...(picture === undefined ? {} : { picture }),
    });
    setApplying(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Whatever was written reaches the queue / current track at once (the
    // views refetch on the library broadcast) and the views that follow a
    // changed artist or album — even when other tracks failed.
    const { updated } = result.value;
    if (updated.length > 0) {
      commands.updateMusics(updated.map((entry) => entry.music));
      musicInfoStore.notifyApplied({ targets: musics, updated });
    }

    if (result.value.failed.length > 0) {
      setFailures(result.value.failed);
      return;
    }

    revokePreview();
    musicInfoStore.close();
  };

  return {
    form,
    /** Artwork to show: the picked file's preview, else the shared one. */
    imageUrl:
      previewUrl ??
      (pictureChange === "clear" || sharedPicturePath === null
        ? null
        : toMediaFileUrl(sharedPicturePath)),
    /** Remove has something to undo: a pick, or an artwork not yet removed. */
    canRemoveArtwork:
      pictureChange !== null ? pictureChange !== "clear" : hasArtwork,
    unsupportedImageType,
    stopsPlayback,
    applying,
    /** Progress of the running apply, `null` before its first push. */
    progress: applying ? progress : null,
    canApply,
    error,
    failures,
    selectFile,
    removeArtwork,
    apply,
    close,
  };
};

/**
 * The artwork path common to every track, or `null` when a track has none
 * or they differ (the mixed artwork shows the placeholder,
 * `docs/specs/v1.1/features/artwork-edit.md`).
 */
const sharedPicturePathOf = (musics: readonly Music[]): string | null => {
  const first = musics[0]?.picturePath ?? null;
  return first !== null && musics.every((music) => music.picturePath === first)
    ? first
    : null;
};

/**
 * Turn the artwork change into the IPC's `picture` field: absent when
 * untouched, `null` for a removal, the file's bytes for a replacement.
 */
const pictureInputOf = async (
  change: PictureChange,
): Promise<MusicPictureInput | null | undefined> => {
  if (change === null) {
    return undefined;
  }

  if (change === "clear") {
    return null;
  }

  return {
    mimeType: change.file.type,
    data: new Uint8Array(await change.file.arrayBuffer()),
  };
};
