import { useT } from "@/features/i18n/useT";
import { HStack, Spacer } from "../stacks";
import type { FetchGroupRow } from "./useFetchInfoDialog";

type Props = {
  /** Album groups of the targets, in the order Main will search them. */
  readonly rows: readonly FetchGroupRow[];
};

/**
 * Confirmation list: one line per album group (display artist / album and
 * track count), so the user sees the unit the search works in
 * (`docs/specs/v1.2/features/fetch-dialog.md`).
 */
export const FetchGroupList = ({ rows }: Props) => {
  const t = useT();
  return (
    <ul className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-2 text-xs">
      {rows.map((row) => (
        <li key={`${row.artist}\u0000${row.album}`} className="py-0.5">
          <HStack className="gap-4">
            <span className="min-w-0 truncate">
              {[
                row.artist !== "" ? row.artist : t("artist.unknown"),
                row.album !== "" ? row.album : t("fetch.dialog.unknownAlbum"),
              ].join(" / ")}
            </span>
            <Spacer />
            <span className="shrink-0 text-muted-foreground">
              {t("artist.songs", { count: row.count })}
            </span>
          </HStack>
        </li>
      ))}
    </ul>
  );
};
