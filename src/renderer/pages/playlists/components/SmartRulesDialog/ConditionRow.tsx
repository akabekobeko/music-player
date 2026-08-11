import type { SmartCondition } from "@mp/ipc";
import { X } from "lucide-react";
import { HStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/features/i18n/useT";
import { CONDITION_FIELDS, operatorsFor } from "./rulesForm";
import { useConditionRow } from "./useConditionRow";

type Props = {
  readonly condition: SmartCondition;
  readonly onChange: (next: SmartCondition) => void;
  readonly onRemove: () => void;
};

/** One condition row: field / operator selects and the value input(s). */
export const ConditionRow = ({ condition, onChange, onRemove }: Props) => {
  const t = useT();
  const { isText, setField, setOperator, setText, setNumber } = useConditionRow(
    condition,
    onChange,
  );

  return (
    <HStack>
      <Select
        value={condition.field}
        items={Object.fromEntries(
          CONDITION_FIELDS.map((field) => [field, t(`smart.field.${field}`)]),
        )}
        onValueChange={setField}
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
        onValueChange={setOperator}
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
          onChange={(event) => setText(event.target.value)}
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
    </HStack>
  );
};
