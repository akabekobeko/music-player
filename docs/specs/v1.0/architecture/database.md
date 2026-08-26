# データベース

node:sqlite (`DatabaseSync`) によるライブラリー DB の設計です。

## 接続管理

audio-player はクエリのたびに `new DatabaseSync()` → `close()` していましたが、v1.0 では **Main プロセス起動時に単一接続を開き、アプリ終了まで保持**します。

```ts
// src/main/db/connection.ts
let db: DatabaseSync | null = null;

export const openDatabase = (filePath: string): DatabaseSync => {
  db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  runMigrations(db);
  return db;
};

export const getDatabase = (): DatabaseSync => { ... };
export const closeDatabase = (): void => { ... }; // app quit 時
```

- DB ファイルは `userData/app.db`
- `DatabaseSync` は同期 API のため、大量処理 (インポート) 中は Main がブロックします。インポートはトランザクションを適切な粒度 (100 件単位) で分割し、進捗 push の合間にイベントループへ制御を返します
- クエリは prepared statement を使い、文字列連結による SQL 組み立てを禁止します

## マイグレーション

**`PRAGMA user_version` + 番号付き SQL ファイル**による自前ランナーです ([技術選定](tech-stack.md) に選定経緯)。

### 仕組み

```
src/main/db/migrations/
├── 001_initial.sql
├── 002_xxx.sql        # 将来の変更
└── index.ts           # ?raw import で SQL を束ねた配列
```

```ts
// src/main/db/migrations/index.ts
import m001 from "./001_initial.sql?raw"; // Vite の raw import でバンドルに内包

export const migrations: readonly string[] = [m001];
```

```ts
// src/main/db/migrate.ts
export const runMigrations = (db: DatabaseSync): void => {
  const current = getUserVersion(db); // PRAGMA user_version
  for (let version = current + 1; version <= migrations.length; version++) {
    const sql = migrations[version - 1];
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error; // 起動失敗として扱い、ユーザーに通知
    }
  }
};
```

### 運用ルール

- **forward-only**: down マイグレーションは書かない。失敗したらロールバックして起動エラーにする
- マイグレーション実行前に DB ファイルを `app.db.backup-v<current>` としてコピーする (バージョンが上がる場合のみ)。復旧はこのバックアップからの手動リストア
- 適用済みファイルの内容変更は禁止。変更は必ず新しい番号のファイルで行う
- DB の user_version がアプリの知る最大バージョンより大きい場合 (ダウングレード起動)、起動を中止してダイアログで通知する
- ランナーはユニットテスト対象 (インメモリー DB `:memory:` で検証)

## スキーマ (v1 = 001_initial.sql)

### musics

audio-player の「配列型タグは先頭要素のみ・関連テーブルを作らない」方針を継承しつつ、NULL 許容と既定値を整理します。

```sql
CREATE TABLE musics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path    TEXT    NOT NULL UNIQUE,
  audio_format TEXT    NOT NULL,              -- mme の AudioFormat
  title        TEXT    NOT NULL,              -- 空ならファイル名から補完して保存
  artist       TEXT    NOT NULL DEFAULT '',
  album_artist TEXT    NOT NULL DEFAULT '',
  album        TEXT    NOT NULL DEFAULT '',
  disc         INTEGER NOT NULL DEFAULT 1,
  track        INTEGER NOT NULL DEFAULT 0,
  year         INTEGER,                       -- 不明は NULL (0 との混同を避ける)
  genre        TEXT    NOT NULL DEFAULT '',
  composer     TEXT    NOT NULL DEFAULT '',
  lyricist     TEXT    NOT NULL DEFAULT '',
  producer     TEXT    NOT NULL DEFAULT '',
  conductor    TEXT    NOT NULL DEFAULT '',
  publisher    TEXT    NOT NULL DEFAULT '',
  duration_ms  INTEGER NOT NULL DEFAULT 0,    -- mme 由来。VBR MP3 は不正確な場合あり
  bpm          INTEGER,
  rating       REAL,                          -- mme 正規化値 [0,1]
  picture_id   INTEGER REFERENCES pictures(id),
  added_at     TEXT    NOT NULL,              -- ISO-8601
  updated_at   TEXT    NOT NULL
);

CREATE INDEX idx_musics_artist       ON musics(artist);
CREATE INDEX idx_musics_album_artist ON musics(album_artist);
CREATE INDEX idx_musics_album        ON musics(album);
CREATE INDEX idx_musics_genre        ON musics(genre);
CREATE INDEX idx_musics_year         ON musics(year);
```

