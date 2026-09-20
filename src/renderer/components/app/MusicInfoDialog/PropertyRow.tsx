type Props = {
  readonly label: string;
  readonly value: string;
};

/** Label + plain-text row for a file-derived property (never editable). */
export const PropertyRow = ({ label, value }: Props) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-2">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="break-all">{value}</span>
  </div>
);
