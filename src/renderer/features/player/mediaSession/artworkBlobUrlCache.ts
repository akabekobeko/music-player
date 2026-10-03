import { toMediaFileUrl } from "@/libs/toMediaFileUrl";

/** Seams of {@link ArtworkBlobUrlCache} (injectable for unit tests). */
export type ArtworkBlobUrlDeps = {
  /**
   * Fetch the artwork bytes from its `media-file://` URL; aborting the
   * signal cancels a load that is no longer wanted.
   */
  readonly fetch: (url: string, signal: AbortSignal) => Promise<Response>;
  /** `URL.createObjectURL`. */
  readonly createObjectURL: (blob: Blob) => string;
  /** `URL.revokeObjectURL`. */
  readonly revokeObjectURL: (url: string) => void;
};

const BROWSER_DEPS: ArtworkBlobUrlDeps = {
  fetch: (url, signal) => fetch(url, { signal }),
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => {
    URL.revokeObjectURL(url);
  },
};

/** The artwork the cache holds, with the state of its load. */
type Entry = {
  /** Artwork file of the entry; `null` for a track without artwork. */
  readonly picturePath: string | null;
  /** Cancels the load when the entry is replaced before it finished. */
  readonly controller: AbortController;
  /**
   * Settles to the Blob URL, or to `null` when there is none (no artwork,
   * unreadable image, aborted load). Never rejects.
   */
  readonly pending: Promise<string | null>;
  /** The Blob URL once {@link Entry.pending} settled with one. */
  url: string | null;
};

/**
 * Blob URL of the current track's artwork for MediaSession
 * (`docs/specs/v1.0/features/player-ui.md`).
 *
 * Chromium accepts only http / https / data / blob in `MediaImage.src`, so
 * the `media-file://` image is fetched and re-exposed as a Blob URL. A Blob
 * URL rather than a `data:` URL: no base64 copy of the image, and no risk
 * of a large cover exceeding Chromium's URL length limit.
 *
 * Holds exactly one entry - the artwork of the track MediaSession shows.
 * Switching to another image aborts or revokes the previous one, so nothing
 * leaks however many tracks are played. A class because the entry is
 * mutable state shared by every metadata update.
 */
export class ArtworkBlobUrlCache {
  readonly #deps: ArtworkBlobUrlDeps;
  #entry: Entry;

  /**
   * @param deps - Browser APIs; replaced by fakes in unit tests.
   */
  constructor(deps: ArtworkBlobUrlDeps = BROWSER_DEPS) {
    this.#deps = deps;
    this.#entry = this.#open(null);
  }

  /**
   * Read the Blob URL when it is already loaded for this artwork.
   *
   * @param picturePath - Artwork path of the track, or `null` without one.
   * @returns The URL, or `null` when it is not loaded (yet).
   */
  peek(picturePath: string | null): string | null {
    return picturePath === this.#entry.picturePath ? this.#entry.url : null;
  }

  /**
   * Make this artwork the current entry and load its Blob URL. Asking for
   * the artwork already held shares its load (a failed one included - the
   * image is not fetched again until the artwork changes); any other value,
   * `null` included, releases the previous entry.
   *
   * @param picturePath - Artwork path of the track, or `null` without one.
   * @returns The Blob URL, or `null` when the track has no artwork, the
   *   image could not be read, or a later call replaced the entry meanwhile.
   */
  load(picturePath: string | null): Promise<string | null> {
    if (picturePath !== this.#entry.picturePath) {
      this.#release(this.#entry);
      this.#entry = this.#open(picturePath);
    }

    const entry = this.#entry;
    return entry.pending.then((url) => (this.#entry === entry ? url : null));
  }

  #open(picturePath: string | null): Entry {
    const controller = new AbortController();
    const entry: Entry = {
      picturePath,
      controller,
      pending:
        picturePath === null
          ? Promise.resolve(null)
          : this.#createBlobUrl(picturePath, controller.signal).then((url) => {
              entry.url = url;
              return url;
            }),
      url: null,
    };
    return entry;
  }

  #release(entry: Entry): void {
    // Stop a load still in flight: skipping across albums must not read
    // every skipped cover in full.
    entry.controller.abort();
    // Chained to the load, so a URL created despite the abort is revoked
    // as well.
    void entry.pending.then((url) => {
      if (url !== null) {
        this.#deps.revokeObjectURL(url);
      }
    });
  }

  async #createBlobUrl(
    picturePath: string,
    signal: AbortSignal,
  ): Promise<string | null> {
    try {
      const response = await this.#deps.fetch(
        toMediaFileUrl(picturePath),
        signal,
      );
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return signal.aborted ? null : this.#deps.createObjectURL(blob);
    } catch {
      // The artwork is optional: the OS controls just show none.
      return null;
    }
  }
}

/** The app-wide cache behind `updateMediaSessionMetadata`. */
export const artworkBlobUrlCache = new ArtworkBlobUrlCache();
