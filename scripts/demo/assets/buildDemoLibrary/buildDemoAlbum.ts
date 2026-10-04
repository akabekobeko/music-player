import { createHash } from "node:crypto";
import type { SeededRandom } from "../SeededRandom.ts";
import { GENRE_PROFILES, PUBLISHERS } from "../seed/vocabulary.ts";
import type {
  DemoAlbum,
  DemoArtistSeed,
  DemoAudioFormat,
  DemoGenre,
  DemoTrack,
} from "../types.ts";
import { fileNameOf } from "./fileNameOf.ts";
import { pickTrackTitles } from "./pickTrackTitles.ts";
import { slugOf } from "./slugOf.ts";

/** Length of the playable track in milliseconds (1:47). */
export const PLAYABLE_DURATION_MS = 107_000;

/** Import timestamp of the playable album; newer than every other album. */
const PLAYABLE_ADDED_AT = "2026-10-01T09:00:00.000Z";

/** Earliest import timestamp of the other albums. */
const ADDED_AT_START_MS = Date.UTC(2024, 2, 1);

/** Width of the window the other import timestamps fall into, in seconds. */
const ADDED_AT_SPAN_SEC = 930 * 24 * 60 * 60;

/** Formats to draw from; repeated entries weight the draw. */
const FORMATS: readonly DemoAudioFormat[] = [
  "m4a",
  "m4a",
  "m4a",
  "m4a",
  "flac",
  "flac",
  "flac",
  "mp3",
  "mp3",
];

/** Ratings to draw from; repeated entries weight the draw. */
const RATINGS = [0.4, 0.6, 0.6, 0.8, 0.8, 0.8, 1, 1] as const;

/** Genres whose albums are occasionally released as a double album. */
const DOUBLE_ALBUM_GENRES: readonly DemoGenre[] = [
  "Rock",
  "Pop",
  "Jazz",
  "Electronic",
  "Blues",
  "Folk",
];

/** Inputs of {@link buildDemoAlbum}. */
type Params = {
  /** Random source of the artist. */
  readonly rng: SeededRandom;
  /** Artist the album belongs to. */
  readonly seed: DemoArtistSeed;
  /** Zero-based index of the album, oldest first. */
  readonly index: number;
  /** Album title. */
  readonly title: string;
  /** Release year, `null` when the album has no year tag. */
  readonly year: number | null;
  /** Genre of the album. */
  readonly genre: DemoGenre;
  /** People who write the songs; the first one writes most of them. */
  readonly writers: readonly string[];
  /** Person credited as producer. */
  readonly producer: string;
  /** Person credited as conductor on orchestral albums. */
  readonly conductor: string;
  /**
   * Names of the other artists of the library, the candidates for a guest
   * credit. No track gets a guest when the list is empty.
   */
  readonly guests: readonly string[];
};

/**
 * Build one album and its tracks.
 *
 * The album that holds the playable track gets a fixed format, timestamp
 * and first track; every other value is drawn from the genre profile.
 *
 * @param params - See {@link Params}.
 * @returns The album.
 */
export const buildDemoAlbum = ({
  rng,
  seed,
  index,
  title,
  year,
  genre,
  writers,
  producer,
  conductor,
  guests,
}: Params): DemoAlbum => {
  const profile = GENRE_PROFILES[genre];
  const playable =
    seed.playable?.albumIndex === index ? seed.playable : undefined;
  const double = DOUBLE_ALBUM_GENRES.includes(genre) && rng.chance(0.06);
  const count = double ? rng.int(18, 24) : rng.int(...profile.tracks);
  const firstDiscCount = double ? Math.ceil(count / 2) : count;
  const audioFormat = playable ? "m4a" : rng.pick(FORMATS);
  const publisher = rng.pick(PUBLISHERS);
  const addedAt = playable
    ? PLAYABLE_ADDED_AT
    : new Date(
        ADDED_AT_START_MS + rng.int(0, ADDED_AT_SPAN_SEC) * 1000,
      ).toISOString();
  const titles = pickTrackTitles({
    rng,
    genre,
    count,
    japanese: /[^ -~]/.test(seed.name),
  });
  // An orchestral album presents the works of one composer.
  const albumComposer = profile.conducted ? rng.pick(writers) : undefined;
  const directory = `musics/${fileNameOf(seed.name)}/${fileNameOf(title)}`;

  const tracks = titles.map((drawnTitle, position): DemoTrack => {
    const isPlayable = playable !== undefined && position === 0;
    const trackTitle = isPlayable ? playable.trackTitle : drawnTitle;
    const disc = position < firstDiscCount ? 1 : 2;
    const track = disc === 1 ? position + 1 : position + 1 - firstDiscCount;
    const number = String(track).padStart(2, "0");
    const prefix = double ? `${disc}-${number}` : number;
    const guest =
      !isPlayable && guests.length > 0 && rng.chance(profile.guestChance)
        ? rng.pick(guests)
        : undefined;
    const drawnComposer = rng.chance(0.75)
      ? (writers[0] ?? "")
      : rng.pick(writers);
    const composer = isPlayable
      ? (writers[0] ?? "")
      : (albumComposer ?? drawnComposer);
    const durationMs = rng.int(
      profile.seconds[0] * 1000,
      profile.seconds[1] * 1000,
    );
    const bpm = rng.chance(0.65) ? rng.int(...profile.bpm) : null;
    const rating = rng.chance(0.3) ? rng.pick(RATINGS) : null;

    return {
      filePath: `${directory}/${prefix} ${fileNameOf(trackTitle)}.${audioFormat}`,
      audioFormat,
      title: trackTitle,
      artist: guest ? `${seed.name} feat. ${guest}` : seed.name,
      albumArtist: seed.name,
      album: title,
      disc,
      track,
      year,
      genre,
      composer,
      lyricist: profile.vocal ? rng.pick(writers) : "",
      producer,
      conductor: profile.conducted ? conductor : "",
      publisher,
      durationMs: isPlayable ? PLAYABLE_DURATION_MS : durationMs,
      bpm: isPlayable ? 120 : bpm,
      rating: isPlayable ? 1 : rating,
      addedAt,
      playable: isPlayable,
    };
  });

  const artistSlug = seed.slug ?? slugOf(seed.name);
  const albumSlug = slugOf(title) || `album-${index + 1}`;
  // The title is printed on the cover, so the file name carries a hash of
  // it: a rename the slug does not reflect (a Japanese title, a change of
  // case) still yields a new file and the cover is rendered again.
  const titleHash = createHash("sha256")
    .update(`${seed.name}/${title}`)
    .digest("hex")
    .slice(0, 8);
  return {
    artist: seed.name,
    title,
    year,
    genre,
    coverPath: `images/albums/${artistSlug}--${albumSlug}-${titleHash}.jpg`,
    tracks,
  };
};
