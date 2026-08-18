import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";

type Props = {
  /** Accordion item value (identifies the section's open state). */
  readonly value: string;
  /** Section heading. */
  readonly label: string;
  /** Whether every choice of the section is selected. */
  readonly allSelected: boolean;
  /** Selects every choice, or clears them all when `allSelected`. */
  readonly onToggleAll: () => void;
  readonly children: ReactNode;
};

/**
 * Collapsible heading + checkbox list of one filter kind. The heading holds
 * a select-all / clear-all checkbox placed before the label; the checkbox
 * lives outside the accordion trigger (nesting a button in a button is
 * invalid, and toggling it must not open / close the section), wrapped in a
 * full-height label whose padding aligns it with the row checkboxes below
 * (`pl-1` = the rows' `px-1`, `pr-2` = the rows' `gap-2`) while widening
 * the trigger-excluded area.
 */
export const FilterSection = ({
  value,
  label,
  allSelected,
  onToggleAll,
  children,
}: Props) => {
  const t = useT();

  return (
    <AccordionItem value={value}>
      <AccordionPrimitive.Header className="flex items-stretch text-muted-foreground text-xs">
        <Tooltip>
          <TooltipTrigger
            render={
              // biome-ignore lint/a11y/noLabelWithoutControl: Base UI's Checkbox renders a hidden native input inside the label, which the lint cannot see.
              <label className="flex cursor-default items-center pl-1 pr-2">
                <Checkbox
                  aria-label={t("album.filter.selectAll", { label })}
                  checked={allSelected}
                  onCheckedChange={onToggleAll}
                />
              </label>
            }
          />
          <TooltipContent side="bottom">
            {t("album.filter.selectAllTooltip")}
          </TooltipContent>
        </Tooltip>
        <AccordionPrimitive.Trigger className="group/filter-trigger flex flex-1 items-center rounded-md border border-transparent py-2 pr-1 text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="flex-1">{label}</span>
          <ChevronDownIcon
            aria-hidden
            className="pointer-events-none size-4 shrink-0 group-aria-expanded/filter-trigger:hidden"
          />
          <ChevronUpIcon
            aria-hidden
            className="pointer-events-none hidden size-4 shrink-0 group-aria-expanded/filter-trigger:inline"
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionContent className="flex flex-col gap-0.5 pb-2">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
};
