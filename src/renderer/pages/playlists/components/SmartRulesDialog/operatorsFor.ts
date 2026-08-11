import type { ConditionField } from "./conditionFields";

/**
 * Operators available for one field.
 *
 * @param field - Condition field.
 * @returns Operator names in display order.
 */
export const operatorsFor = (field: ConditionField): readonly string[] => {
  switch (field) {
    case "artist":
    case "albumArtist":
    case "album":
    case "genre":
    case "title":
      return ["is", "isNot", "contains"];
    case "year":
      return ["is", "between", "gte", "lte"];
    case "rating":
    case "duration":
      return ["gte", "lte"];
    case "addedAt":
      return ["inLastDays"];
  }
};
