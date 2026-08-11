import type { SmartCondition } from "@mp/ipc";
import { type ConditionField, defaultCondition } from "./rulesForm";

/**
 * Logic of `ConditionRow`: the field-kind derivation and the change
 * handlers that keep one condition valid while its inputs change.
 */
export const useConditionRow = (
  condition: SmartCondition,
  onChange: (next: SmartCondition) => void,
) => {
  const isText =
    condition.field === "artist" ||
    condition.field === "albumArtist" ||
    condition.field === "album" ||
    condition.field === "genre" ||
    condition.field === "title";

  /** Field change resets the row to that field's default condition. */
  const setField = (field: string | null): void => {
    onChange(defaultCondition(field as ConditionField));
  };

  const setOperator = (operator: string | null): void => {
    onChange({ ...condition, operator } as SmartCondition);
  };

  const setText = (value: string): void => {
    onChange({ ...condition, value } as SmartCondition);
  };

  const setNumber = (raw: string, key: "value" | "value2"): void => {
    const value = Number(raw);
    if (!Number.isNaN(value)) {
      onChange({ ...condition, [key]: value } as SmartCondition);
    }
  };

  return { isText, setField, setOperator, setText, setNumber };
};
