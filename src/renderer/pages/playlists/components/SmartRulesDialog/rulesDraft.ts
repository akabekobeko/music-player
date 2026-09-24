import type { SmartCondition } from "@mp/ipc";
import { defaultCondition } from "./defaultCondition";
import type { SortChoice } from "./sortChoices";

/**
 * Form model of the smart-playlist rules editor
 * (`docs/specs/v1.0/features/playlist.md`): a flat draft the dialog can bind
 * inputs to, converted from / to the persisted `SmartPlaylistRules`.
 * Pure — the dialog owns the React state.
 */

/** Editable draft the dialog binds to. */
export type RulesDraft = {
  /** Whether a track must satisfy every condition or any one of them. */
  readonly match: "all" | "any";
  /** Condition rows in display order (one `artist` row on a new draft). */
  readonly conditions: readonly SmartCondition[];
  /** Sort field, `"none"` for no explicit sort, or `"random"`. */
  readonly sort: SortChoice;
  /** Sort direction; kept `"asc"` and unused when `sort` is none / random. */
  readonly order: "asc" | "desc";
  /** Raw limit input; empty string = no limit. */
  readonly limit: string;
};

/** The draft used when creating a new smart playlist. */
export const EMPTY_DRAFT: RulesDraft = {
  match: "all",
  conditions: [defaultCondition("artist")],
  sort: "none",
  order: "asc",
  limit: "",
};
