import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  readonly label: string;
  /** Album count badge; omitted for decade items. */
  readonly count?: number;
  readonly checked: boolean;
  readonly onToggle: () => void;
};

/** One checkbox row; the whole row is the click target. */
export const FilterCheckbox = ({ label, count, checked, onToggle }: Props) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: Base UI's Checkbox renders a hidden native input inside the label, which the lint cannot see.
  <label className="flex cursor-default items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-sidebar-accent/50">
    <Checkbox checked={checked} onCheckedChange={onToggle} />
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && (
      <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
        {count}
      </span>
    )}
  </label>
);
