import { useT } from "@/features/i18n/useT";
import type { ImportEntryState } from "@/features/import/importStore/types";
import { Stack } from "../stacks";

type Props = {
  /**
   * The store's "importing" state: the latest progress push (`null`
   * before the first) and whether Cancel was already pressed.
   */
  readonly state: Extract<ImportEntryState, { status: "importing" }>;
};

/** Progress body while an import runs: bar, current file, error count. */
export const ImportProgress = ({ state }: Props) => {
  const t = useT();
  const progress = state.progress;
  const ratio =
    progress !== null && progress.phase === "importing" && progress.total > 0
      ? progress.current / progress.total
      : 0;
  return (
    <Stack>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="break-all font-mono text-xs text-muted-foreground">
        {progress?.filePath ?? ""}
      </p>
      {progress !== null && progress.errors > 0 && (
        <p className="text-xs text-destructive">
          {t("import.progress.errors", { count: progress.errors })}
        </p>
      )}
      {state.cancelRequested && (
        <p className="text-xs text-muted-foreground">
          {t("import.progress.cancelling")}
        </p>
      )}
    </Stack>
  );
};
