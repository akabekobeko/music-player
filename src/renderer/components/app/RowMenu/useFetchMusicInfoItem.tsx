import type { Music } from "@mp/ipc";
import { CloudDownload } from "lucide-react";
import { useSyncExternalStore } from "react";
import { fetchInfoStore } from "@/features/fetchInfo/fetchInfoStore/fetchInfoStore";
import { useT } from "@/features/i18n/useT";
import type { RowMenuItem } from "./RowMenu";

/**
 * The "Fetch song info" entry shared by every track / artist / album menu
 * (`docs/specs/v1.2/features/fetch-menu.md`). Returns a factory so a menu
 * can build the entry for its own targets; the entry is disabled while a
 * bulk fetch runs (one at a time) and for an empty target list.
 *
 * @returns Factory from the target tracks to the menu entry.
 */
export const useFetchMusicInfoItem = () => {
  const t = useT();
  const running =
    useSyncExternalStore(fetchInfoStore.subscribe, fetchInfoStore.getSnapshot)
      .status === "running";

  return (
    musics: readonly Music[],
    options: {
      /** Draw a separator above the entry; defaults to `false`. */
      readonly separatorBefore?: boolean;
    } = {},
  ): RowMenuItem => ({
    label: t("menu.fetchMusicInfo"),
    icon: <CloudDownload />,
    onSelect: () => fetchInfoStore.open(musics),
    disabled: running || musics.length === 0,
    separatorBefore: options.separatorBefore,
  });
};
