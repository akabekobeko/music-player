/**
 * Position of an info dialog's subject in the list it was opened from
 * (`docs/specs/v1.1/features/music-info-dialog.md`, previous / next
 * navigation): the header arrows step through `siblings` from `index`.
 * Shared by the song and the album info stores; the list is a snapshot
 * taken when the dialog opened.
 */
export type DialogNavigation<T> = {
  /** The list the subject was opened from, in display order. */
  readonly siblings: readonly T[];
  /** The subject's position in `siblings`; always in range. */
  readonly index: number;
};

/** The subject's neighbours: `null` at either end or without a list. */
export type Adjacent<T> = {
  readonly previous: T | null;
  readonly next: T | null;
};

/**
 * Locate the subject in the list it was opened from.
 *
 * @param siblings - The list; `undefined` when the caller has none.
 * @param isSubject - Identifies the subject among the siblings.
 * @returns The navigation, or `null` without a list or a matching entry.
 */
export const navigationOf = <T>(
  siblings: readonly T[] | undefined,
  isSubject: (item: T) => boolean,
): DialogNavigation<T> | null => {
  if (siblings === undefined) {
    return null;
  }

  const index = siblings.findIndex(isSubject);
  return index >= 0 ? { siblings, index } : null;
};

/**
 * The subject's neighbours.
 *
 * @param navigation - The current navigation, or `null` without a list.
 * @returns The previous and next entries, `null` where there is none.
 */
export const adjacentOf = <T>(
  navigation: DialogNavigation<T> | null,
): Adjacent<T> =>
  navigation === null
    ? { previous: null, next: null }
    : {
        previous: navigation.siblings[navigation.index - 1] ?? null,
        next: navigation.siblings[navigation.index + 1] ?? null,
      };

/**
 * Step to a neighbour.
 *
 * @param navigation - The current navigation, or `null` without a list.
 * @param step - `-1` for the previous entry, `1` for the next.
 * @returns The navigation moved by `step`, or `null` when there is no such entry.
 */
export const movedBy = <T>(
  navigation: DialogNavigation<T> | null,
  step: -1 | 1,
): DialogNavigation<T> | null => {
  if (navigation === null) {
    return null;
  }

  const index = navigation.index + step;
  return index >= 0 && index < navigation.siblings.length
    ? { siblings: navigation.siblings, index }
    : null;
};

/**
 * The navigation state an info store owns: where its subject sits in the
 * list it was opened from. The store keeps the subject itself; this keeps
 * the position and moves it, through the pure functions above.
 */
export class DialogNavigator<T> {
  #navigation: DialogNavigation<T> | null = null;

  /**
   * Locate the subject in the list it was opened from; without a list or a
   * matching entry the arrows are disabled.
   *
   * @param siblings - The list, or `undefined` when the caller has none.
   * @param isSubject - Identifies the subject among the siblings.
   */
  locate(
    siblings: readonly T[] | undefined,
    isSubject: (item: T) => boolean,
  ): void {
    this.#navigation = navigationOf(siblings, isSubject);
  }

  /** Forget the list (the dialog closed). */
  reset(): void {
    this.#navigation = null;
  }

  /**
   * The subject's neighbours.
   *
   * @returns The previous and next entries, `null` where there is none.
   */
  adjacent(): Adjacent<T> {
    return adjacentOf(this.#navigation);
  }

  /**
   * Step to a neighbour.
   *
   * @param step - `-1` for the previous entry, `1` for the next.
   * @returns The entry stepped to, or `null` (position unchanged) when
   * there is none.
   */
  move(step: -1 | 1): T | null {
    const moved = movedBy(this.#navigation, step);
    const item = moved?.siblings[moved.index];
    if (moved === null || item === undefined) {
      return null;
    }

    this.#navigation = moved;
    return item;
  }
}
