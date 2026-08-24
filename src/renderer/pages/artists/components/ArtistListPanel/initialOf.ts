import { sortKeyWithoutArticle } from "@/features/library/compareNameWithoutArticle/sortKeyWithoutArticle";
import { type Initial, OTHER_INITIAL } from "./initials";

/**
 * Section key of an artist name. Shares the article-blind sort key with the
 * list order ("The Who" → `W`, "A Perfect Circle" → `P`) so every section is
 * contiguous in the sorted list; anything not starting with A–Z (digits,
 * symbols, non-Latin scripts, the empty "Unknown Artist" name) goes to
 * {@link OTHER_INITIAL}.
 *
 * @param name - Display name.
 * @returns The section key.
 */
export const initialOf = (name: string): Initial => {
  const first = sortKeyWithoutArticle(name).charAt(0);
  return /^[a-z]$/.test(first)
    ? (first.toUpperCase() as Initial)
    : OTHER_INITIAL;
};
