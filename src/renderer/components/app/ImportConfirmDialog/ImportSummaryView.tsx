import { Stack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import type { ImportEntryState } from "@/features/import/importStore";

type Props = {
  readonly state: Extract<ImportEntryState, { status: "done" }>;
};

/** Completion body: imported / updated counts and expandable failures. */
export const ImportSummaryView = ({ state }: Props) => {
  const t = useT();
  const { summary } = state;
  return (
    <Stack className="text-sm">
      <p>{t("import.summary.imported", { count: summary.imported })}</p>
      <p>{t("import.summary.updated", { count: summary.updated })}</p>
      {summary.failed.length > 0 && (
        <details>
          <summary className="cursor-pointer text-destructive">
            {t("import.summary.failed", { count: summary.failed.length })}
          </summary>
          {/* details cannot become a flex container (summary marker breaks),
              so the expanded body spaces itself with padding. */}
          <div className="pt-2">
            <ul className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-2 font-mono text-xs">
              {summary.failed.map((failure) => (
                <li key={failure.filePath} className="py-0.5">
                  <span className="block break-all">{failure.filePath}</span>
                  <span className="block break-all text-muted-foreground">
                    {failure.error.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </Stack>
  );
};
