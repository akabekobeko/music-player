import type { ReactNode } from "react";

type Props = {
  /** Table width in px: the sum of the displayed column widths. */
  readonly width: number;
  /** `PlaylistTableHeader` followed by `PlaylistTableBody`. */
  readonly children: ReactNode;
};

/**
 * Track table of the Playlist view
 * (`docs/specs/v1.3/architecture/table-structure.md`). Uses the table
 * elements without the table layout algorithm: every level is a block and
 * the rows are flex containers whose cells take their widths in px, so the
 * header and the body cells line up by construction. Overriding `display`
 * drops the implicit table semantics, hence the explicit roles here and in
 * the header, body, and row components.
 */
export const PlaylistTable = ({ width, children }: Props) => (
  <table
    // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
    role="table"
    className="block"
    style={{ width }}
  >
    {children}
  </table>
);
