import type { Artist } from "@mp/ipc";
import { initialOf } from "./initialOf";
import type { Initial } from "./initials";

/**
 * Section key of an artist: the user-chosen initial stored in the library
 * (`Artist.initial`, a capital letter A–Z) when there is one, otherwise the
 * automatic classification of the name ({@link initialOf}). Anything else
 * in `initial` (never produced by Main, but the bridge type is a plain
 * string) is ignored rather than trusted.
 *
 * @param artist - Artist row from the library.
 * @returns The section key.
 */
export const artistInitialOf = (artist: Artist): Initial =>
  artist.initial !== null && /^[A-Z]$/.test(artist.initial)
    ? (artist.initial as Initial)
    : initialOf(artist.name);
