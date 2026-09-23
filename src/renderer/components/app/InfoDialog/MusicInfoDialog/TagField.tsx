import { Input } from "@/components/ui/input";

type Props = {
  /** Field label; also the input's accessible name. */
  readonly label: string;
  /** Current text; a mixed (`null`) value renders as an empty input. */
  readonly value: string | null;
  /** Placeholder shown while the input is empty (the "Mixed" hint). */
  readonly placeholder?: string;
  /** Validation message shown under the input, or `null`. */
  readonly error?: string | null;
  /** `numeric` for the number-like tags (year, track, …). */
  readonly inputMode?: "numeric";
  readonly disabled?: boolean;
  /** Called with the input's text on every change. */
  readonly onChange: (value: string) => void;
};

/**
 * Label + editable input row for a tag field, the error (if any) under the
 * input in red. Numbers are edited as text (`inputMode="numeric"`) rather
 * than `type="number"`, whose empty / invalid states are indistinguishable;
 * the schema and `toMusicTagPatch` handle the parsing.
 */
export const TagField = ({
  label,
  value,
  placeholder,
  error = null,
  inputMode,
  disabled = false,
  onChange,
}: Props) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-center gap-x-2 gap-y-1">
    <span className="text-muted-foreground text-xs">{label}</span>
    <Input
      value={value ?? ""}
      placeholder={placeholder}
      inputMode={inputMode}
      aria-label={label}
      aria-invalid={error !== null || undefined}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
    {error !== null && (
      <>
        <span />
        <p className="text-destructive text-xs">{error}</p>
      </>
    )}
  </div>
);
