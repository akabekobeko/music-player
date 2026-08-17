import { useMatch, useParams } from "react-router";
import { useT } from "@/features/i18n/useT";
import { UNKNOWN_ARTIST_PATH } from "../artistPath";
import { ArtistContent } from "./ArtistContent";

/**
 * Artist view content (`/artists/name/:artistName`, `/artists/unknown`)
 * (`docs/specs/v1.0/features/artist-view.md`): header (Play / Shuffle /
 * menu), album sections, and the playback wiring — every action only calls
 * PlayerCommands; the view never manages queue contents itself.
 */
export const PageContent = () => {
  const t = useT();
  const { artistName } = useParams();
  // The reserved unknown path selects the empty-name artist bucket.
  const selected = useMatch(UNKNOWN_ARTIST_PATH) !== null ? "" : artistName;
  return (
    <div className="h-full">
      {selected !== undefined ? (
        <ArtistContent key={selected} artistName={selected} />
      ) : (
        <section className="p-6">
          <p className="text-muted-foreground text-sm">
            {t("artist.selectPrompt")}
          </p>
        </section>
      )}
    </div>
  );
};
