import { Input } from "@/components/ui/input";

type Props = {
  /** Field label; also the input's accessible name. */
  readonly label: string;
  /** Input type; `number` for numeric tags such as year or track. */
  readonly type?: "text" | "number";
  /** Tag value; `null` (unset) renders as an empty input. */
  readonly value: string | number | null;
};

/** Label + read-only input row for a (future-editable) tag field. */
export const TagField = ({ label, type = "text", value }: Props) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-center gap-2">
    <span className="text-muted-foreground text-xs">{label}</span>
    <Input type={type} value={value ?? ""} aria-label={label} readOnly />
  </div>
);
