import type {
  IpcError,
  Music,
  MusicInfoCandidate,
  MusicPictureInput,
  UpdateMusicsSummary,
} from "@mp/ipc";
import { useForm, useStore } from "@tanstack/react-form";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import { type MusicInfoFormValues, musicInfoSchema } from "./musicInfoSchema";
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
 * (`docs/specs/v1.1/features/apply-flow.md`). Mounted once per track set —
 * `MusicInfoDialogSession` keys the content on the tracks — so every piece
 * of state starts fresh with the tracks it belongs to, and stepping to a
 * neighbouring track with the header arrows discards unsaved edits with
 * the rest of it (`docs/specs/v1.1/features/music-info-dialog.md`,
 * previous / next navigation).
 *
 * Apply is enabled only when something would change and what would be
 * saved is valid. The values that would be saved are the form values with
 * the adopted fetched values swapped in (`effectiveValuesOf`); they are
 * validated as a whole by the schema, so a change edited back to its
 * initial text counts as unchanged, an invalid current value whose fetched
 * value is adopted does not block, and an out-of-range fetched value does.
 * Both verdicts come out of one store selector as booleans, so typing
 * re-renders the dialog only when a verdict flips.
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
  /** Bumped per fetch and on close so a late answer is ignored. */
  const fetchSession = useRef(0);
  // A preview's object URL is released once it is no longer shown: when
  // another pick or a removal replaces it, and when the component goes,
  // whatever took it away (Cancel, Esc / backdrop, a successful apply, or a
  // step to another track).
  useEffect(
    () => () => {
      if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );
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

  const selectFile = (file: File): void => {
    if (IMAGE_EXTENSION_BY_MIME[file.type.toLowerCase()] === undefined) {
      setUnsupportedImageType(file.type === "" ? file.name : file.type);
      return;
    }

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
    setPreviewUrl(null);
    setUnsupportedImageType(null);
    setPictureChange(hasArtwork ? "clear" : null);
    setAdoptPicture(fetchedImageUrl !== null);
  };

  /** Only a single track can be looked up; never while busy. */
  const canFetch = musics.length === 1 && !fetching && !applying;

  /**
   * Look the track up. A repeat fetch keeps the previous candidate on
   * screen until the answer arrives (no flicker of the compare view), then
   * replaces it and recomputes the adopt defaults from the form as edited;
   * a failed or empty repeat keeps the previous candidate and shows the
   * message.
   */
  const fetchCandidate = async (): Promise<void> => {
    const single = musics[0];
    if (!canFetch || single === undefined) {
      return;
    }

    fetchSession.current += 1;
    const session = fetchSession.current;
    setFetching(true);
    setFetchError(null);
    setNotFound(false);
    const result = await lookupMusic({ musicId: single.id });
    if (session !== fetchSession.current) {
      return;
    }

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

  /**
   * Closing while a lookup is in flight is allowed: the answer is dropped
   * (the session moves on) and Main finishes the request on its own. Only
   * an apply pins the dialog open.
   */
  const close = (): void => {
    if (applying) {
      return;
    }

    fetchSession.current += 1;
    musicInfoStore.close();
  };

  /**
   * Step to the previous / next track of the list the dialog was opened
   * from (header arrows). The store swaps the track and the session
   * remounts the content, so unsaved edits and a running lookup go with
   * it. Like closing, refused while an apply runs.
   */
  const showPrevious = (): void => {
    if (!applying) {
      musicInfoStore.previous();
    }
  };

  const showNext = (): void => {
    if (!applying) {
      musicInfoStore.next();
    }
  };

  const verdict = useStore(form.store, (state) => {
    const effective = effectiveValuesOf(state.values, candidate, adopted);
    return {
      changed: Object.keys(diffFormValues(initialValues, effective)).length > 0,
      valid:
        musicInfoSchema.safeParse(effective).success &&
        !(musics.length === 1 && (effective.title ?? "").trim() === ""),
    };
  });
  const pictureChanged = adoptPicture || pictureChange !== null;
  const canApply =
    (verdict.changed || pictureChanged) &&
    verdict.valid &&
    !applying &&
    !fetching;

  const apply = async (): Promise<void> => {
    if (!canApply) {
      return;
    }

    const patch = toMusicTagPatch(
      diffFormValues(
        initialValues,
        effectiveValuesOf(form.state.values, candidate, adopted),
      ),
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
    fetchCandidate,
    setAdoptedField,
    setAdoptPicture,
    onFieldEdited,
    showPrevious,
    showNext,
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
