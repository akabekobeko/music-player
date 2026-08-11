import type { SmartCondition } from "@mp/ipc";
import type { ConditionField } from "./conditionFields";

/**
 * The default condition when a row is added or its field changes.
 *
 * @param field - Selected field.
 * @returns A valid condition with a neutral value.
 */
export const defaultCondition = (field: ConditionField): SmartCondition => {
  switch (field) {
    case "artist":
    case "albumArtist":
    case "album":
    case "genre":
    case "title":
      return { field, operator: "contains", value: "" };
    case "year":
      return { field, operator: "is", value: new Date().getFullYear() };
    case "rating":
      return { field, operator: "gte", value: 0.5 };
    case "duration":
      return { field, operator: "gte", value: 60 };
    case "addedAt":
      return { field, operator: "inLastDays", value: 30 };
  }
};
