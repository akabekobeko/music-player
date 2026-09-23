import type { MusicInfoFormValues } from "./musicInfoSchema";

/**
 * Pick the fields whose current value differs from the initial one
 * (`docs/specs/v1.1/features/multi-edit.md`, change detection).
 *
 * A plain `!==` per field is the whole rule: a mixed field (`null`) left
 * alone is unchanged, a mixed field typed into (even emptied again) is
 * changed, and editing a value back to its initial text is unchanged.
 *
 * @param initial - Default values the form opened with.
 * @param current - Values as edited.
 * @returns Only the changed fields, with their current (string) values.
 */
export const diffFormValues = (
  initial: MusicInfoFormValues,
  current: MusicInfoFormValues,
): Partial<Record<keyof MusicInfoFormValues, string>> => {
  const changed: Partial<Record<keyof MusicInfoFormValues, string>> = {};
  for (const key of Object.keys(initial) as Array<keyof MusicInfoFormValues>) {
    const value = current[key];
    if (value !== initial[key] && value !== null) {
      changed[key] = value;
    }
  }

  return changed;
};
