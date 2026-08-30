import type { SmartPlaylistRules } from "@mp/ipc";
import { Plus } from "lucide-react";
import { HStack, Stack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
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
import { ConditionRow } from "./ConditionRow";
import { SORT_CHOICES } from "./sortChoices";
import { useSmartRulesDialog } from "./useSmartRulesDialog";

type Props = {
  readonly title: string;
  /** Rules to edit; omit to start from the empty draft (create). */
  readonly initialRules?: SmartPlaylistRules;
  /** When set, show a name input initialised to this value (create). */
  readonly initialName?: string;
  readonly onSubmit: (rules: SmartPlaylistRules, name: string) => void;
  readonly onClose: () => void;
};

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
}: Props) => {
  const t = useT();
  const {
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
  } = useSmartRulesDialog({ initialRules, initialName, onSubmit });

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

        <DialogBody>
          {initialName !== undefined && (
            <Input
              autoFocus
              placeholder={t("playlist.defaultName")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}

          <HStack>
            <span className="text-muted-foreground text-sm">
              {t("smart.match")}
            </span>
            <Select
              value={draft.match}
              // items maps value → label so SelectValue shows the display
              // name in the trigger instead of the raw value.
              items={{ all: t("smart.matchAll"), any: t("smart.matchAny") }}
              onValueChange={setMatch}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("smart.matchAll")}</SelectItem>
                <SelectItem value="any">{t("smart.matchAny")}</SelectItem>
              </SelectContent>
            </Select>
          </HStack>

          <Stack>
            {draft.conditions.map((condition, index) => (
              <ConditionRow
                // biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity beyond their position; the list is short and replaced wholesale.
                key={index}
                condition={condition}
                onChange={(next) => setCondition(index, next)}
                onRemove={() => removeCondition(index)}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={addCondition}
            >
              <Plus /> {t("smart.addCondition")}
            </Button>
          </Stack>

          <HStack className="flex-wrap gap-4">
            <HStack>
              <span className="text-muted-foreground text-sm">
                {t("smart.sort")}
              </span>
              <Select
                value={draft.sort}
                items={Object.fromEntries(
                  SORT_CHOICES.map((choice) => [
                    choice,
                    t(`smart.sort.${choice}`),
                  ]),
                )}
                onValueChange={setSort}
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
                  items={{
                    asc: t("smart.orderAsc"),
                    desc: t("smart.orderDesc"),
                  }}
                  onValueChange={setOrder}
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
            </HStack>
            <HStack>
              <span className="text-muted-foreground text-sm">
                {t("smart.limit")}
              </span>
              <Input
                type="number"
                min={1}
                className="w-24"
                placeholder={t("smart.limitNone")}
                value={draft.limit}
                onChange={(event) => setLimit(event.target.value)}
              />
            </HStack>
          </HStack>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit}>{t("smart.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
