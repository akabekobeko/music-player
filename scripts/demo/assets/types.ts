/** Genres used by the demo library. */
export type DemoGenre =
  | "Rock"
  | "Pop"
  | "Jazz"
  | "Electronic"
  | "Classical"
  | "Folk"
  | "Hip Hop"
  | "Blues"
  | "Ambient"
  | "Soundtrack";

/** Audio formats the demo tracks pretend to be stored in. */
export type DemoAudioFormat = "m4a" | "flac" | "mp3";

/** The one track that has a real audio file. */
export type DemoPlayableSeed = {
  /** Zero-based index of the album that holds the track, oldest first. */
  readonly albumIndex: number;
  /** Fixed title of that album. */
  readonly albumTitle: string;
  /** Fixed title of the track; it is the first track of the album. */
  readonly trackTitle: string;
};

/** Hand-written definition of one fictional artist. */
export type DemoArtistSeed = {
  /** Display name. Also the album artist of every album. */
  readonly name: string;
  /**
   * File name stem for names without ASCII letters or digits. Derived from
   * the name when omitted.
   */
  readonly slug?: string;
  /**
   * Whether the name is a single person, who then writes most of the songs.
   * Groups get their writers from a made-up line-up instead.
   */
  readonly person?: boolean;
  /** Main genre; most albums use it. */
  readonly genre: DemoGenre;
  /** Release year of the first album. */
  readonly startYear: number;
  /** Number of albums, 1 to 15. */
  readonly albumCount: number;
  /** Set on the artist that owns the playable track. */
  readonly playable?: DemoPlayableSeed;
};

/** One row of the `musics` table. */
export type DemoTrack = {
  /**
   * Path relative to the assets directory with `/` separators
   * (`musics/<artist>/<album>/<file>`). Unique in the library. Only the
   * playable track has a file there.
   */
  readonly filePath: string;
  /** Container format; matches the extension of `filePath`. */
  readonly audioFormat: DemoAudioFormat;
  /** Track title. */
  readonly title: string;
  /** Track artist; differs from `albumArtist` on guest tracks. */
  readonly artist: string;
  /** Album artist, the display artist of the Artist view. */
  readonly albumArtist: string;
  /** Album title. */
  readonly album: string;
  /** Disc number, 1-based. */
  readonly disc: number;
  /** Track number within the disc, 1-based. */
  readonly track: number;
  /** Release year, `null` when the album has no year tag. */
  readonly year: number | null;
  /** Genre of the album. */
  readonly genre: DemoGenre;
  /** Composer credit, empty when unset. */
  readonly composer: string;
  /** Lyricist credit, empty on instrumental tracks. */
  readonly lyricist: string;
  /** Producer credit of the album. */
  readonly producer: string;
  /** Conductor credit, set on orchestral albums only. */
  readonly conductor: string;
  /** Publisher (label) of the album. */
  readonly publisher: string;
  /** Length in milliseconds. */
  readonly durationMs: number;
  /** Beats per minute, `null` when unset. */
  readonly bpm: number | null;
  /** Rating normalised to `[0, 1]`, `null` when unrated. */
  readonly rating: number | null;
  /** ISO-8601 timestamp used for both `added_at` and `updated_at`. */
  readonly addedAt: string;
  /** Whether this is the one track with a real audio file. */
  readonly playable: boolean;
};

/** One album with its cover and tracks. */
export type DemoAlbum = {
  /** Album artist. */
  readonly artist: string;
  /** Album title, unique within the artist. */
  readonly title: string;
  /** Release year, `null` when the album has no year tag. */
  readonly year: number | null;
  /** Genre shared by every track. */
  readonly genre: DemoGenre;
  /**
   * Cover image path relative to the assets directory
   * (`images/albums/<artist>--<album>-<hash>.jpg`; the hash is derived
   * from the artist and title).
   */
  readonly coverPath: string;
  /** Tracks in disc and track order. */
  readonly tracks: readonly DemoTrack[];
};

/** One artist with its picture and albums. */
export type DemoArtist = {
  /** Display name. */
  readonly name: string;
  /**
   * Artist picture path relative to the assets directory
   * (`images/artists/<artist>.jpg`).
   */
  readonly picturePath: string;
  /** Albums, oldest first. */
  readonly albums: readonly DemoAlbum[];
};

/** A static playlist. */
export type DemoPlaylist = {
  /** Playlist name. */
  readonly name: string;
  /** Tracks in playlist order. */
  readonly tracks: readonly DemoTrack[];
};

/** A smart playlist. */
export type DemoSmartPlaylist = {
  /** Playlist name. */
  readonly name: string;
  /**
   * Rule document as stored in `smart_playlists.rules`
   * (`src/shared/schemas/smartPlaylistRulesSchema.ts`).
   */
  readonly rules: unknown;
};

/** Everything the demo database holds. */
export type DemoLibrary = {
  /** Artists in seed order. */
  readonly artists: readonly DemoArtist[];
  /** Static playlists in sidebar order. */
  readonly playlists: readonly DemoPlaylist[];
  /** Smart playlists in sidebar order. */
  readonly smartPlaylists: readonly DemoSmartPlaylist[];
  /** The one track with a real audio file. */
  readonly playableTrack: DemoTrack;
};
