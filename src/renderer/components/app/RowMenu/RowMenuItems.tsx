import { isValidElement, type ReactElement, type ReactNode } from "react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/** One plain entry of a row menu (`RowMenu` / the row's right-click menu). */
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

/**
 * Entries of a row menu in display order: plain items, or ready-made menu
 * elements (e.g. `AddToPlaylistSubmenu`) rendered as given and keyed by
 * position.
 */
export type RowMenuItems = ReadonlyArray<RowMenuItem | ReactElement>;

type Props = {
  /** Entries in display order. */
  readonly items: RowMenuItems;
};

/**
 * The entries of a row menu: the [...] dropdown (`RowMenu`) and the track
 * rows' right-click menu (`MusicRow`) share this so a row defines its
 * entries once. Built from the dropdown parts, which `context-menu.tsx`
 * shares (Base UI's context menu reuses the Menu parts), so the same
 * entries render inside either host.
 */
export const RowMenuEntries = ({ items }: Props) =>
  items.map((item, index) =>
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
  );
