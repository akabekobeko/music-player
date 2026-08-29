import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

type Props = Omit<ComponentProps<typeof Button>, "variant" | "size">;

/**
 * Small outlined-circle icon button (artist play / shuffle, album and artist
 * menus, sidebar panel headers). No fill: a `foreground` colored border and icon on a transparent
 * background. On hover the border "lights up" with a blurred glow
 * (`box-shadow`) instead of a background change, so it reads clearly in both
 * light and dark themes. Pass `aria-label` for the icon.
 */
export const CircleIconButton = ({ className, ...props }: Props) => (
  <Button
    variant="ghost"
    size="icon-sm"
    className={cn(
      "rounded-full border border-foreground bg-transparent text-foreground transition-shadow duration-200",
      "hover:bg-transparent hover:text-foreground dark:hover:bg-transparent",
      "hover:shadow-[0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
      className,
    )}
    {...props}
  />
);
