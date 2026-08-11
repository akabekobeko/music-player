import type { SmartPlaylistRules } from "@mp/ipc";
import type { RulesDraft } from "./rulesDraft";

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
