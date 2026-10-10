/** Download targets shown on the download page, in the default card order. */
export const PLATFORMS = [
  "mac-arm64",
  "mac-x64",
  "win-x64",
  "linux-x64",
] as const;

export type Platform = (typeof PLATFORMS)[number];

/** Extensions electron-builder emits for the release assets. */
export type AssetExt = "dmg" | "zip" | "exe" | "AppImage" | "deb";

/** The format recommended on each platform's card (its filled button). */
export const PRIMARY_EXT: Readonly<Record<Platform, AssetExt>> = {
  "mac-arm64": "dmg",
  "mac-x64": "dmg",
  "win-x64": "exe",
  "linux-x64": "AppImage",
};

/** One downloadable file of a release. */
export type DownloadAsset = {
  /** File name on the release, shown as the secondary label. */
  readonly name: string;
  /** `browser_download_url` of the asset. */
  readonly url: string;
  /** Size in bytes. */
  readonly size: number;
  /** Extension without the dot, used to pick the label and the icon. */
  readonly ext: AssetExt;
};

/** The release the download page presents. */
export type LatestRelease = {
  /** Tag such as `v1.3.0`. */
  readonly tag: string;
  /** Version without the `v`. */
  readonly version: string;
  /** Release page on GitHub. */
  readonly url: string;
  /** `published_at` of the release. */
  readonly publishedAt: Date;
  /** Assets per platform, primary first. */
  readonly downloads: Readonly<Record<Platform, readonly DownloadAsset[]>>;
};
