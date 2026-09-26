/**
 * Classes marking the side that will be saved in the compare view
 * (`docs/specs/v1.2/features/adopt-color.md`): the adopt-coloured border,
 * and for inputs the same hue on the focus glow so focusing an adopted
 * input does not switch it to the neutral glow. `aria-invalid` keeps
 * winning on inputs (its variant is more specific), so an invalid left
 * input stays red even while it is the side that would be saved.
 */
export const ADOPT_INPUT_CLASSES =
  "border-adopt focus-visible:border-adopt focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--adopt)_60%,transparent)]";

/** Border of the picture frame that will be saved (Artwork tab). */
export const ADOPT_FRAME_CLASSES = "border-adopt";

/** Grid columns shared by the compare rows and their header. */
export const COMPARE_GRID_CLASSES =
  "grid grid-cols-[7.5rem_1fr_1fr_1rem] items-center gap-x-2 gap-y-1";
