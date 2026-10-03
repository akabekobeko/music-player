import type { ReactNode } from "react";

type Props = {
  /** Height in px of all rows, from the virtualiser's `getTotalSize()`. */
  readonly height: number;
  /** The `PlaylistTableRow`s of the rendered (virtual) range. */
  readonly children: ReactNode;
};

/**
 * Body of the Playlist table: a block as tall as all rows together, in
 * which the rendered rows position themselves absolutely.
 */
export const PlaylistTableBody = ({ height, children }: Props) => (
  <tbody
    // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
    role="rowgroup"
    className="relative block"
    style={{ height }}
  >
    {children}
  </tbody>
);
