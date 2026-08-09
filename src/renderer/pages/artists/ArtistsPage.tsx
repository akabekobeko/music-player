import { useParams } from "react-router";

/**
 * Artist view route (`/artists`, `/artists/:artistName`).
 *
 * Placeholder shell — the artist list, album grouping, and playback entry
 * points are implemented in Phase 4 (issue: Artist ビュー).
 */
export const ArtistsPage = () => {
  const { artistName } = useParams();
  return (
    <section className="p-6">
      <h1 className="text-lg font-semibold">Artists</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {/* Route params arrive already decoded — never decode them again. */}
        {artistName !== undefined
          ? `Selected: ${artistName}`
          : "アルバム・曲一覧は #42 で実装します。左の一覧からアーティストを選択できます。"}
      </p>
    </section>
  );
};
