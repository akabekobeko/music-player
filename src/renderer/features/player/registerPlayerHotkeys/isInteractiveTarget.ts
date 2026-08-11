/**
 * Elements that own their key handling — hotkeys must not fire from them
 * (text inputs, the seek/volume sliders, buttons where Space means click).
 */
const INTERACTIVE_SELECTOR =
  "input, textarea, select, button, a, [contenteditable], [data-slot=slider], [role=slider]";

/** Whether the event target should swallow player hotkeys. */
export const isInteractiveTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  target.closest(INTERACTIVE_SELECTOR) !== null;
