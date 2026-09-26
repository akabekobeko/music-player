import type { RecordingRelation, WorkRelation } from "../schemas/releaseSchema";

/**
 * Collect the names of the artists related by `type`
 * (`docs/specs/v1.2/architecture/metadata-mapping.md`).
 *
 * Only `artist` targets are read. The credited name (`target-credit`) wins
 * over the canonical `artist.name`, for the same reason the artist credit
 * uses credited names. Duplicates are dropped, keeping first appearance
 * order. Names are returned as a list so callers merging several sources
 * (the works of a medley) can dedupe before `joinNames` joins them once.
 *
 * @param relations - Relationships of a recording or a work.
 * @param type - Relationship name to collect (`"producer"`, `"composer"`, ...).
 * @returns The distinct names; empty when nobody matches.
 */
export const relatedArtistsOf = (
  relations: ReadonlyArray<RecordingRelation | WorkRelation> | undefined,
  type: string,
): readonly string[] => {
  const names: string[] = [];
  for (const relation of relations ?? []) {
    if (relation.type !== type || relation["target-type"] !== "artist") {
      continue;
    }

    const credit = relation["target-credit"]?.trim() ?? "";
    const name = credit !== "" ? credit : (relation.artist?.name.trim() ?? "");
    if (name !== "" && !names.includes(name)) {
      names.push(name);
    }
  }

  return names;
};
