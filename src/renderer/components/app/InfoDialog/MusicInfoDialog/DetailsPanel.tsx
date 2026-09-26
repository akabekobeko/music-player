import type { MusicInfoCandidate } from "@mp/ipc";
import { useT } from "@/features/i18n/useT";
import { DialogTabPanel } from "../DialogTabPanel";
import { COMPARE_GRID_CLASSES } from "./adoptClasses";
import { CompareTagField } from "./CompareTagField";
import {
  type AdoptedFields,
  type CandidateField,
  isCandidateField,
} from "./candidateFields";
import { candidateTextOf } from "./candidateTextOf";
import {
  MUSIC_INFO_FIELDS,
  type MusicInfoFormValues,
  NUMERIC_FIELDS,
} from "./musicInfoSchema";
import { TagField } from "./TagField";
import type { useMusicInfoDialog } from "./useMusicInfoDialog";

type Props = {
  /** The dialog's form (from `useMusicInfoDialog`). */
  readonly form: ReturnType<typeof useMusicInfoDialog>["form"];
  /** Whether an empty title is an error (single-track edit only). */
  readonly requireTitle: boolean;
  /** Inputs are locked while an apply or a fetch runs. */
  readonly disabled: boolean;
  /**
   * The fetched candidate, or `null` before a fetch. With one, every row
   * becomes a compare row with a column header above.
   */
  readonly candidate: MusicInfoCandidate | null;
  /** Which fetched values will be saved. */
  readonly adopted: AdoptedFields;
  /** Called when the adopt checkbox of a field is toggled. */
  readonly onAdoptedChange: (field: CandidateField, adopted: boolean) => void;
  /** Called when the user edits a field's current value. */
  readonly onFieldEdited: (field: keyof MusicInfoFormValues) => void;
};

/**
 * "Details" tab: the tag fields as editable inputs bound to the form.
 * Every field validates on change through the form-level schema; the
 * title additionally requires a value for a single track. A mixed field
 * (`null`, several tracks disagree) renders empty with the "Mixed"
 * placeholder until typed into.
 *
 * After a fetch (`docs/specs/v1.2/features/music-info-compare.md`) each
 * row shows the current and the fetched value side by side with an adopt
 * checkbox; bpm / rating have no fetched value and keep their columns
 * empty so the grid stays aligned.
 */
export const DetailsPanel = ({
  form,
  requireTitle,
  disabled,
  candidate,
  adopted,
  onAdoptedChange,
  onFieldEdited,
}: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="details" className="overflow-y-auto">
      <div className="grid gap-2">
        {candidate !== null && (
          <div className={COMPARE_GRID_CLASSES}>
            <span />
            <span className="text-muted-foreground text-xs">
              {t("musicInfo.column.current")}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("musicInfo.column.fetched")}
            </span>
            <span />
          </div>
        )}
        {MUSIC_INFO_FIELDS.map((name) => (
          <form.Field
            key={name}
            name={name}
            validators={
              name === "title" && requireTitle
                ? { onChange: ({ value }) => requiredError(value) }
                : undefined
            }
          >
            {(field) => {
              const label = t(`musicInfo.field.${name}`);
              const common = {
                label,
                value: field.state.value,
                placeholder:
                  field.state.value === null ? t("musicInfo.mixed") : undefined,
                error: errorTextOf(field.state.meta.errors, t),
                inputMode: NUMERIC_FIELDS.has(name)
                  ? ("numeric" as const)
                  : undefined,
                disabled,
                onChange: (value: string) => {
                  field.handleChange(value);
                  onFieldEdited(name);
                },
              };
              if (candidate === null) {
                return <TagField {...common} />;
              }

              const candidateField = isCandidateField(name) ? name : null;
              return (
                <CompareTagField
                  {...common}
                  candidateText={
                    candidateField === null
                      ? null
                      : candidateTextOf(candidate, candidateField)
                  }
                  adopted={candidateField !== null && adopted[candidateField]}
                  adoptLabel={t("musicInfo.adoptField", { field: label })}
                  onAdoptedChange={(on) => {
                    if (candidateField !== null) {
                      onAdoptedChange(candidateField, on);
                    }
                  }}
                />
              );
            }}
          </form.Field>
        ))}
      </div>
    </DialogTabPanel>
  );
};

/** Field-level rule: the title of a single track must not be blank. */
const requiredError = (
  value: MusicInfoFormValues["title"],
): string | undefined =>
  value !== null && value.trim() === ""
    ? "musicInfo.error.required"
    : undefined;

/**
 * First error of a field as display text. Errors arrive either as the
 * i18n key itself (field validators) or as a Standard Schema issue whose
 * `message` is the key (the zod schema).
 */
const errorTextOf = (
  errors: ReadonlyArray<unknown>,
  t: (key: string) => string,
): string | null => {
  const first = errors.find((entry) => entry !== undefined);
  if (first === undefined) {
    return null;
  }

  if (typeof first === "string") {
    return t(first);
  }

  const message = (first as { readonly message?: unknown }).message;
  return typeof message === "string" ? t(message) : null;
};
