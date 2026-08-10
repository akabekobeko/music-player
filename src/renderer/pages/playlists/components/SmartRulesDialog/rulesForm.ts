import type { SmartCondition, SmartPlaylistRules } from "@mp/ipc";

/**
 * Form model of the smart-playlist rules editor
 * (`docs/specs/v1.0/features/playlist.md`): a flat draft the dialog can bind
 * inputs to, converted from / to the persisted {@link SmartPlaylistRules}.
 * Pure — the dialog owns the React state.
 */

/** Condition fields offered by the v1.0 editor. */
export const CONDITION_FIELDS = [
  "artist",
  "albumArtist",
  "album",
  "genre",
  "title",
  "year",
  "rating",
  "duration",
  "addedAt",
] as const;

/** A condition field name. */
export type ConditionField = (typeof CONDITION_FIELDS)[number];

/** Sort choices: rule sort fields plus random and "no explicit sort". */
export const SORT_CHOICES = [
  "none",
  "title",
  "artist",
  "album",
  "year",
  "duration",
  "rating",
  "addedAt",
  "random",
] as const;

/** A sort choice value. */
export type SortChoice = (typeof SORT_CHOICES)[number];

/** Editable draft the dialog binds to. */
export type RulesDraft = {
  readonly match: "all" | "any";
  readonly conditions: readonly SmartCondition[];
  readonly sort: SortChoice;
  readonly order: "asc" | "desc";
  /** Raw limit input; empty string = no limit. */
  readonly limit: string;
};

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

/** The draft used when creating a new smart playlist. */
export const EMPTY_DRAFT: RulesDraft = {
  match: "all",
  conditions: [defaultCondition("artist")],
  sort: "none",
  order: "asc",
  limit: "",
};

/**
 * Convert persisted rules into the editable draft.
 *
 * @param rules - Stored rule document.
 * @returns The draft.
 */
export const toDraft = (rules: SmartPlaylistRules): RulesDraft => ({
  match: rules.match,
  conditions: rules.conditions,
  sort: rules.sort === undefined ? "none" : rules.sort.field,
  order:
    rules.sort !== undefined && rules.sort.field !== "random"
      ? rules.sort.order
      : "asc",
  limit: rules.limit !== undefined ? String(rules.limit) : "",
});

/**
 * Convert the draft back into a persistable rule document.
 *
 * @param draft - Edited draft.
 * @returns The rule document (invalid limit input becomes "no limit").
 */
export const fromDraft = (draft: RulesDraft): SmartPlaylistRules => {
  const limit = Number.parseInt(draft.limit, 10);
  return {
    version: 1,
    match: draft.match,
    conditions: draft.conditions,
    ...(draft.sort === "none"
      ? {}
      : draft.sort === "random"
        ? { sort: { field: "random" } }
        : { sort: { field: draft.sort, order: draft.order } }),
    ...(Number.isInteger(limit) && limit > 0 ? { limit } : {}),
  };
};
