import type { AlbumFilter } from "@mp/ipc";

/** Whether any filter kind is active. */
export const hasActiveFilter = (filter: AlbumFilter): boolean =>
  (filter.text ?? "") !== "" ||
  (filter.genres?.length ?? 0) > 0 ||
  (filter.decades?.length ?? 0) > 0;
