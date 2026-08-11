import { useParams } from "react-router";
import { useT } from "@/features/i18n/useT";
import { ArtistContent } from "./ArtistContent";

/**
 * Artist view content (`/artists/:artistName`)
 * (`docs/specs/v1.0/features/artist-view.md`): header (Play / Shuffle /
 * menu), album sections, and the playback wiring — every action only calls
 * PlayerCommands; the view never manages queue contents itself.
 */
export const PageContent = () => {
  const t = useT();
  const { artistName } = useParams();
  return (
    <div className="h-full">
      {artistName !== undefined ? (
        <ArtistContent key={artistName} artistName={artistName} />
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
