# User-Agent と設定の検討

MusicBrainz API は API キーを要求しない代わりに、**意味のある `User-Agent` を必須**としています ([Rate Limiting 私訳](../reference/musicbrainz-api-rate-limiting.md))。設定項目を追加すべきかを検討し、**アプリ単位の固定値とし、設定は追加しない**と結論しました。

## MusicBrainz が求めるもの

推奨形式は次のとおりです。

```
Application name/<version> ( contact-url )
Application name/<version> ( contact-email )
```

目的は「アプリが問題を起こしたとき MusicBrainz が**アプリの保守者**に連絡できること」です。`Java`、`Python-urllib` のような汎用 UA は「匿名」とみなされ、厳しいスロットリングの対象になります。

## 先行例

| ライブラリー / アプリ | User-Agent の決め方 |
| --- | --- |
| python-musicbrainzngs | `set_useragent(app, version, contact)` を**アプリ開発者**が呼ぶ。未設定のまま問い合わせると例外 (`UsageError`)。連絡先は「アプリの URL かメールが望ましい」 |
| MusicBrainz Picard | `MusicBrainz Picard/<version> ( https://picard.musicbrainz.org )` の固定値。ユーザー設定なし |
| beets (musicbrainz plugin) | `beets/<version> ( https://beets.io/ )` の固定値 |

いずれも連絡先は**アプリの保守者**を指し、エンドユーザーごとに変えていません。

## 判断

- **アプリ単位の固定値で十分**です。MusicBrainz が連絡したい相手は Parade の保守者であり、ユーザーの連絡先を送る必要はありません。ユーザーのメールアドレスを送るのはむしろプライバシー上望ましくありません
- スロットリングは User-Agent 単位でも行われますが、Parade 全体で「1 秒 1 リクエスト」を守っていれば ([レート制限の実装](rate-limit.md)) ユーザーごとに分ける利点はありません
- よって**設定項目は追加せず、未設定時の UI 無効化も不要**です

## 固定値

```ts
// src/main/musicbrainz/buildUserAgent.ts
export const buildUserAgent = (version: string): string =>
  `Parade/${version} ( https://github.com/akabekobeko/music-player )`;
```

- `version` は `app.getVersion()` (package.json の `version`。about ダイアログと同じ値)
- 連絡先はリポジトリー URL。issue を受け付けられ、メールアドレスを公開せずに済みます
- Cover Art Archive へのリクエストにも同じ値を付けます
- 開発時も同じ形式で送ります (`Parade/1.2.0` のように見えるだけで、識別上の問題はありません)

## 将来の見直し

商用利用 (MusicBrainz の [commercial plans](https://metabrainz.org/supporters/account-type)) やユーザー認証を要する機能 (評価の送信など) を扱うことになれば、その時点でトークンの設定項目を検討します。v1.2 の範囲ではどちらも扱いません ([スコープ](../scope.md))。
