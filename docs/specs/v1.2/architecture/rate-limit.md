# レート制限の実装

MusicBrainz の利用条件 ([Rate Limiting 私訳](../reference/musicbrainz-api-rate-limiting.md)) は「IP アドレスあたり平均 1 秒に 1 リクエスト」で、超えると 503 で拒否され、悪質なら IP ごと遮断されます。Parade は次の方法で遵守します。

## 直列化と最小間隔

`MusicBrainzClient` がアプリ全体で 1 つのキューを持ち、musicbrainz.org へのリクエストを**直列に、前回の開始から 1,000 ms 以上あけて**発行します。

```
request(url):
  1. キューの末尾に並ぶ (前のリクエストが完了するまで待つ)
  2. wait = max(0, lastStartedAt + 1000 - now)
     wait > 0 なら sleep(wait)
  3. lastStartedAt = now、net.fetch を発行
  4. 応答を返し、次のキューへ
```

- 間隔の基準は「開始時刻」です。応答に 800 ms かかった場合の次の待ちは 200 ms で、応答が 1 秒を超えていれば待ちません
- 直列化するので、ダイアログの取得と一括取得が同時に走っても合計で 1 秒 1 リクエストを超えません
- python-musicbrainzngs の既定 (`limit_interval = 1.0`、`limit_requests = 1`) と同じ値です。バーストは許容せず、先行例より保守的にします
- 間隔は定数 `MUSICBRAINZ_MIN_INTERVAL_MS = 1000` とし、設定で変えられなくします

## 503 の再試行

- 503 を受けたら `Retry-After` ヘッダー (秒) があればその秒数、なければ 2 秒待って再試行します。最大 3 回で諦めます
- 再試行もキュー経由で行い、待機中は他のリクエストも進みません (レートを下げるのが目的のため)
- 3 回失敗した場合は `MB_THROTTLED` で呼び出し元へ返し、一括取得ではその曲を failed に記録して次へ進みます
- `Retry-After` が `MUSICBRAINZ_MAX_RETRY_DELAY_MS` (30 秒) を超える場合は待たずに `MB_THROTTLED` で諦めます。長い待機でアプリ全体のキューを止めないためで、ユーザーがあとで再実行します
- 最小間隔と再試行の待機は呼び出し側の `AbortSignal` で中断でき、中断されたリクエストは `MB_ABORTED` で返ります (一括取得のキャンセルが待機中でも効く)

## Cover Art Archive

coverartarchive.org には現在レート制限がありません ([私訳](../reference/cover-art-archive-api.md))。同じクライアントを通しますが (User-Agent とタイムアウトの共通化のため)、**最小間隔の待機は musicbrainz.org のホストだけに適用**します。画像はリダイレクト先 (archive.org) から取得します。

## 一括取得での見積もり

アルバム単位のグループでは release 検索 1 回 + lookup 1 回 = 2 リクエスト (+ 画像) で済み、曲数に比例しません ([検索と照合](lookup-strategy.md))。アルバム情報のない曲は 1 曲あたり 2 リクエストです。ライブラリー全体の一括取得は入口を用意しないため (アーティスト単位が最大)、1 回の実行は数十リクエスト規模に収まります。

## テスト

- `MusicBrainzClient` は `fetch` 関数と `now` / `sleep` を注入できるようにし、フェイクタイマーで「2 件目は 1,000 ms 後に始まる」「503 のあと `Retry-After` 分待つ」を検証します
- 実サーバーへの結合テストは行いません (CI から繰り返し叩かないため)
