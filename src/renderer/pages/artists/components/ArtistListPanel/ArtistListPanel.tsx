import { useState } from "react";
import { useMatch } from "react-router";
import { Stack } from "@/components/app/stacks";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { compareNameWithoutArticle } from "@/features/library/compareNameWithoutArticle/compareNameWithoutArticle";
import { useArtists } from "@/features/library/useArtists";
import { ARTIST_NAME_PATTERN, UNKNOWN_ARTIST_PATH } from "../../artistPath";
import { ArtistListRows } from "./ArtistListRows";

/**
 * Artist list in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/artist-view.md`): article-blind sort, client
 * text filter, virtual scrolling, and route-driven selection — the URL
 * (`/artists/name/:artistName`, `/artists/unknown` for the empty-name
 * bucket) is the single source of the selected artist (no Context state
 * like audio-player's `artistTab`).
 */
export const ArtistListPanel = () => {
  const t = useT();
  // The Sidebar lives in the layout route, whose context does not carry the
  // child route's params — match the patterns against the location instead.
  const artistName = useMatch(ARTIST_NAME_PATTERN)?.params.artistName;
  const unknownSelected = useMatch(UNKNOWN_ARTIST_PATH) !== null;
  const artistsState = useArtists();
  const [query, setQuery] = useState("");

  // Filter + sort are derived during render — never copied into state.
  const artists =
    artistsState.status === "success"
      ? artistsState.value
          .filter((artist) =>
            artist.name.toLowerCase().includes(query.trim().toLowerCase()),
          )
          .toSorted((a, b) => compareNameWithoutArticle(a.name, b.name))
      : [];

  return (
    <Stack className="h-full gap-0">
      <div className="p-2">
        <Input
          type="search"
          placeholder={t("artist.search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {artistsState.status === "error" && (
        <p className="break-all px-3 py-2 text-destructive text-xs">
          {t("library.loadFailed", { message: artistsState.error.message })}
        </p>
      )}
      {artistsState.status === "success" && artists.length === 0 && (
        <p className="px-3 py-2 text-muted-foreground text-xs">
          {t("artist.empty")}
        </p>
      )}
      {artistsState.status === "success" && (
        <ArtistListRows
          artists={artists}
          selectedName={unknownSelected ? "" : artistName}
        />
      )}
    </Stack>
  );
};
