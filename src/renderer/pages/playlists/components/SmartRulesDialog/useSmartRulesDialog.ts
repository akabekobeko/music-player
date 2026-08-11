import type { SmartCondition, SmartPlaylistRules } from "@mp/ipc";
import { useState } from "react";
import {
  defaultCondition,
  EMPTY_DRAFT,
  fromDraft,
  type RulesDraft,
  toDraft,
} from "./rulesForm";

/**
 * Logic of `SmartRulesDialog`: the editable rules draft, the optional name
 * field, and every draft mutation. The component only renders what this
 * hook returns.
 */
export const useSmartRulesDialog = ({
  initialRules,
  initialName,
  onSubmit,
}: {
  readonly initialRules?: SmartPlaylistRules;
  readonly initialName?: string;
  readonly onSubmit: (rules: SmartPlaylistRules, name: string) => void;
}) => {
  const [draft, setDraft] = useState<RulesDraft>(() =>
    initialRules !== undefined ? toDraft(initialRules) : EMPTY_DRAFT,
  );
  const [name, setName] = useState(initialName ?? "");

  const setMatch = (match: string | null): void => {
    setDraft({ ...draft, match: match as RulesDraft["match"] });
  };

  const setCondition = (index: number, condition: SmartCondition): void => {
    setDraft({
      ...draft,
      conditions: draft.conditions.map((entry, entryIndex) =>
        entryIndex === index ? condition : entry,
      ),
    });
  };

  const addCondition = (): void => {
    setDraft({
      ...draft,
      conditions: [...draft.conditions, defaultCondition("artist")],
    });
  };

  const removeCondition = (index: number): void => {
    setDraft({
      ...draft,
      conditions: draft.conditions.filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    });
  };

  const setSort = (sort: string | null): void => {
    setDraft({ ...draft, sort: sort as RulesDraft["sort"] });
  };

  const setOrder = (order: string | null): void => {
    setDraft({ ...draft, order: order as RulesDraft["order"] });
  };

  const setLimit = (limit: string): void => {
    setDraft({ ...draft, limit });
  };

  /** Convert the draft back to rules and hand it to the caller. */
  const submit = (): void => {
    onSubmit(fromDraft(draft), name.trim());
  };

  return {
    draft,
    name,
    setName,
    setMatch,
    setCondition,
    addCondition,
    removeCondition,
    setSort,
    setOrder,
    setLimit,
    submit,
  };
};
