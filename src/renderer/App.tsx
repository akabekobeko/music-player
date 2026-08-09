import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "@/components/app/AppLayout/AppLayout";
import { AlbumsPage } from "@/pages/albums/AlbumsPage";
import { ArtistsPage } from "@/pages/artists/ArtistsPage";
import { PlaylistsPage } from "@/pages/playlists/PlaylistsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

/**
 * Route table (`docs/specs/v1.0/renderer/routing-layout.md`). Selection
 * state (artist, playlist) lives in the URL so mod+[ style history
 * navigation works; playback state is independent of the route.
 */
const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to="/artists" replace />} />
      <Route path="artists/:artistName?" element={<ArtistsPage />} />
      <Route path="albums" element={<AlbumsPage />} />
      <Route path="playlists/:playlistId?" element={<PlaylistsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/artists" replace />} />
    </Route>
  </Routes>
);

export default App;
