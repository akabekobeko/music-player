import type { Dirent } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { isAudioFile } from "./audioExtensions";

/**
 * Maximum directory depth walked below a dropped root
 * (`docs/specs/v1.0/features/library.md`): deep enough for
 * `音楽ルート/フォーマット別/アーティスト/アルバム/曲`, shallow enough that an
 * accidentally dropped home directory cannot explode the scan.
 */
export const MAX_SCAN_DEPTH = 5;

/**
 * Expand dropped / selected paths into the audio files they contain.
 *
 * Traversal rules (issue #31):
 * - Queue-based iteration, never recursion — a deep tree cannot overflow
 *   the stack.
 * - Directories are walked at most {@link MAX_SCAN_DEPTH} levels below each
 *   dropped root.
 * - Symbolic links are skipped entirely (no cycle following, no escaping
 *   the dropped tree).
 * - Non-existent paths and unreadable directories are skipped silently;
 *   per-file problems are the importer's concern, not the expander's.
 *
 * @param inputPaths - Mix of file and directory paths from D&D or the picker.
 * @returns Sorted, de-duplicated audio file paths.
 */
export const expandAudioPaths = async (
  inputPaths: readonly string[],
): Promise<string[]> => {
  const files = new Set<string>();
  /** Pending directories, each with its depth below the dropped root. */
  const queue: Array<{ dir: string; depth: number }> = [];

  for (const inputPath of inputPaths) {
    try {
      const stats = await lstat(inputPath);
      if (stats.isSymbolicLink()) {
        continue;
      }

      if (stats.isDirectory()) {
        queue.push({ dir: inputPath, depth: 0 });
      } else if (stats.isFile() && isAudioFile(inputPath)) {
        files.add(inputPath);
      }
    } catch {
      // Vanished or unreadable path — nothing to expand.
    }
  }

  while (queue.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: length checked above
    const { dir, depth } = queue.shift()!;
    let entries: Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }

      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (depth + 1 <= MAX_SCAN_DEPTH) {
          queue.push({ dir: entryPath, depth: depth + 1 });
        }
      } else if (entry.isFile() && isAudioFile(entryPath)) {
        files.add(entryPath);
      }
    }
  }

  return [...files].sort();
};
