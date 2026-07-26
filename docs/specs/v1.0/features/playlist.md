# Playlist

プレイリスト機能と、ビュー横断のカレントキューの設計です。

## 用語の区別

| 用語 | 意味 | 永続化 |
| --- | --- | --- |
| プレイリスト (静的) | ユーザーが曲を選んで作る名前つきリスト | DB (`playlists` / `playlist_musics`) |
| 動的プレイリスト | 条件ルールだけを保存し、内容は評価時に生成されるリスト | DB (`smart_playlists`、ルール JSON) |
| カレントキュー | 「いま再生している並び」。ビュー操作のたびに置き換わる内部状態 | しない (アプリ再起動で消える) |

プレイリストは「キューの供給源のひとつ」であり、キューそのものではありません。Artist ビューのアーティスト再生も Album ビューのアルバム再生も、同じように「キューへ供給する」操作です。この抽象は将来の回転寿司プレイリスト (v1.x = もうひとつのキュー供給源) の土台になります。

## 静的プレイリスト

### 作成・編集

- Sidebar (Playlist ビュー) の「+ New playlist」で作成。名前はインライン編集
- 曲の追加: 各ビューの曲・アルバム・アーティストメニューの「Add to playlist ▸ (一覧 + New playlist)」
- 並べ替え: プレイリスト内で Drag & Drop。確定時に `mp:playlist:update` で全並びを保存 ([データベース](../architecture/database.md))
- 削除: 曲の削除 (プレイリストから外す)、プレイリスト自体の削除 (確認ダイアログ)
- 同一曲の重複追加は許可します (position が identity のため構造上も問題ない)

### 表示

- コンテンツ領域 (`/playlists/p<id>`) に曲リスト (連番、タイトル、アーティスト、アルバム、時間)
- ヘッダー: 名前、曲数、総時間、Play / Shuffle ボタン
- 曲行の操作・再生中ハイライトは他ビューと共通仕様

## 動的プレイリスト

条件だけを保存し、開くたび・再生するたびに評価するプレイリストです。

### ルール定義 (`smart_playlists.rules` の JSON)

```ts
type SmartPlaylistRules = {
  version: 1;
  match: "all" | "any";            // 条件間の AND / OR
  conditions: SmartCondition[];
  sort?: { field: SortField; order: "asc" | "desc" } | { field: "random" };
  limit?: number;                  // 上限曲数
};

type SmartCondition =
  | { field: "artist" | "albumArtist" | "album" | "genre" | "title";
      operator: "is" | "isNot" | "contains"; value: string }
  | { field: "year";     operator: "is" | "between" | "gte" | "lte"; value: number; value2?: number }
  | { field: "rating";   operator: "gte" | "lte"; value: number }      // [0,1]
  | { field: "duration"; operator: "gte" | "lte"; value: number }      // 秒
  | { field: "addedAt";  operator: "inLastDays"; value: number };      // 「最近追加した曲」用
```

- 評価は Main 側 (`mp:playlist:getMusics`) でルールを prepared statement の WHERE 句へ変換して実行します。`random` ソートは `ORDER BY RANDOM()`
- v1.0 の editor UI は「条件行の追加・削除 (field / operator / value のセレクトと入力)、match 切り替え、sort、limit」のシンプルなフォームとします
- 再生回数・最終再生日時を使う条件 (「よく聴く曲」) は再生履歴の記録が前提のため v1.x とします (`plays` テーブルの追加で対応可能な構造)

### 表示・再生

- 静的プレイリストと同じ画面 (`/playlists/s<id>`)。ヘッダーに「Smart」バッジと Edit rules ボタン
- 表示のたびに評価し直します。Play したときの評価結果がキューに固定され、再生中にライブラリーが変わってもキューは追従しません (予測可能性を優先)

## カレントキュー

### 基本設計

- キューは PlayerProvider の state (`queue: Music[]`, `queueSource`) です ([状態管理](../renderer/state-management.md))
- 前曲・次曲は `queue` と `current` の位置からの導出値。current がキューに存在しない場合の規則は下記
- キューを設定する操作 (供給源):
  - Artist ビュー: アーティスト再生、曲クリック (アーティスト全曲)
  - Album ビュー: アルバム再生、曲クリック (アルバム内)
  - Playlist ビュー: プレイリスト再生、曲クリック (プレイリスト内)
  - 曲メニュー: Play next (現在位置の直後へ挿入)、Add to queue (末尾へ追加)

### キュー置換時の挙動 (設計判断)

再生中に別のビュー操作でキューが置き換わったとき:

**再生中の曲はそのまま継続し、前後曲の解決は新しいキューを基準にします。**

1. 新キューに現在曲が含まれる → その位置を基準に前後曲を解決する
2. 含まれない → 前曲は無効 (disabled)、**次曲は新キューの先頭**とする。現在曲が終わる (または次曲を押す) と新キューの先頭から順に再生される

検討した代替案:

- 「前後曲の移動・次曲切り替えを無効にする」案: キューを設定し直した直後に前後ボタンが死んでいるのは操作として不自然で、「新しく選んだリストを聴きたい」という直前の意図も無視してしまうため不採用
- 「即座に新キュー先頭へ切り替える」案: 聴いている曲が突然切り替わるのは破壊的。「Play」操作 (明示的な再生開始) と「キュー置換」(Add to queue 等) の区別も曖昧になるため不採用

採用案は「いま流れている曲を尊重しつつ、次からは新しい選択に従う」という折衷で、挙動が常に予測可能です。なお「Play」系操作はキュー置換と同時に指定曲の再生を開始するため、この規則が関係するのは `replaceQueue` (再生を伴わない置換) と、再生中に別リストで Add to queue 系を使った場合です。

### キューの表示

- v1.0 では専用のキュー画面は持たず、PlayerBar のキューボタンで Popover 表示 (現在曲の前後 + リスト全体のスクロール、曲クリックでジャンプ、キュークリア) とします
- キュー内の並べ替え・個別削除は v1.x で検討します

### 終端の挙動

- キュー末尾の曲が終わったら `stop()` し、現在曲は末尾のまま維持します (リピート再生は v1.0 では持たない。リピート 1 曲 / 全体は v1.x 候補)
