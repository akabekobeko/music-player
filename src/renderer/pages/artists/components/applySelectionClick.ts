/**
 * Multi-select model for track lists
 * (`docs/specs/v1.0/features/artist-view.md`): click selects one, Cmd/Ctrl
 * toggles, Shift extends the range from the last plain-clicked anchor.
 * Groundwork for batch "Add to playlist" (Phase 6).
 */
export type SelectionState = {
  readonly selectedIds: ReadonlySet<number>;
  /** Range base for Shift-clicks (the last plain click). */
  readonly anchorId: number | null;
};

/** No selection. */
export const EMPTY_SELECTION: SelectionState = {
  selectedIds: new Set(),
  anchorId: null,
};

/**
 * Apply one click to the selection.
 *
 * @param state - Current selection.
 * @param orderedIds - Track ids in display order (range resolution).
 * @param targetId - Clicked track id.
 * @param modifiers - Shift / Cmd(Ctrl) state of the click.
 * @returns The next selection.
 */
export const applySelectionClick = (
  state: SelectionState,
  orderedIds: readonly number[],
  targetId: number,
  modifiers: { readonly shift: boolean; readonly meta: boolean },
): SelectionState => {
  if (modifiers.shift && state.anchorId !== null) {
    const from = orderedIds.indexOf(state.anchorId);
    const to = orderedIds.indexOf(targetId);
    if (from === -1 || to === -1) {
      return { selectedIds: new Set([targetId]), anchorId: targetId };
    }

    const [start, end] = from <= to ? [from, to] : [to, from];
    const range = orderedIds.slice(start, end + 1);
    // Cmd+Shift extends the existing selection; plain Shift replaces it.
    const base = modifiers.meta ? [...state.selectedIds] : [];
    return {
      selectedIds: new Set([...base, ...range]),
      anchorId: state.anchorId,
    };
  }

  if (modifiers.meta) {
    const next = new Set(state.selectedIds);
    if (next.has(targetId)) {
      next.delete(targetId);
    } else {
      next.add(targetId);
    }

    return { selectedIds: next, anchorId: targetId };
  }

  return { selectedIds: new Set([targetId]), anchorId: targetId };
};
