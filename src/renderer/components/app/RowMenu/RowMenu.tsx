import { MoreHorizontal } from "lucide-react";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleIconButton } from "../Buttons/CircleIconButton";

/** One plain entry of a {@link RowMenu}. */
export type RowMenuItem = {
  /** Menu text; also the React key, so labels are unique within a menu. */
  readonly label: string;
  /** Icon element rendered before the label (typically a lucide icon). */
  readonly icon?: ReactNode;
  /** Called when the entry is clicked; omit for an inert entry. */
  readonly onSelect?: () => void;
  /** Greys the entry out and ignores clicks; defaults to `false`. */
  readonly disabled?: boolean;
  /** Renders the entry in the destructive (red) style; defaults to `false`. */
  readonly destructive?: boolean;
  /** Draws a separator line above the entry; defaults to `false`. */
  readonly separatorBefore?: boolean;
};

type Props = {
  /**
   * Entries in display order: plain items, or ready-made menu elements
   * (e.g. `AddToPlaylistSubmenu`) rendered as given and keyed by position.
   */
  readonly items: ReadonlyArray<RowMenuItem | ReactElement>;
  /** Trigger look: the plain ghost icon (default) or a filled circle. */
  readonly variant?: "ghost" | "circle";
};

/**
 * The [...] dropdown shared by list headers, album sections, and track rows
 * (Artist / Album / Playlist views). Promoted out of the Artist page when
 * the Album view became its second consumer.
 *
 * Entries are plain items or ready-made menu elements — the latter lets
 * views splice in composite pieces like the "Add to playlist ▸" submenu.
 */
export const RowMenu = ({ items, variant = "ghost" }: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        variant === "circle" ? (
          <CircleIconButton aria-label="Menu" />
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="Menu" />
        )
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
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          </div>
        ),
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);
