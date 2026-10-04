import { z } from "zod";

/** Wikimedia Commons API endpoint. */
const API_URL = "https://commons.wikimedia.org/w/api.php";

/** Identifies the script to Wikimedia, as its User-Agent policy asks. */
export const COMMONS_USER_AGENT =
  "ParadeDemoAssets/1.0 (https://github.com/akabekobeko/parade)";

/** Titles per request; the API accepts up to 50. */
const BATCH_SIZE = 50;

/** One text value of the `extmetadata` block. */
const metadataValueSchema = z.object({
  /** The value; HTML for fields such as `Artist`. */
  value: z.string(),
});

/** The parts of the `imageinfo` query response this script reads. */
const responseSchema = z.object({
  /** Query result. */
  query: z.object({
    /**
     * Titles the API rewrote into their canonical form (underscores to
     * spaces, first letter capitalised). Absent when none was rewritten.
     */
    normalized: z
      .array(
        z.object({
          /** Title as passed in. */
          from: z.string(),
          /** Canonical title the page is listed under. */
          to: z.string(),
        }),
      )
      .optional(),
    /** Pages keyed by page id; negative ids mark missing titles. */
    pages: z.record(
      z.string(),
      z.object({
        /** Normalised page title (`File:...`). */
        title: z.string(),
        /** Absent when the file does not exist. */
        imageinfo: z
          .array(
            z.object({
              /** URL of the scaled image. */
              thumburl: z.string(),
              /** URL of the file description page. */
              descriptionurl: z.string(),
              /** License and author as declared on the description page. */
              extmetadata: z.object({
                /** Machine-readable license id such as `cc0`. */
                License: metadataValueSchema.optional(),
                /** Human-readable license name such as `CC0`. */
                LicenseShortName: metadataValueSchema.optional(),
                /** Author credit as HTML. */
                Artist: metadataValueSchema.optional(),
              }),
            }),
          )
          .optional(),
      }),
    ),
  }),
});

/** A Commons file with its license and author. */
export type CommonsImage = {
  /** Page title (`File:...`). */
  readonly title: string;
  /** URL of the image scaled to the requested width. */
  readonly imageUrl: string;
  /** URL of the file description page, the source to credit. */
  readonly pageUrl: string;
  /** Machine-readable license id such as `cc0`; empty when undeclared. */
  readonly license: string;
  /** Human-readable license name such as `CC0`; empty when undeclared. */
  readonly licenseName: string;
  /** Author credit as plain text; empty when undeclared. */
  readonly author: string;
};

/**
 * Reduce an HTML fragment to plain text.
 *
 * @param html - Fragment such as the `Artist` credit.
 * @returns The text without tags, with the common entities decoded.
 */
const textOf = (html: string): string =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Clean up the author credit Commons reports.
 *
 * @param html - `Artist` value of the metadata, as HTML.
 * @returns The credit as plain text, without the `Creator:` template
 *   prefix and with the doubled "Unknown author" placeholder reduced to one.
 */
const authorOf = (html: string): string =>
  textOf(html)
    .replace(/^Creator:/, "")
    .replace(/^(Unknown author)+$/, "Unknown author");

/**
 * Look up files on Wikimedia Commons with their license and author.
 *
 * @param titles - Page titles (`File:...`).
 * @param width - Width in pixels of the scaled image URL to return.
 * @param request - `fetch` implementation; tests inject a fake.
 * @returns The files that exist, keyed by the title as passed in.
 */
export const fetchCommonsImages = async (
  titles: readonly string[],
  width: number,
  request: typeof fetch = fetch,
): Promise<Map<string, CommonsImage>> => {
  const found = new Map<string, CommonsImage>();
  for (let start = 0; start < titles.length; start += BATCH_SIZE) {
    const batch = titles.slice(start, start + BATCH_SIZE);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      titles: batch.join("|"),
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiextmetadatafilter: "License|LicenseShortName|Artist",
      iiurlwidth: String(width),
    });
    const response = await request(`${API_URL}?${params}`, {
      headers: { "User-Agent": COMMONS_USER_AGENT },
    });
    if (!response.ok) {
      throw new Error(`Commons API failed: ${response.status}`);
    }

    const { query } = responseSchema.parse(await response.json());
    const canonical = new Map(
      (query.normalized ?? []).map(({ from, to }) => [from, to]),
    );
    const pages = new Map(
      Object.values(query.pages).map((page) => [page.title, page]),
    );
    for (const title of batch) {
      const page = pages.get(canonical.get(title) ?? title);
      const info = page?.imageinfo?.[0];
      if (page === undefined || info === undefined) {
        continue;
      }

      found.set(title, {
        title: page.title,
        imageUrl: info.thumburl,
        pageUrl: info.descriptionurl,
        license: info.extmetadata.License?.value ?? "",
        licenseName: info.extmetadata.LicenseShortName?.value ?? "",
        author: authorOf(info.extmetadata.Artist?.value ?? ""),
      });
    }
  }

  return found;
};
