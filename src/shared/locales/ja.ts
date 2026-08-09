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
  "sidebar.import": "インポート…",
  "import.dialog.title": "音楽のインポート",
  "import.dialog.expanding": "音楽ファイルを検索しています…",
  "import.dialog.count": "{count} 件のファイルをインポートします。",
  "import.dialog.empty": "インポートできる音楽ファイルが見つかりませんでした。",
  "import.dialog.failed": "インポートに失敗しました: {message}",
  "import.dialog.cancel": "キャンセル",
  "import.dialog.run": "インポート",
  "import.dialog.close": "閉じる",
};
