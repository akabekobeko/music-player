import type { Dictionary } from "./types";

/**
 * Japanese translation table.
 *
 * Mirrors the key set defined by `en`. New keys are added in `en.ts` first
 * and then translated here; `t.test.ts` enforces parity so a missing key is
 * caught before runtime.
 */
export const ja: Dictionary = {
  "app.name": "Music Player",
  "dialog.db.downgrade.title": "起動できません",
  "dialog.db.downgrade.message":
    "ライブラリー データベースは新しいバージョンの {appName} で作成されています。アプリを更新してください。",
  "dialog.db.migrationFailed.title": "データベース エラー",
  "dialog.db.migrationFailed.message":
    "ライブラリー データベースの更新に失敗しました: {message}",
};
