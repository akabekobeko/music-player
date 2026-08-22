import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

type Props = Omit<ComponentProps<typeof Button>, "variant" | "size">;

/**
 * Small filled-circle icon button (artist play / shuffle, album and artist
 * menus). `foreground` / `background` swap per theme, so it is a dark disc
 * on light and a light disc on dark. Pass `aria-label` for the icon.
 */
export const CircleIconButton = ({ className, ...props }: Props) => (
  <Button
    variant="ghost"
    size="icon-sm"
    className={cn(
      "rounded-full bg-foreground text-background hover:bg-foreground/80 hover:text-background dark:hover:bg-foreground/80",
      className,
    )}
    {...props}
  />
);
