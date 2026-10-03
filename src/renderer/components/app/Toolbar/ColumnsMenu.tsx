import { Columns3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import { ClusterButton } from "./ClusterButton";

/** Delay before the tooltip shows, like the toolbar's icon cluster. */
const TOOLTIP_DELAY_MS = 700;

/** One checkbox entry of the columns menu. */
export type ColumnsMenuItem = {
  /** Column the entry shows or hides. */
  readonly id: PlaylistColumnId;
  /** i18n key of the entry's text; the same key as the column's header. */
  readonly labelKey: string;
  /** Whether the column is shown, i.e. the entry is checked. */
  readonly visible: boolean;
};

type Props = {
  /** The optional columns in declaration order. */
  readonly items: readonly ColumnsMenuItem[];
  /** Whether "Reset columns" would change anything; disables it otherwise. */
  readonly resettable: boolean;
  /** Shows or hides a column. */
  readonly onToggle: (columnId: PlaylistColumnId, visible: boolean) => void;
  /** Returns the visible columns and the widths to the defaults. */
  readonly onReset: () => void;
};

/**
 * Columns menu of the content toolbar
 * (`docs/specs/v1.3/features/column-visibility.md`): a checkbox per
 * optional column of the Playlist table, then "Reset columns". Toggling an
 * entry keeps the menu open so several columns can be switched in a row.
 * The pinned columns are not listed. The trigger is the toolbar's
 * `ClusterButton`: glowing icon, tooltip, and opt-out of the window drag
 * region.
 */
export const ColumnsMenu = ({
  items,
  resettable,
  onToggle,
  onReset,
}: Props) => {
  const t = useT();
  return (
    <DropdownMenu>
      <TooltipProvider delay={TOOLTIP_DELAY_MS}>
        <DropdownMenuTrigger
          render={
            <ClusterButton label={t("toolbar.columns")}>
              <Columns3 />
            </ClusterButton>
          }
        />
      </TooltipProvider>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.id}
            checked={item.visible}
            closeOnClick={false}
            onCheckedChange={(checked) => onToggle(item.id, checked)}
          >
            {t(item.labelKey)}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!resettable} onClick={onReset}>
          {t("toolbar.resetColumns")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
