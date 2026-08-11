import type { ReactNode } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Props = {
  /** Accordion item value (identifies the section's open state). */
  readonly value: string;
  /** Section heading. */
  readonly label: string;
  readonly children: ReactNode;
};

/** Collapsible heading + checkbox list of one filter kind. */
export const FilterSection = ({ value, label, children }: Props) => (
  <AccordionItem value={value}>
    <AccordionTrigger className="px-1 py-2 text-muted-foreground text-xs hover:no-underline">
      {label}
    </AccordionTrigger>
    <AccordionContent className="flex flex-col gap-0.5 pb-2">
      {children}
    </AccordionContent>
  </AccordionItem>
);
