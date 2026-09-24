# MusicBrainz クライアント

MusicBrainz API ([私訳](../reference/musicbrainz-api.md)) と Cover Art Archive ([私訳](../reference/cover-art-archive-api.md)) へアクセスする Main プロセスのクライアントです。Renderer は直接 HTTP を発行せず、IPC ([IPC 設計](ipc.md)) 経由で結果だけを受け取ります。

## 原則

- **Main プロセスだけが外部へ通信する**: 書き込み (`runUpdateMusics`) と同じプロセスに置き、Renderer の CSP を緩めない。プロキシ設定を引き継ぐため `net.fetch` (Electron) を使う
- **利用条件を機能より優先する**: `User-Agent` の付与 ([User-Agent と設定の検討](user-agent.md)) と 1 秒 1 リクエスト ([レート制限の実装](rate-limit.md)) をクライアント内部で強制し、呼び出し側が守り忘れる余地をなくす
- **JSON で受ける**: `Accept: application/json` と `fmt=json` の両方を付ける (`fmt=` が優先されるため片方でも動くが、明示しておく)
- **外部ライブラリーを足さない**: musicbrainz-api (npm) は機能過多で、必要なのは search / lookup の 2 系統だけ。「必要最小」の方針 ([技術選定](../../v1.0/architecture/tech-stack.md)) に従い自前で書く

## 構成

```
src/main/musicbrainz/
├── MusicBrainzClient.ts        # class: 直列化・待機・再試行を持つ HTTP クライアント (状態を持つため class)
├── musicBrainzClient.ts        # シングルトン (User-Agent を app.getVersion() から組み立てて生成)
├── buildUserAgent.ts           # 純関数
├── escapeLucene.ts             # 純関数 (検索語のエスケープ)
├── buildRecordingQuery.ts      # 純関数 (search-query.md)
├── buildReleaseQuery.ts        # 純関数
├── searchRecordings.ts         # /recording?query=
├── searchReleases.ts           # /release?query=
├── lookupRelease.ts            # /release/<mbid>?inc=...
├── fetchFrontCover.ts          # coverartarchive.org
├── lookupMusicInfo/            # 1 曲分の候補を組み立てる代表関数とサブルーチン (lookup-strategy.md)
└── toMusicInfoCandidate/       # 応答 → 候補のマッピング (metadata-mapping.md)
```

## エンドポイント

| 用途 | URL |
| --- | --- |
| recording 検索 | `https://musicbrainz.org/ws/2/recording?query=<QUERY>&limit=5&fmt=json` |
| release 検索 | `https://musicbrainz.org/ws/2/release?query=<QUERY>&limit=5&fmt=json` |
| release lookup | `https://musicbrainz.org/ws/2/release/<MBID>?inc=<INC>&fmt=json` |
| フロントカバー | `https://coverartarchive.org/release/<MBID>/front-1200` → 404 なら `/front` → 404 なら `/release-group/<MBID>/front-1200` |

`inc=` の内容は [検索と照合](lookup-strategy.md) を参照してください。

## エラーの扱い

| 状況 | 扱い |
| --- | --- |
| ネットワーク不通・DNS 失敗 | `IpcError { code: "MB_NETWORK" }`。呼び出し元は「オフライン」として表示 |
| タイムアウト (15 秒、`AbortSignal.timeout`) | `MB_TIMEOUT` |
| 503 | `Retry-After` (なければ 2 秒) 待って再試行。3 回で諦め `MB_THROTTLED` |
| 404 (Cover Art Archive) | 画像なし。エラーにしない |
| その他 4xx / 5xx | `MB_HTTP_<status>` |
| JSON 解析失敗 | `MB_INVALID_RESPONSE` |

- クライアントは throw せず、`IpcResult` ではなく Main 内部の Result 型 (`{ ok, value } | { ok, error }`) を返す。IPC ハンドラーがそのまま `IpcError` に詰め替える
- 応答のログには URL とステータスだけを残し、本文は残さない (大きいため)
