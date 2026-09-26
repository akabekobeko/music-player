import type {
  IpcError,
  Music,
  MusicInfoCandidate,
  MusicPictureInput,
  UpdateMusicsSummary,
} from "@mp/ipc";
import { useForm, useStore } from "@tanstack/react-form";
import { useMemo, useState, useSyncExternalStore } from "react";
import { lookupMusic } from "@/features/library/lookupMusic";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { updateMusics } from "@/features/library/updateMusics";
import { updateProgressStore } from "@/features/library/updateProgressStore";
import {
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { IMAGE_EXTENSION_BY_MIME } from "../../../../../shared/constants";
import {
  type AdoptedFields,
  type CandidateField,
  isCandidateField,
  NO_ADOPTED,
} from "./candidateFields";
import { defaultAdoptedOf } from "./defaultAdoptedOf";
import { diffFormValues } from "./diffFormValues";
import { effectiveValuesOf } from "./effectiveValuesOf";
import { mergeMusics } from "./mergeMusics";
import {
  MUSIC_INFO_FIELDS,
  type MusicInfoFormValues,
  musicInfoSchema,
} from "./musicInfoSchema";
import { toDataUrl } from "./toDataUrl";
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
 * Apply is enabled only when something would change and nothing that
 * would be saved is invalid. The values that would be saved are the form
 * values with the adopted fetched values swapped in (`effectiveValuesOf`),
 * so a change edited back to its initial text counts as unchanged and an
 * invalid current value whose fetched value is adopted does not block.
 *
 * Several tracks open on their merged values
 * (`docs/specs/v1.1/features/multi-edit.md`): a field that differs between
 * them is "mixed" (`null`) and stays out of the patch until edited; the
 * artwork shows only when every track has the same one, and a pick or a
 * removal applies to all of them.
 *
 * The fetch (`docs/specs/v1.2/features/music-info-fetch.md`) is a single
 * track affair: it looks the track up on MusicBrainz and holds the
 * candidate, the adopt state per field and the cover choice
 * (`docs/specs/v1.2/features/music-info-compare.md`,
 * `docs/specs/v1.2/features/artwork-compare.md`) until the dialog closes.
 *
 * @param musics - Tracks under edit; never empty.
 */
export const useMusicInfoDialog = (musics: readonly Music[]) => {
  const [initialValues] = useState(() => mergeMusics(musics));
  const form = useForm({
    defaultValues: initialValues,
    validators: { onChange: musicInfoSchema },
  });
  const values = useStore(form.store, (state) => state.values);
  const fieldMeta = useStore(form.store, (state) => state.fieldMeta);
  const isValid = useStore(form.store, (state) => state.isValid);

  const [pictureChange, setPictureChange] = useState<PictureChange>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [unsupportedImageType, setUnsupportedImageType] = useState<
    string | null
  >(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<IpcError | null>(null);
  const [failures, setFailures] = useState<UpdateMusicsSummary["failed"]>([]);
  const [candidate, setCandidate] = useState<MusicInfoCandidate | null>(null);
  const [adopted, setAdopted] = useState<AdoptedFields>(NO_ADOPTED);
  const [adoptPicture, setAdoptPicture] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<IpcError | null>(null);
  const [notFound, setNotFound] = useState(false);
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
  /** Artwork to show on the current side: the pick's preview, else the shared one. */
  const imageUrl =
    previewUrl ??
    (pictureChange === "clear" || sharedPicturePath === null
      ? null
      : toMediaFileUrl(sharedPicturePath));
  /** The fetched cover for `<img src>`; encoded once per candidate. */
  const fetchedImageUrl = useMemo(
    () =>
      candidate?.picture === null || candidate === null
        ? null
        : toDataUrl(candidate.picture),
    [candidate],
  );

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
    // A picked file is the user's choice over the fetched cover.
    setAdoptPicture(false);
  };

  /**
   * Drop the picked file; with an artwork on any track this also asks for
   * its removal, without one it merely returns to "untouched". With a
   * fetched cover at hand, removing the current one means "put the fetched
   * one there instead" (the user unticks it to really clear).
   */
  const removeArtwork = (): void => {
    revokePreview();
    setUnsupportedImageType(null);
    setPictureChange(hasArtwork ? "clear" : null);
    setAdoptPicture(fetchedImageUrl !== null);
  };

  /** Only a single track can be looked up; never while busy. */
  const canFetch = musics.length === 1 && !fetching && !applying;

  /**
   * Look the track up. A repeat fetch discards the previous candidate and
   * adopt state but keeps the form as edited.
   */
  const fetch = async (): Promise<void> => {
    const single = musics[0];
    if (!canFetch || single === undefined) {
      return;
    }

    setFetching(true);
    setCandidate(null);
    setAdopted(NO_ADOPTED);
    setAdoptPicture(false);
    setFetchError(null);
    setNotFound(false);
    const result = await lookupMusic({ musicId: single.id });
    setFetching(false);
    if (!result.ok) {
      setFetchError(result.error);
      return;
    }

    if (result.value === null) {
      setNotFound(true);
      return;
    }

    setCandidate(result.value);
    setAdopted(defaultAdoptedOf(form.state.values, result.value));
    setAdoptPicture(result.value.picture !== null && imageUrl === null);
  };

  const setAdoptedField = (field: CandidateField, on: boolean): void => {
    setAdopted((previous) =>
      previous[field] === on ? previous : { ...previous, [field]: on },
    );
  };

  /** Editing the current value means the user prefers it: unadopt. */
  const onFieldEdited = (name: keyof MusicInfoFormValues): void => {
    if (candidate !== null && isCandidateField(name)) {
      setAdoptedField(name, false);
    }
  };

  const close = (): void => {
    if (applying || fetching) {
      return;
    }

    revokePreview();
    musicInfoStore.close();
  };

  const effectiveValues = effectiveValuesOf(values, candidate, adopted);
  const valuesChanged =
    Object.keys(diffFormValues(initialValues, effectiveValues)).length > 0;
  const pictureChanged = adoptPicture || pictureChange !== null;
  // An adopted field is saved from the candidate, so an error on its
  // current input must not block; every other field's error does.
  const hasBlockingError =
    candidate === null
      ? !isValid
      : MUSIC_INFO_FIELDS.some(
          (name) =>
            !(isCandidateField(name) && adopted[name]) &&
            (fieldMeta[name]?.errors ?? []).some(
              (entry) => entry !== undefined,
            ),
        );
  const canApply =
    (valuesChanged || pictureChanged) &&
    !hasBlockingError &&
    !applying &&
    !fetching;

  const apply = async (): Promise<void> => {
    if (!canApply) {
      return;
    }

    const patch = toMusicTagPatch(
      diffFormValues(initialValues, effectiveValues),
    );
    const picture =
      adoptPicture && candidate?.picture !== null && candidate !== null
        ? candidate.picture
        : await pictureInputOf(pictureChange);
    if (stopsPlayback) {
      commands.stop();
    }

    setApplying(true);
    setError(null);
    setFailures([]);
    setFetchError(null);
    setNotFound(false);
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
    imageUrl,
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
    candidate,
    adopted,
    adoptPicture,
    fetchedImageUrl,
    fetching,
    canFetch,
    fetchError,
    notFound,
    selectFile,
    removeArtwork,
    apply,
    close,
    fetch,
    setAdoptedField,
    setAdoptPicture,
    onFieldEdited,
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
