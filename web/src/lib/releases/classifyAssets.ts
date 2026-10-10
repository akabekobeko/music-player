import type { ReleaseAssetResponse } from "./schema";
import {
  type AssetExt,
  type DownloadAsset,
  PLATFORMS,
  type Platform,
  PRIMARY_EXT,
} from "./types";

/**
 * electron-builder's `artifactName` (`${productName}-${version}-${os}-${arch}.${ext}`).
 * Linux carries a different arch name per format (`amd64` for deb, `x86_64`
 * for AppImage), so both are accepted.
 */
const ASSET_NAME =
  /^Parade-(?<version>\d+\.\d+\.\d+)-(?<os>mac|win|linux)-(?<arch>arm64|x64|amd64|x86_64)\.(?<ext>dmg|zip|exe|AppImage|deb)$/;

/** Formats offered per platform, primary first. */
const PLATFORM_EXTS: Readonly<Record<Platform, readonly AssetExt[]>> = {
  "mac-arm64": ["dmg", "zip"],
  "mac-x64": ["dmg", "zip"],
  "win-x64": ["exe", "zip"],
  "linux-x64": ["AppImage", "deb"],
};

const platformOf = (os: string, arch: string): Platform | undefined => {
  if (os === "mac" && arch === "arm64") return "mac-arm64";
  if (os === "mac" && arch === "x64") return "mac-x64";
  if (os === "win" && arch === "x64") return "win-x64";
  if (os === "linux" && (arch === "x86_64" || arch === "amd64")) {
    return "linux-x64";
  }
  return undefined;
};

export type ClassifiedAssets = {
  /** Assets per platform, primary format first. Empty when none matched. */
  readonly downloads: Readonly<Record<Platform, readonly DownloadAsset[]>>;
  /** Names of assets that did not match the naming rule, for the build log. */
  readonly unmatched: readonly string[];
};

/**
 * Sort release assets into the platforms of the download page by file name.
 * Anything outside the naming rule (checksums, unknown arch / format pairs)
 * is reported in `unmatched` and left off the page.
 *
 * @param assets - `assets` of one release response.
 * @returns Assets per platform plus the names that did not classify.
 */
export const classifyAssets = (
  assets: readonly ReleaseAssetResponse[],
): ClassifiedAssets => {
  const buckets: Record<Platform, DownloadAsset[]> = {
    "mac-arm64": [],
    "mac-x64": [],
    "win-x64": [],
    "linux-x64": [],
  };
  const unmatched: string[] = [];
  for (const asset of assets) {
    const groups = ASSET_NAME.exec(asset.name)?.groups;
    const platform =
      groups === undefined
        ? undefined
        : platformOf(groups.os ?? "", groups.arch ?? "");
    const ext = groups?.ext as AssetExt | undefined;
    if (
      platform === undefined ||
      ext === undefined ||
      !PLATFORM_EXTS[platform].includes(ext)
    ) {
      unmatched.push(asset.name);
      continue;
    }
    buckets[platform].push({
      name: asset.name,
      url: asset.browser_download_url,
      size: asset.size,
      ext,
    });
  }
  for (const platform of PLATFORMS) {
    const order = PLATFORM_EXTS[platform];
    buckets[platform].sort(
      (a, b) => order.indexOf(a.ext) - order.indexOf(b.ext),
    );
  }
  return { downloads: buckets, unmatched };
};

/**
 * Whether a platform's list starts with its recommended format. A card
 * without it only links to GitHub Releases.
 *
 * @param platform - Card platform.
 * @param assets - `downloads[platform]` of a release.
 * @returns The primary asset, or `undefined` when the release lacks it.
 */
export const primaryAsset = (
  platform: Platform,
  assets: readonly DownloadAsset[],
): DownloadAsset | undefined => {
  const first = assets[0];
  return first?.ext === PRIMARY_EXT[platform] ? first : undefined;
};
