# カラム定義

Playlists のテーブルが表示できるカラムの一覧です。定義は `PLAYLIST_COLUMNS` (`src/renderer/features/playlistColumns/constants.ts`) に宣言順で置き、この順序が既定の表示順になります。並び順はヘッダーのドラッグ & ドロップで変えられます ([カラムの並べ替え](column-reorder.md))。型は [型定義](../architecture/column-settings-types.md) を参照してください。

## 一覧

| id | 表示名 (en / ja) | 値 (`Music`) | 既定の表示 | 既定幅 | リサイズ | ソート | 揃え |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ordinal` | `#` | 登録順の位置 (1 始まり) | 常に表示 | 44 | 不可 | 可 | 右 |
| `title` | Title / タイトル | `title` | 常に表示 | 280 | 可 | 可 | 左 |
| `artist` | Artist / アーティスト | `artist` | 表示 | 200 | 可 | 可 | 左 |
| `album` | Album / アルバム | `album` | 表示 | 200 | 可 | 可 | 左 |
| `albumArtist` | Album artist / アルバムアーティスト | `albumArtist` | 非表示 | 180 | 可 | 可 | 左 |
| `genre` | Genre / ジャンル | `genre` | 非表示 | 140 | 可 | 可 | 左 |
| `year` | Year / 年 | `year` | 非表示 | 72 | 可 | 可 | 右 |
| `track` | Track / トラック | `track` | 非表示 | 72 | 可 | 可 | 右 |
| `disc` | Disc / ディスク | `disc` | 非表示 | 72 | 可 | 可 | 右 |
| `composer` | Composer / 作曲者 | `composer` | 非表示 | 160 | 可 | 可 | 左 |
| `lyricist` | Lyricist / 作詞者 | `lyricist` | 非表示 | 160 | 可 | 可 | 左 |
| `producer` | Producer / プロデューサー | `producer` | 非表示 | 160 | 可 | 可 | 左 |
| `conductor` | Conductor / 指揮者 | `conductor` | 非表示 | 160 | 可 | 可 | 左 |
| `publisher` | Publisher / パブリッシャー | `publisher` | 非表示 | 160 | 可 | 可 | 左 |
| `bpm` | BPM | `bpm` | 非表示 | 72 | 可 | 可 | 右 |
| `rating` | Rating / レート | `rating` | 非表示 | 104 | 可 | 可 | 左 |
| `audioFormat` | Format / フォーマット | `audioFormat` | 非表示 | 96 | 可 | 可 | 左 |
| `addedAt` | Date added / 追加日 | `addedAt` | 非表示 | 120 | 可 | 可 | 左 |
| `duration` | Duration / 時間 | `durationMs` | 表示 | 88 | 可 | 可 | 右 |
| `menu` | (空欄) | 曲メニュー | 常に表示 | 44 | 不可 | 不可 | 右 |

- 既定の表示は v1.2 の曲リストと同じ構成 (連番、タイトル、アーティスト、アルバム、時間) です。更新した直後に見た目が大きく変わらないようにします
- 幅の単位は px です
- 表示名の i18n キーは `playlist.column.<id>` とします
- 表示名は、同じ項目を指す曲情報ダイアログの項目名 (`musicInfo.field.*`) と表記を揃えます。`addedAt` だけは日付のみを表示するため、ダイアログの「追加日時」ではなく「追加日」とします
- 既定幅は、en / ja の表示名がソートしていない状態で省略されない幅にします。既定で表示するカラムは、ソートの矢印が付いた状態でも省略されない幅にします
- 表記のずれは `dictionaries.test.ts` で検出します

## 常に表示するカラム

`ordinal`、`title`、`menu` は常に表示し、カラム メニューには出しません ([表示カラムの切り替え](column-visibility.md))。並べ替えでも動かせません。

- `ordinal`: 再生ボタンと再生中の表示を兼ねる。ソートを登録順へ戻す入口でもある ([ソート](column-sort.md))
- `title`: 行が何の曲かを示す唯一の手がかり
- `menu`: 曲メニューの [⋯] を置くカラム。ヘッダーの表示名は空欄で、ソートもリサイズもできない。横スクロール中も右端へ固定する ([テーブルの構造](../architecture/table-structure.md))

## セルの表示

| カラム | 表示 |
| --- | --- |
| `ordinal` | 登録順の位置。絞り込みやソートをしても元の番号のまま。ホバーで再生ボタン、再生中・一時停止中は専用のボタン (`MusicRow` と同じ) |
| `title` | 再生中・一時停止中の行は強調 (`font-medium text-primary`) |
| 文字列のカラム | 値をそのまま表示。空文字は空欄 |
| `year` / `bpm` | 数値。`null` は空欄 |
| `track` | 数値。0 (タグなし) は空欄 |
| `disc` | 数値 |
| `rating` | 0 から 5 の星 (半分刻み)。曲情報ダイアログと同じ変換。`null` は空欄 |
| `addedAt` | 日付のみ。`Intl.DateTimeFormat` で UI のロケールに合わせる |
| `duration` | `formatTime` (`m:ss`) |
| `menu` | `RowMenu` |

- タイトル以外のセルは `text-muted-foreground text-xs` とし、v1.2 のアーティスト・アルバムの見た目を引き継ぎます
- 数値、時間、日付は等幅の数字 (`tabular-nums`) にします
- 幅に収まらない文字列は `EllipsisText` で省略し、ホバーで全文をツールチップに出します

## 対象外の項目

`filePath`、`updatedAt` はカラムにしません。一覧で見比べる用途が薄いためです。

`lyricist`、`producer`、`conductor`、`publisher` は当初対象外としていましたが、曲情報ダイアログにあるクレジットの項目がカラム メニューにないと探す手間になるため追加しました。いずれも既定では非表示です。
