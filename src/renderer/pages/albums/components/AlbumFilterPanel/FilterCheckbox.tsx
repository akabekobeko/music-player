import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  /** Row text: a genre name, a decade (`1990s`), or "Unknown year". */
  readonly label: string;
  /** Album count badge. */
  readonly count: number;
  /** Whether the choice is currently part of the filter. */
  readonly checked: boolean;
  /** Called on any click in the row; the panel flips the choice. */
  readonly onToggle: () => void;
};

/** One checkbox row; the whole row is the click target. */
export const FilterCheckbox = ({ label, count, checked, onToggle }: Props) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: Base UI's Checkbox renders a hidden native input inside the label, which the lint cannot see.
  <label className="flex cursor-default items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-sidebar-accent/50">
    <Checkbox checked={checked} onCheckedChange={onToggle} />
    <EllipsisText className="min-w-0 flex-1" text={label} />
    <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
      {count}
    </span>
  </label>
);
