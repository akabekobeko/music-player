import { MoreHorizontal } from "lucide-react";
import { isValidElement, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** One plain entry of a {@link RowMenu}. */
export type RowMenuItem = {
  readonly label: string;
  readonly onSelect?: () => void;
  readonly disabled?: boolean;
  readonly destructive?: boolean;
  readonly separatorBefore?: boolean;
};

type Props = {
  readonly items: ReadonlyArray<RowMenuItem | ReactElement>;
  /** Extra classes for the [⋯] trigger button (e.g. a filled circle). */
  readonly triggerClassName?: string;
};

/**
 * The [⋯] dropdown shared by list headers, album sections, and track rows
 * (Artist / Album / Playlist views). Promoted out of the Artist page when
 * the Album view became its second consumer.
 *
 * Entries are plain items or ready-made menu elements — the latter lets
 * views splice in composite pieces like the "Add to playlist ▸" submenu.
 */
export const RowMenu = ({ items, triggerClassName }: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Menu"
          className={triggerClassName}
        />
      }
    >
      <MoreHorizontal />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {items.map((item, index) =>
        isValidElement(item) ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: menu entries are a short static list; elements carry no natural key.
          <div key={index}>{item}</div>
        ) : (
          <div key={item.label}>
            {item.separatorBefore === true && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={item.disabled}
              variant={item.destructive === true ? "destructive" : "default"}
              onClick={item.onSelect}
            >
              {item.label}
            </DropdownMenuItem>
          </div>
        ),
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);
