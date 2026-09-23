import type { UpdateMusicsSummary } from "@mp/ipc";
import { useT } from "@/features/i18n/useT";
import { Stack } from "../../stacks";

type Props = {
  /** Per-track failures of the last apply. */
  readonly failures: UpdateMusicsSummary["failed"];
};

/**
 * Failure list shown under the tabs after a partial apply
 * (`docs/specs/v1.1/features/apply-flow.md`): the count, then one line per
 * file with its name and the error message.
 */
export const ApplyFailures = ({ failures }: Props) => {
  const t = useT();
  return (
    <Stack className="shrink-0 gap-1 px-4 pb-4 text-destructive text-sm">
      <p>{t("musicInfo.failedCount", { count: failures.length })}</p>
      <ul className="flex flex-col gap-1 text-xs">
        {failures.map((failure) => (
          <li key={failure.musicId} className="break-all">
            {fileNameOf(failure.filePath)}: {failure.error.message}
          </li>
        ))}
      </ul>
    </Stack>
  );
};

/** Last path segment, for either separator. */
const fileNameOf = (filePath: string): string =>
  filePath.split(/[\\/]/).pop() ?? filePath;
