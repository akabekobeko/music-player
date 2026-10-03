# オーディオエンジン

音楽再生を担うオーディオエンジンの設計です。audio-player の AudioPlayer3 (class、556 行) から再生戦略を継承しつつ、**class (副作用リソースの器) + 純関数 reducer (状態遷移) + イベント駆動**に再設計します。

## 再生戦略: streaming 専用 (2026-10-03 改訂)

Electron / Chromium の制約と、それに対する方針は次のとおりです。

- **制約 A**: Renderer から `file://` で音声を読めない → `media-stream://` カスタムプロトコルで配信 ([プロセス構成](../architecture/process-model.md))
- **制約 B (原因判明・解消済み)**: audio-player 時代は、`HTMLMediaElement` の streaming 再生中に `buffered` 外へ `currentTime` を設定すると `PIPELINE_ERROR_READ: FFmpegDemuxer: data source error` で再生が止まった ([electron/electron#38749](https://github.com/electron/electron/issues/38749))。v1.0 から v1.2 まではこの回避策として、裏で同じ URL を `fetch` → `decodeAudioData` し、デコード完了後に `AudioBufferSourceNode` 再生へ移行する streaming / buffer ハイブリッドを採用していた。2026-10-03 の調査で、原因は **`<audio>` を `crossOrigin` なし (opaque な no-cors レスポンス) で読み込んでいたこと**と確定した。Chromium の `UrlData::ValidateDataOrigin` (`third_party/blink/renderer/platform/media/url_index.cc`) は CORS モードでない場合、シークで発生する 2 回目以降の Range レスポンスの origin を最初のレスポンスと比較する。`media-stream://` のような非 standard スキームは比較のたびに一意な opaque origin を生成するので必ず不一致になり、データソースが失敗する。`crossOrigin = "anonymous"` + `Access-Control-Allow-Origin` で CORS 承認済みにするとこの比較は省かれ、同じ Electron 44 の実機で opaque なら再現・CORS なら成功することを確認した

ハイブリッドは **v1.2.2 で廃止**しました。理由は次の 2 点です。

1. v1.0 以降は `<audio>` を `crossOrigin = "anonymous"` で読み込んでいるため制約 B の条件に当たらず、`media-stream://` に対する Range 付き再要求で `buffered` 外へのシークが成功する (Electron 44、1 時間の m4a と CBR MP3 で実機確認)。Chromium は非 HTTP スキームに対して 206 や `Content-Range` を検証せず、Electron が `stream: true` で登録したスキームを無条件に Range 対応とみなす ([PR #47703](https://github.com/electron/electron/pull/47703) で v37 以降に維持されているパッチ)
2. 丸読み + 全曲デコードは曲の開始直後に CPU 1 コアと Main プロセスの event loop を占有し、デコード済み PCM (5 分のステレオ曲で約 115MB) を保持し続ける。コア数やメモリーの少ない Intel Mac で音飛びの原因になっていた

現在の構成は次のとおりです。

1. `HTMLAudioElement` + `MediaElementAudioSourceNode` で即時再生開始 (`canplay` で開始可能)
2. シークは常に `currentTime` へ直接代入する。Chromium が必要な byte range を `media-stream://` へ再要求する
3. `currentTime` 代入から要素の `seeked` イベントまでを snapshot の `seeking` として UI へ出す。その間 `currentTime` は目標値を返し、シークが成功したように見せる

ノードグラフは AudioPlayer3 を継承します (EQ・ビジュアライザーの拡張点を最初から確保):

```
source (MediaElement)
  → effectInput(Gain) → [EQ 挿入ポイント (v1.x)] → effectOutput(Gain)
  → analyser (fftSize 64)   ← spectrums 用 (v1.x で利用)
  → gain (ユーザー音量)
  → destination
```

`<audio>` は必ず `crossOrigin = "anonymous"` で読み込みます。`media-stream://` はアプリのオリジンから見てクロスオリジンで、CORS 承認のない opaque なメディアは `MediaElementAudioSourceNode` で無音になるうえ、制約 B のとおり `buffered` 外へのシークが失敗するためです ([プロセス構成](../architecture/process-model.md))。

## class + 純関数 reducer の方針

**実装形態は class に回帰します** (2026-08-09 改訂)。当初は関数ベース (クロージャーファクトリー) で設計しましたが、Phase 3 の初期実装を評価した結果、次の課題により class 路線へ変更しました。

- ファクトリー関数が長大になり、多数の `let` クロージャー変数が読解の認知負荷を上げる
- クロージャーは可変状態の全体像を一覧できず、「class をそのまま関数化しただけ」で副作用管理は改善されない
- オーディオエンジンは本質的に状態の塊であり、可変リソースを private field として 1 箇所に宣言できる class の方が見通しがよい

ただし **AudioPlayer3 の弱点はそのまま継承しません**。class に残すのは「副作用リソース (AudioContext・ノードグラフ・media element) の器」の役割だけで、状態管理は次の分離を守ります。

| 責務 | 置き場所 |
| --- | --- |
| 状態遷移 (イベント → 次状態) | 純関数 `reducePlayback(internal, event)` (`playbackReducer/`)。Web Audio 非依存でユニットテスト可能 |
| 公開状態 | 不変 snapshot (`snapshotOfPlayback(internal)` の射影)。getter live view は採用しない |
| 副作用リソースと命令 | class (`WebAudioEngine`)。すべてのイベントを `#dispatch` に集約し、snapshot が変化したときだけ listener へ通知 |
| 生成の接点 | ファクトリー `createAudioEngine(url, options)`。class は実装詳細で、PlayerProvider は `new` を直接呼ばない |

「再生位置が毎フレーム変わるので React state に入れられない」という性質は「React の外に状態を置く」ことで保ち、`useSyncExternalStore` で購読します。getter 委譲・ポーリングという弱点 ([状態管理](state-management.md)) は class 化後も採用しません。

## 公開 API

```ts
// src/renderer/features/audio/types.ts
export type PlaybackState = "loading" | "playing" | "paused" | "stopped" | "error";

export type PlaybackError = {
  readonly kind: "open" | "playback";
  readonly message: string;
};

export type PlaybackSnapshot = {
  readonly state: PlaybackState;
  readonly currentTime: number;   // シーク中は目標値
  readonly duration: number;      // 0 = 未確定
  readonly volume: number;        // 0-1
  readonly seeking: boolean;      // シーク先のデータ待ち (UI はスピナー等を表示)
  readonly error: PlaybackError | null;
};

export type AudioEngine = {
  readonly play: () => Promise<void>;
  readonly pause: () => void;
  readonly stop: () => void;                    // 先頭へ戻して停止
  readonly seek: (timeSec: number) => void;
  readonly setVolume: (volume: number) => void; // 0-1
  readonly close: () => void;                   // AudioContext.close まで。以後の呼び出しは no-op
  readonly getSnapshot: () => PlaybackSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSpectrums: () => Uint8Array | null; // 高頻度用。snapshot を経由しない
};

export const createAudioEngine = (url: string, options?: { volume?: number }): AudioEngine => { ... };
```

設計上の決定:

- **AudioPlayer3 と異なり、ファクトリーは同期で即座にエンジンを返します**。`canplay` 待ちの Promise ファクトリー (audio-player 方式) だと「生成待ちの間はエラーも状態も外から見えない」問題があるため、生成直後から `state: "loading"` の snapshot を返し、open 失敗も `error` イベントとして通知します。呼び出し側 (PlayerProvider) の分岐が「成功 / 失敗」から「snapshot を見るだけ」に単純化されます
- getter/setter (`engine.currentTime = 30`) は採用しません。書き込みはメソッド (`seek`)、読み取りは snapshot に統一し、「読むたびに値が変わる live view」をなくします

## snapshot と通知の実装

```ts
// playbackReducer/ — 純関数の状態コア
export type InternalPlayback = { state; intendedPlaying; currentTime; duration; volume; pendingSeekTime; error; closed };
export type PlaybackEvent =
  | { type: "loaded" } | { type: "playRequested" } | { type: "playStarted" }
  | { type: "paused" } | { type: "stopped" } | { type: "ended" }
  | { type: "seekStarted"; time } | { type: "seekFinished" }
  | { type: "tick"; time } | { type: "durationChanged"; duration }
  | { type: "failed"; error } | { type: "volumeChanged"; volume } | { type: "closed" };
export const reducePlayback = (internal, event) => { ... };      // 純関数
export const snapshotOfPlayback = (internal) => { ... };          // 射影

// WebAudioEngine.ts — 副作用リソースの器
export class WebAudioEngine {
  #internal: InternalPlayback;
  #snapshot: PlaybackSnapshot;
  readonly #listeners = new Set<() => void>();
  readonly #context: AudioContext;      // ノードグラフは readonly field
  #audio: HTMLAudioElement | null;      // streaming パイプライン
  // ...

  #dispatch(event: PlaybackEvent): void {
    const next = reducePlayback(this.#internal, event);
    if (next === this.#internal) return;
    this.#internal = next;
    const nextSnapshot = snapshotOfPlayback(next);
    if (!playbackSnapshotsEqual(this.#snapshot, nextSnapshot)) {
      this.#snapshot = nextSnapshot;    // 不変オブジェクトを差し替え
      for (const listener of [...this.#listeners]) listener();
    }
  }
}

export const createAudioEngine = (url, options = {}): AudioEngine =>
  new WebAudioEngine(url, options);
```

- `subscribe` / `getSnapshot` は `useSyncExternalStore` の契約 (変化がない限り同一参照を返す) を満たします
- 再生中は 250ms 間隔の内部タイマーで `tick` イベントを発行し `currentTime` を snapshot に反映します (`timeupdate` イベントは発火間隔が実装依存なので、タイマーに統一)
- `seek()` は `seekStarted` を発行してから `currentTime` を代入し、要素の `seeked` で `seekFinished` を発行します。`pendingSeekTime` が立っている間は `tick` を無視して目標値を表示し続けます。`stop()` の先頭戻しでも `seeked` は発火しますが、`pendingSeekTime` が `null` なので reducer は何もしません
- 状態遷移 (`loading → playing` など)、`durationchange`、エラーは即時イベントとして `#dispatch` します

## audio-player からの修正点 (バグ・抜けの解消)

調査で判明した AudioPlayer3 + UI 層の問題を、エンジンの仕様として明示的に潰します。

1. **自然終了を検知する**: `HTMLAudioElement` に `ended` リスナーを張り `state: "stopped"` へ遷移させる。AudioPlayer3 は buffer モード (`node.onended`) しか検知せず、デコード完了前に曲が終わると次曲送りが発火しなかった
2. **エラーを必ず通知する**: open 失敗 / `HTMLAudioElement` の `error` イベントを `PlaybackError` として snapshot に載せる。AudioPlayer3 にはエラー通知機構自体がなく、すべて `console.error` 止まりだった
3. **duration の更新を通知する**: `durationchange` で snapshot を更新する。UI が「たまたま再描画されるまで duration が古い」状態をなくす
4. **`stop()` の到達経路を用意する**: キュー終端到達時に PlayerProvider が `stop()` を呼び、UI にも停止操作を置く ([プレーヤー UI](../features/player-ui.md))
5. **`seeking` を UI に出す**: シーク先のデータ待ちが「何も起きていない」ように見えた問題への対応

## PlayerProvider との責務境界

- エンジンは「**1 つの音源 URL の再生**」だけを知ります。キュー、次曲、曲メタデータは一切持ちません
- 曲の切り替え = 旧エンジン `close()` → 新エンジン生成。エンジンの使い回しはしません (AudioContext ごと作り直すことでノードグラフの状態リセットを保証)
- streaming の後始末 (`close()`): `pause()` → リスナー除去 → `MediaElementAudioSourceNode.disconnect()` → `src` 除去 + `load()` (メモリー解放)
- 音量はアプリ状態 (PlayerProvider) が正で、エンジン生成時に `options.volume` で引き継ぎます
- `ended` → 次曲、エラー時のキュー継続判断 (次曲へスキップするか停止するか) は PlayerProvider の責務です。v1.0 では**エラー時は自動スキップせず停止して表示**します (連続失敗によるキュー全消化を避けるため)

## テスト

- 状態遷移 (イベント → snapshot 差分) を純関数 `reducePlayback(internal, event)` として切り出し、Web Audio 非依存でユニットテストします
- 実デバイスでの結合確認 (フォーマット別再生、`buffered` 外へのシーク) は手動 QA 項目とします
