/**
 * Focus appearance variants shared by the form fields (`Input`,
 * `SelectTrigger`, `Textarea`, `Checkbox`, `Slider`). "normal" (default) lights the border up like
 * `CircleIconButton` / `InitialGrid`: the border turns `foreground` and a
 * blurred `box-shadow` glows around it, so it reads the same in both themes.
 * "basic" keeps the stock shadcn look (`ring` border plus a translucent
 * 3px ring).
 */
export type FieldVariant = "normal" | "basic";

/** Focus classes per variant; append after the field's base classes. */
export const fieldFocusClasses: Record<FieldVariant, string> = {
  normal:
    "focus-visible:border-foreground focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
  basic:
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
};

/**
 * Hover classes per variant for the clickable fields (`SelectTrigger`,
 * `Checkbox`) — text fields do not light up on hover. "normal" glows the
 * same way as its focus, replacing any background change like
 * `CircleIconButton`; "basic" adds nothing (the field keeps its stock hover).
 */
export const fieldHoverClasses: Record<FieldVariant, string> = {
  normal:
    "hover:border-foreground hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
  basic: "",
};

/**
 * Transition classes so the glow fades in and out at the buttons' speed;
 * replaces the stock `transition-colors`, which leaves `box-shadow` out.
 */
export const fieldTransitionClasses =
  "transition-[color,background-color,border-color,box-shadow] duration-200";
