import type { ComponentProps } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/libs/utils";

type Props = ComponentProps<typeof TabsContent>;

/**
 * Tab panel of an info dialog. Each panel pads itself instead of the
 * dialog body so a scrolling panel puts its scrollbar at the popup edge
 * (see `DialogContent`).
 */
export const DialogTabPanel = ({ className, ...props }: Props) => (
  <TabsContent className={cn("min-h-0 px-4 pb-4", className)} {...props} />
);
