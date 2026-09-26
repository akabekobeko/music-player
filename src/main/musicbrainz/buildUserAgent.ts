/**
 * Build the `User-Agent` sent with every MusicBrainz / Cover Art Archive
 * request (`docs/specs/v1.2/architecture/user-agent.md`).
 *
 * MusicBrainz requires a meaningful user agent naming the application and a
 * way to contact its maintainer; generic agents are throttled as anonymous.
 * The contact is the repository URL, the same for every user (the person
 * MusicBrainz would want to reach is the app's maintainer, not the user), so
 * there is no settings entry for it.
 *
 * @param version - The app version (`app.getVersion()`).
 * @returns The user agent string, e.g. `Parade/1.2.0 ( https://... )`.
 */
export const buildUserAgent = (version: string): string =>
  `Parade/${version} ( https://github.com/akabekobeko/music-player )`;