- アーティスト・アルバムは正規化テーブルを持たず、`SELECT DISTINCT` とインデックスで導出します (1 万曲規模なら十分)
- アルバムの同一性判定キーは `(COALESCE(NULLIF(album_artist, ''), artist), album)` です。audio-player の「album 文字列のみ」による同名アルバム融合を防ぎます
- 再生位置マーキング (v1.x) は `markers(music_id, time_ms, name, ...)` テーブルの追加で対応できる構造です

### pictures / artist_pictures

```sql
CREATE TABLE pictures (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE               -- userData/images/<sha256>.<ext>
);

CREATE TABLE artist_pictures (
  artist     TEXT    NOT NULL PRIMARY KEY,
  picture_id INTEGER NOT NULL REFERENCES pictures(id)
);
```

- アートワークは DB に BLOB で入れず、内容の SHA-256 をファイル名として `userData/images/` に保存します (重複排除。audio-player の方式を継承)
- `artist_pictures` は audio-player では書き込みコードが存在せず常に空でした。v1.0 では**インポート時に「そのアーティストの最初に見つかったアートワーク」を自動登録**し、UI からの差し替えは v1.x とします

### artist_initials (004_artist_initials.sql)

```sql
CREATE TABLE artist_initials (
  artist  TEXT NOT NULL PRIMARY KEY,
  initial TEXT NOT NULL CHECK (initial GLOB '[A-Z]')
);
```

- アーティスト一覧のイニシャル分類をユーザーが上書きするための関連付けテーブル ([Artist ビュー](../features/artist-view.md))。アーティスト名 (表示アーティスト。`artist_pictures` と同じキー) と A–Z の 1 文字のペアを保持する
- 行があれば自動判定より優先し、行がなければ自動判定に任せる。「その他」の選択は行の削除で表現する (NULL 行は持たない)
- 曲が 1 曲も残らなくなったアーティストの行は `artist_pictures` と同じ孤児 GC (削除・再インポート・画像差し替え・頭文字設定のトランザクション内) で消す

### playlists / playlist_musics / smart_playlists

```sql
CREATE TABLE playlists (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

CREATE TABLE playlist_musics (
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  music_id    INTEGER NOT NULL REFERENCES musics(id) ON DELETE CASCADE,
  PRIMARY KEY (playlist_id, position)
);

CREATE TABLE smart_playlists (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  rules      TEXT    NOT NULL,                 -- 条件ルールの JSON (features/playlist.md)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
```

- 静的プレイリストは `playlist_musics.position` で並び順を保持します。並べ替えは対象プレイリストの行を全削除 → 再挿入 (1 トランザクション) で単純に実装します
- 動的プレイリストのルール JSON のスキーマは [Playlist](../features/playlist.md) で定義します。評価は Main 側で SQL に変換して実行します
- 曲がライブラリーから削除されたら `ON DELETE CASCADE` でプレイリストからも消えます

## インポート時の upsert

audio-player は `ON CONFLICT DO NOTHING` で再インポートしても更新されませんでした。v1.0 はメタデータ変更を反映するため upsert にします。

```sql
INSERT INTO musics (file_path, ...)
VALUES (?, ...)
ON CONFLICT(file_path) DO UPDATE SET
  title = excluded.title,
  ...,
  updated_at = excluded.updated_at;
-- added_at と id は保持される
```

## Renderer への公開クエリ

一覧系クエリの結果型 (`Artist`, `AlbumSummary`, `Music` など) は `src/main/ipc/types.ts` に定義します ([IPC 設計](ipc.md))。代表的なもの:

- アーティスト一覧: `DISTINCT COALESCE(NULLIF(album_artist, ''), artist)` (表示アーティスト) + `artist_pictures` / `pictures` / `artist_initials` の LEFT JOIN。`artist_pictures.artist` / `artist_initials.artist` も表示アーティスト名をキーとする (003 マイグレーションで再キー)
- アルバム一覧 (Album ビュー): アルバムキーで GROUP BY し、曲数・総時間・年・ジャンル・プロデューサー・指揮者・パブリッシャー・代表アートワークを集計。フィルター条件 (`genre`, `year` 範囲、テキスト) は WHERE 句に変換
- フィルター選択肢: `DISTINCT genre` (空文字除く)、`MIN(year) / MAX(year)`
