import type { SmartPlaylistRules } from "@mp/ipc";
import type { RulesDraft } from "./rulesDraft";

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
