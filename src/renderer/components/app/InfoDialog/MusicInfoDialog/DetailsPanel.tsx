import { useT } from "@/features/i18n/useT";
import { DialogTabPanel } from "../DialogTabPanel";
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
  /** Inputs are locked while an apply runs. */
  readonly disabled: boolean;
};

/**
 * "Details" tab: the tag fields as editable inputs bound to the form.
 * Every field validates on change through the form-level schema; the
 * title additionally requires a value for a single track. A mixed field
 * (`null`, several tracks disagree) renders empty with the "Mixed"
 * placeholder until typed into.
 */
export const DetailsPanel = ({ form, requireTitle, disabled }: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="details" className="overflow-y-auto">
      <div className="grid gap-2">
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
            {(field) => (
              <TagField
                label={t(`musicInfo.field.${name}`)}
                value={field.state.value}
                placeholder={
                  field.state.value === null ? t("musicInfo.mixed") : undefined
                }
                error={errorTextOf(field.state.meta.errors, t)}
                inputMode={NUMERIC_FIELDS.has(name) ? "numeric" : undefined}
                disabled={disabled}
                onChange={(value) => field.handleChange(value)}
              />
            )}
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
