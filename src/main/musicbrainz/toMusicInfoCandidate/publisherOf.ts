import type { Release } from "../schemas/releaseSchema";

/**
 * Read the publisher (`docs/specs/v1.2/architecture/metadata-mapping.md`):
 * the name of the first `label-info` entry that carries a label. Entries
 * holding only a catalog number have no label and are skipped.
 *
 * @param release - The looked-up release.
 * @returns The label name, or `null` when the release lists no label.
 */
export const publisherOf = (release: Release): string | null => {
  for (const info of release["label-info"] ?? []) {
    const name = info.label?.name.trim() ?? "";
    if (name !== "") {
      return name;
    }
  }

  return null;
};
