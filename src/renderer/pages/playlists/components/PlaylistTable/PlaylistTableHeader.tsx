import { useT } from "@/features/i18n/useT";
import type {
  PlaylistColumn,
  PlaylistColumnId,
} from "@/features/playlistColumns/types";
import { cn } from "@/libs/utils";
import {
  PLAYLIST_TABLE_HEADER_HEIGHT,
  PLAYLIST_TABLE_PADDING_X,
} from "./constants";

type Props = {
  /** Visible columns in display order. */
  readonly columns: readonly PlaylistColumn[];
  /** Displayed width in px of a column; shared with the body cells. */
  readonly widthOf: (columnId: PlaylistColumnId) => number;
};

/**
 * Header row of the Playlist table, fixed to the top of the scroll
 * container. The opaque background hides the rows scrolling beneath, and
 * the header stacks above the playing row so its glow never bleeds into the
 * header. The glow also reaches into the scroll container's horizontal
 * padding, outside the header's box, so two unblurred shadows in the
 * background colour extend the cover over the padding on both sides.
 */
export const PlaylistTableHeader = ({ columns, widthOf }: Props) => {
  const t = useT();
  return (
    <thead
      // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
      role="rowgroup"
      className="sticky top-0 z-[2] block border-b bg-background"
      style={{
        height: PLAYLIST_TABLE_HEADER_HEIGHT,
        boxShadow: `${PLAYLIST_TABLE_PADDING_X}px 0 var(--background), -${PLAYLIST_TABLE_PADDING_X}px 0 var(--background)`,
      }}
    >
      <tr
        // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
        role="row"
        className="flex h-full items-center"
      >
        {columns.map((column) => (
          <th
            key={column.id}
            // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
            role="columnheader"
            scope="col"
            className={cn(
              "shrink-0 truncate px-2 font-medium text-muted-foreground text-xs",
              column.align === "end" ? "text-end" : "text-start",
            )}
            style={{ width: widthOf(column.id) }}
          >
            {column.labelKey !== null && t(column.labelKey)}
          </th>
        ))}
      </tr>
    </thead>
  );
};
