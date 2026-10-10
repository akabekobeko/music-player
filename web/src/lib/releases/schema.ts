import { z } from "zod";

/**
 * Shape of `GET /repos/{owner}/{repo}/releases`, declaring only the fields
 * the site reads (docs/specs/web/architecture/release-data.md). Drafts have
 * no `published_at` yet, hence nullable.
 */
export const releaseSchema = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.string(),
  published_at: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  assets: z.array(
    z.object({
      name: z.string(),
      browser_download_url: z.string(),
      size: z.number().int().nonnegative(),
    }),
  ),
});

export const releasesSchema = z.array(releaseSchema);

export type ReleaseResponse = z.infer<typeof releaseSchema>;
export type ReleaseAssetResponse = ReleaseResponse["assets"][number];
