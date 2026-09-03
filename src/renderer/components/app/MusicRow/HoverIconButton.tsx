import type { ComponentProps } from "react";
import { cn } from "@/libs/utils";

type Props = Omit<ComponentProps<"button">, "type">;

/**
 * Bare icon button in the leading cell of `MusicRow`, hidden until the row
 * (the `group`) is hovered. Hovering the icon itself lights it up: a blurred
 * `drop-shadow` glow in the icon's own colour, the bare-icon counterpart of
 * the boxed variants' `box-shadow` glow in `components/ui/button.tsx`.
 * Pass `aria-label` for the icon.
 */
export const HoverIconButton = ({ className, ...props }: Props) => (
  <button
    type="button"
    className={cn(
      "hidden size-4 items-center justify-center group-hover:inline-flex",
      "transition-[filter] hover:drop-shadow-[0_0_3px_color-mix(in_oklch,currentColor_60%,transparent)]",
      className,
    )}
    {...props}
  />
);
