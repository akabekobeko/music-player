import type { Music } from "@mp/ipc";
import { formValuesOf } from "./formValuesOf";
import type { MusicInfoFormValues } from "./musicInfoSchema";

/**
 * Initial form values of one or more tracks
 * (`docs/specs/v1.1/features/multi-edit.md`, merged display): a field whose
 * stored value is the same on every track shows that value; a field that
 * differs on any track is "mixed" (`null`), rendered as an empty input with
 * the "Mixed" placeholder and left out of the patch until edited.
 *
 * Each track's values are compared as the text its inputs would show, which
 * maps stored values one to one (`null` year vs `2001` differ, text must be
 * identical). A single track never yields a mixed field, so the single and
 * the multi-track edit share this one path.
 *
 * @param musics - Tracks under edit; never empty.
 * @returns The form's default values.
 */
export const mergeMusics = (musics: readonly Music[]): MusicInfoFormValues => {
  const [first, ...rest] = musics.map(formValuesOf);
  if (first === undefined) {
    throw new Error("mergeMusics needs at least one track");
  }

  const merged: { -readonly [K in keyof MusicInfoFormValues]: string | null } =
    { ...first };
  for (const key of Object.keys(first) as Array<keyof MusicInfoFormValues>) {
    if (rest.some((values) => values[key] !== first[key])) {
      merged[key] = null;
    }
  }

  return merged;
};
