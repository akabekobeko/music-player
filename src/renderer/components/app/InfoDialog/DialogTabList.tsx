import type { ReactNode } from "react";
import { TabsList } from "@/components/ui/tabs";

type Props = {
  /** `TabsTrigger` elements, one per tab. */
  readonly children: ReactNode;
};

/**
 * Tab strip of an info dialog: a full-width `TabsList` padded to the
 * dialog's side padding (the `DialogBody` around it is padding-less so the
 * panels can put their scrollbar at the popup edge).
 */
export const DialogTabList = ({ children }: Props) => (
  <div className="px-4">
    <TabsList className="w-full">{children}</TabsList>
  </div>
);
