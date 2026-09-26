import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { ADOPT_INPUT_CLASSES, COMPARE_GRID_CLASSES } from "./adoptClasses";

type Props = {
  /** Field label; also the inputs' accessible name. */
  readonly label: string;
  /** Current text of the editable (left) input; `null` renders empty. */
  readonly value: string | null;
  /** Placeholder of the left input while empty (the "Mixed" hint). */
  readonly placeholder?: string;
  /** Validation message of the left input, or `null`. */
  readonly error?: string | null;
  /** `numeric` for the number-like tags (year, track, ...). */
  readonly inputMode?: "numeric";
  /** Inputs and checkbox are locked while the dialog applies or fetches. */
  readonly disabled?: boolean;
  /**
   * The fetched text shown read-only on the right, or `null` when
   * MusicBrainz has no value (empty input, checkbox disabled).
   */
  readonly candidateText: string | null;
  /** Whether the fetched value is the one that will be saved. */
  readonly adopted: boolean;
  /** Accessible name of the adopt checkbox. */
  readonly adoptLabel: string;
  /** Called with the left input's text on every change. */
  readonly onChange: (value: string) => void;
  /** Called when the adopt checkbox is toggled. */
  readonly onAdoptedChange: (adopted: boolean) => void;
};

/**
 * Two-column row of the Details tab after a fetch
 * (`docs/specs/v1.2/features/music-info-compare.md`): the editable current
 * value, the read-only fetched value, and the adopt checkbox. The side
 * that will be saved carries the adopt border: the right one while
 * adopted, else the left one (also when MusicBrainz has no value, since
 * the current value then stays as it is).
 */
export const CompareTagField = ({
  label,
  value,
  placeholder,
  error = null,
  inputMode,
  disabled = false,
  candidateText,
  adopted,
  adoptLabel,
  onChange,
  onAdoptedChange,
}: Props) => (
  <div className={COMPARE_GRID_CLASSES}>
    <span className="text-muted-foreground text-xs">{label}</span>
    <Input
      value={value ?? ""}
      placeholder={placeholder}
      inputMode={inputMode}
      aria-label={label}
      aria-invalid={error !== null || undefined}
      disabled={disabled}
      className={cn(!adopted && ADOPT_INPUT_CLASSES)}
      onChange={(event) => onChange(event.target.value)}
    />
    <Input
      value={candidateText ?? ""}
      placeholder={candidateText === null ? "—" : undefined}
      readOnly
      tabIndex={-1}
      aria-label={`${label} (MusicBrainz)`}
      className={cn(adopted && ADOPT_INPUT_CLASSES)}
    />
    <Checkbox
      checked={adopted}
      disabled={disabled || candidateText === null}
      aria-label={adoptLabel}
      onCheckedChange={(checked) => onAdoptedChange(checked === true)}
    />
    {error !== null && (
      <>
        <span />
        <p className="col-span-3 text-destructive text-xs">{error}</p>
      </>
    )}
  </div>
);
