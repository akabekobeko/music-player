import { useVirtualizer } from "@tanstack/react-virtual";
import { UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { Stack } from "@/components/app/stacks";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { compareNameWithoutArticle } from "@/features/library/compareNameWithoutArticle/compareNameWithoutArticle";
import { useArtists } from "@/features/library/useArtists";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { cn } from "@/libs/utils";

/** Fixed row height for the virtualizer (px). */
const ROW_HEIGHT = 48;

/**
 * Artist list in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/artist-view.md`): article-blind sort, client
 * text filter, virtual scrolling, and route-driven selection — the URL
 * (`/artists/:artistName`) is the single source of the selected artist
 * (no Context state like audio-player's `artistTab`).
 */
export const ArtistListPanel = () => {
  const t = useT();
  const navigate = useNavigate();
  // The Sidebar lives in the layout route, whose context does not carry the
  // child route's params — match the pattern against the location instead.
  const artistName = useMatch("/artists/:artistName")?.params.artistName;
  const artistsState = useArtists();
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Filter + sort are derived during render — never copied into state.
  const artists =
    artistsState.status === "success"
      ? artistsState.value
          .filter((artist) =>
            artist.name.toLowerCase().includes(query.trim().toLowerCase()),
          )
          .toSorted((a, b) => compareNameWithoutArticle(a.name, b.name))
      : [];

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const artist = artists[item.index];
            if (artist === undefined) {
              return null;
            }

            const selected = artist.name === artistName;
            return (
              <button
                key={artist.name}
                type="button"
                className={cn(
                  "absolute top-0 left-0 flex w-full items-center gap-2 px-3 text-left text-sm",
                  selected
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
                )}
                style={{
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
                onClick={() => {
                  navigate(`/artists/${encodeURIComponent(artist.name)}`);
                }}
              >
                {artist.picturePath !== null ? (
                  <img
                    src={toMediaFileUrl(artist.picturePath)}
                    alt=""
                    className="size-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UserRound
                      aria-hidden
                      className="size-4 text-muted-foreground"
                    />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <EllipsisText
                    text={
                      artist.name !== "" ? artist.name : t("artist.unknown")
                    }
                  />
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {t("artist.songs", { count: artist.musicCount })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Stack>
  );
};
