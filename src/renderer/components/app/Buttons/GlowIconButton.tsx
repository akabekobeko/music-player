import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

type Props = Omit<ComponentProps<typeof Button>, "variant" | "size">;

/**
 * Borderless icon button for the player bar. Instead of a background change,
 * hovering makes the icon itself "light up" like a lamp: a mid bloom plus a
 * wide faint halo (`drop-shadow` follows the glyph shape, so it works for
 * filled and outlined icons alike). No shadow hugs the outline, so the glyph
 * stays crisp inside the bloom. Disabled buttons get `pointer-events-none`
 * from `Button`, so they never glow. Pass `aria-label` for the icon.
 */
export const GlowIconButton = ({ className, ...props }: Props) => (
  <Button
    variant="ghost"
    size="icon-sm"
    className={cn(
      "rounded-full bg-transparent text-foreground",
      "hover:bg-transparent hover:text-foreground dark:hover:bg-transparent",
      "aria-expanded:bg-transparent aria-expanded:text-foreground",
      "[&_svg]:transition-[filter] [&_svg]:duration-200",
      "hover:[&_svg]:filter-[drop-shadow(0_0_5px_var(--foreground))_drop-shadow(0_0_12px_color-mix(in_oklch,var(--foreground)_60%,transparent))]",
      className,
    )}
    {...props}
  />
);
