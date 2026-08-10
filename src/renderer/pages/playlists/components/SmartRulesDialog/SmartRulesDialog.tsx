import type { SmartCondition, SmartPlaylistRules } from "@mp/ipc";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/features/i18n/useT";
import {
  CONDITION_FIELDS,
  type ConditionField,
  defaultCondition,
  EMPTY_DRAFT,
  fromDraft,
  operatorsFor,
  type RulesDraft,
  SORT_CHOICES,
  toDraft,
} from "./rulesForm";

/**
 * Smart-playlist rules editor
 * (`docs/specs/v1.0/features/playlist.md`): condition rows (field /
 * operator / value), match toggle, sort, and limit. Used for both creating
 * a smart playlist (with a name field) and editing an existing one's rules.
 *
 * Mount conditionally (`{open && <SmartRulesDialog …/>}`) — unmounting is
 * what resets the form state.
 */
export const SmartRulesDialog = ({
  title,
  initialRules,
  initialName,
  onSubmit,
  onClose,
}: {
  readonly title: string;
  /** Rules to edit; omit to start from the empty draft (create). */
  readonly initialRules?: SmartPlaylistRules;
  /** When set, show a name input initialised to this value (create). */
  readonly initialName?: string;
  readonly onSubmit: (rules: SmartPlaylistRules, name: string) => void;
  readonly onClose: () => void;
}) => {
  const t = useT();
  const [draft, setDraft] = useState<RulesDraft>(() =>
    initialRules !== undefined ? toDraft(initialRules) : EMPTY_DRAFT,
  );
  const [name, setName] = useState(initialName ?? "");

  const setCondition = (index: number, condition: SmartCondition): void => {
    setDraft({
      ...draft,
      conditions: draft.conditions.map((entry, entryIndex) =>
        entryIndex === index ? condition : entry,
      ),
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {initialName !== undefined && (
          <Input
            autoFocus
            placeholder={t("playlist.defaultName")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {t("smart.match")}
          </span>
          <Select
            value={draft.match}
            // items maps value → label so SelectValue shows the display
            // name in the trigger instead of the raw value.
            items={{ all: t("smart.matchAll"), any: t("smart.matchAny") }}
            onValueChange={(match) =>
              setDraft({ ...draft, match: match as RulesDraft["match"] })
            }
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("smart.matchAll")}</SelectItem>
              <SelectItem value="any">{t("smart.matchAny")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          {draft.conditions.map((condition, index) => (
            <ConditionRow
              // biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity beyond their position; the list is short and replaced wholesale.
              key={index}
              condition={condition}
              onChange={(next) => setCondition(index, next)}
              onRemove={() =>
                setDraft({
                  ...draft,
                  conditions: draft.conditions.filter(
                    (_, entryIndex) => entryIndex !== index,
                  ),
                })
              }
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              setDraft({
                ...draft,
                conditions: [...draft.conditions, defaultCondition("artist")],
              })
            }
          >
            <Plus /> {t("smart.addCondition")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {t("smart.sort")}
          </span>
          <Select
            value={draft.sort}
            items={Object.fromEntries(
              SORT_CHOICES.map((choice) => [choice, t(`smart.sort.${choice}`)]),
            )}
            onValueChange={(sort) =>
              setDraft({ ...draft, sort: sort as RulesDraft["sort"] })
            }
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_CHOICES.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {t(`smart.sort.${choice}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {draft.sort !== "none" && draft.sort !== "random" && (
            <Select
              value={draft.order}
              items={{ asc: t("smart.orderAsc"), desc: t("smart.orderDesc") }}
              onValueChange={(order) =>
                setDraft({ ...draft, order: order as RulesDraft["order"] })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{t("smart.orderAsc")}</SelectItem>
                <SelectItem value="desc">{t("smart.orderDesc")}</SelectItem>
              </SelectContent>
            </Select>
          )}
          <span className="ml-2 text-muted-foreground text-sm">
            {t("smart.limit")}
          </span>
          <Input
            type="number"
            min={1}
            className="w-24"
            placeholder={t("smart.limitNone")}
            value={draft.limit}
            onChange={(event) =>
              setDraft({ ...draft, limit: event.target.value })
            }
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => onSubmit(fromDraft(draft), name.trim())}>
            {t("smart.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** One condition row: field / operator selects and the value input(s). */
const ConditionRow = ({
  condition,
  onChange,
  onRemove,
}: {
  readonly condition: SmartCondition;
  readonly onChange: (next: SmartCondition) => void;
  readonly onRemove: () => void;
}) => {
  const t = useT();
  const isText =
    condition.field === "artist" ||
    condition.field === "albumArtist" ||
    condition.field === "album" ||
    condition.field === "genre" ||
    condition.field === "title";

  const setNumber = (raw: string, key: "value" | "value2"): void => {
    const value = Number(raw);
    if (!Number.isNaN(value)) {
      onChange({ ...condition, [key]: value } as SmartCondition);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={condition.field}
        items={Object.fromEntries(
          CONDITION_FIELDS.map((field) => [field, t(`smart.field.${field}`)]),
        )}
        onValueChange={(field) =>
          onChange(defaultCondition(field as ConditionField))
        }
      >
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONDITION_FIELDS.map((field) => (
            <SelectItem key={field} value={field}>
              {t(`smart.field.${field}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={condition.operator}
        items={Object.fromEntries(
          operatorsFor(condition.field).map((operator) => [
            operator,
            t(`smart.op.${operator}`),
          ]),
        )}
        onValueChange={(operator) =>
          onChange({ ...condition, operator } as SmartCondition)
        }
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operatorsFor(condition.field).map((operator) => (
            <SelectItem key={operator} value={operator}>
              {t(`smart.op.${operator}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isText ? (
        <Input
          className="flex-1"
          value={condition.value as string}
          onChange={(event) =>
            onChange({
              ...condition,
              value: event.target.value,
            } as SmartCondition)
          }
        />
      ) : (
        <>
          <Input
            type="number"
            className="w-24"
            step={condition.field === "rating" ? 0.1 : 1}
            value={String(condition.value)}
            onChange={(event) => setNumber(event.target.value, "value")}
          />
          {condition.field === "year" && condition.operator === "between" && (
            <>
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="number"
                className="w-24"
                value={String(condition.value2 ?? condition.value)}
                onChange={(event) => setNumber(event.target.value, "value2")}
              />
            </>
          )}
        </>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("smart.removeCondition")}
        onClick={onRemove}
      >
        <X />
      </Button>
    </div>
  );
};
