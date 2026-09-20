import { useT } from "@/features/i18n/useT";
import type { ArtistEditTarget } from "@/features/library/artistEditStore";
import type { Initial } from "@/pages/artists/components/ArtistListPanel/initials";
import { InitialGrid } from "../../InitialGrid/InitialGrid";
import { Stack } from "../../stacks";
import { DialogTabPanel } from "../DialogTabPanel";
import { PropertyRow } from "../PropertyRow";

type Props = {
  /** Artist whose metadata is shown. */
  readonly target: ArtistEditTarget;
  /** Initial tile shown as the current choice. */
  readonly selectedInitial: Initial;
  /** Called with the initial tile the user clicked. */
  readonly onSelectInitial: (initial: Initial) => void;
};

/**
 * "Details" tab: the artist metadata (name, song count) as plain text,
 * followed by the initial setting — the A–Z / "Other" grid that overrides
 * the automatic section of the artist list (A–Z) or clears the override
 * ("Other").
 */
export const DetailsPanel = ({
  target,
  selectedInitial,
  onSelectInitial,
}: Props) => {
  const t = useT();
  return (
    <DialogTabPanel
      value="details"
      className="flex flex-col gap-6 overflow-y-auto"
    >
      <div className="grid gap-2">
        <PropertyRow label={t("artistEdit.field.name")} value={target.name} />
        <PropertyRow
          label={t("artistEdit.field.songCount")}
          value={String(target.musicCount)}
        />
      </div>
      <Stack className="gap-2">
        <h2 className="font-medium text-muted-foreground text-xs">
          {t("artistEdit.initial")}
        </h2>
        <InitialGrid
          selected={selectedInitial}
          onSelect={onSelectInitial}
          stretch
        />
      </Stack>
    </DialogTabPanel>
  );
};
