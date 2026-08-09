# オーディオエンジン

音楽再生を担うオーディオエンジンの設計です。audio-player の AudioPlayer3 (class、556 行) の再生戦略を継承しつつ、**class (副作用リソースの器) + 純関数 reducer (状態遷移) + イベント駆動**に再設計します。

## 継承する再生戦略: streaming / buffer ハイブリッド

AudioPlayer3 が解決した Electron / Chromium の制約は v1.0 でもそのまま有効です。

- **制約 A**: Renderer から `file://` で音声を読めない → `media-stream://` カスタムプロトコルで配信 ([プロセス構成](../architecture/process-model.md))
- **制約 B**: `HTMLMediaElement` のストリーミング再生は、VBR MP3 (Xing ヘッダーなし) やインデックス不完全な m4a で任意位置シークが破綻する (`buffered` 外への `currentTime` 設定で PIPELINE_ERROR_READ)。完全なシーク耐性には `AudioBuffer` 再生が必要だが、全デコード完了まで再生開始できない

そこで両者を時間軸で切り替えます:

1. **streaming モード**: `HTMLAudioElement` + `MediaElementAudioSourceNode` で即時再生開始 (`canplay` で開始可能)
2. 裏で同じ URL を `fetch` → `decodeAudioData` (失敗しても streaming のまま degrade)
3. **buffer モード**: デコード完了時に、再生位置・再生状態・音量を引き継いで `AudioBufferSourceNode` 再生へ透過的に移行。以後シークは自由
4. streaming 中の `buffered` 範囲外シークは**遅延シーク**: 目標値を記録して消音し、`buffered` の伸長 (progress) かデコード完了のどちらか早い方で回収する。UI 上の `currentTime` は目標値を返し、シークが成功したように見せる

ノードグラフも AudioPlayer3 を継承します (EQ・ビジュアライザーの拡張点を最初から確保):

```
source (MediaElement | BufferSource)
  → effectInput(Gain) → [EQ 挿入ポイント (v1.x)] → effectOutput(Gain)
  → analyser (fftSize 64)   ← spectrums 用 (v1.x で利用)
  → gain (ユーザー音量)
  → mute (遅延シーク中の消音専用)
  → destination
```

## class + 純関数 reducer の方針

**実装形態は class に回帰します** (2026-08-09 改訂)。当初は関数ベース (クロージャーファクトリー) で設計しましたが、Phase 3 の初期実装を評価した結果、次の課題により class 路線へ変更しました。

- ファクトリー関数が長大になり、多数の `let` クロージャー変数が読解の認知負荷を上げる
- クロージャーは可変状態の全体像を一覧できず、「class をそのまま関数化しただけ」で副作用管理は改善されない
- オーディオエンジンは本質的に状態の塊であり、可変リソースを private field として 1 箇所に宣言できる class の方が見通しがよい

ただし **AudioPlayer3 の弱点はそのまま継承しません**。class に残すのは「副作用リソース (AudioContext・ノードグラフ・media element・buffer source) の器」の役割だけで、状態管理は次の分離を守ります。

| 責務 | 置き場所 |
| --- | --- |
| 状態遷移 (イベント → 次状態) | 純関数 `reducePlayback(internal, event)` (`playbackReducer.ts`)。Web Audio 非依存でユニットテスト可能 |
| 公開状態 | 不変 snapshot (`snapshotOfPlayback(internal)` の射影)。getter live view は採用しない |
| 副作用リソースと命令 | class (`WebAudioEngine`)。すべてのイベントを `#dispatch` に集約し、snapshot が変化したときだけ listener へ通知 |
| 生成の接点 | ファクトリー `createAudioEngine(url, options)`。class は実装詳細で、PlayerProvider は `new` を直接呼ばない |

「再生位置が毎フレーム変わるので React state に入れられない」という性質は「React の外に状態を置く」ことで保ち、`useSyncExternalStore` で購読します。getter 委譲・ポーリングという弱点 ([状態管理](state-management.md)) は class 化後も採用しません。

## 公開 API

```ts
// src/renderer/features/audio/types.ts
export type PlaybackState = "loading" | "playing" | "paused" | "stopped" | "error";

export type PlaybackError = {
  readonly kind: "open" | "decode" | "playback";
  readonly message: string;
};

export type PlaybackSnapshot = {
  readonly state: PlaybackState;
  readonly currentTime: number;   // 遅延シーク中は目標値
  readonly duration: number;      // 0 = 未確定
  readonly volume: number;        // 0-1
  readonly seeking: boolean;      // 遅延シーク中 (UI はスピナー等を表示)
  readonly bufferReady: boolean;  // buffer モードへ移行済みか
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
// playbackReducer.ts — 純関数の状態コア
export type InternalPlayback = { mode; state; intendedPlaying; currentTime; duration; volume; pendingSeekTime; error; closed };
export type PlaybackEvent =
  | { type: "loaded" } | { type: "playRequested" } | { type: "playStarted" }
  | { type: "paused" } | { type: "stopped" } | { type: "ended" }
  | { type: "seeked"; time } | { type: "seekDeferred"; time } | { type: "seekRecovered" }
  | { type: "tick"; time } | { type: "durationChanged"; duration }
  | { type: "bufferEntered"; resumeOffset } | { type: "failed"; error }
  | { type: "volumeChanged"; volume } | { type: "closed" };
export const reducePlayback = (internal, event) => { ... };      // 純関数
export const snapshotOfPlayback = (internal) => { ... };          // 射影

// WebAudioEngine.ts — 副作用リソースの器
export class WebAudioEngine {
  #internal: InternalPlayback;
  #snapshot: PlaybackSnapshot;
  readonly #listeners = new Set<() => void>();
  readonly #context: AudioContext;      // ノードグラフは readonly field
  #audio: HTMLAudioElement | null;      // streaming パイプライン
  #audioBuffer: AudioBuffer | null;     // buffer パイプライン
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
- 再生中は 250ms 間隔の内部タイマーで `tick` イベントを発行し `currentTime` を snapshot に反映します (streaming モードは `timeupdate` イベントでも可だが、buffer モードは `AudioContext.currentTime` からの計算になるためタイマーに統一)
- 状態遷移 (`loading → playing` など)、`durationchange`、エラー、`bufferReady` への移行は即時イベントとして `#dispatch` します

## audio-player からの修正点 (バグ・抜けの解消)

調査で判明した AudioPlayer3 + UI 層の問題を、エンジンの仕様として明示的に潰します。

1. **streaming モードの自然終了を検知する**: `HTMLAudioElement` に `ended` リスナーを張り `state: "stopped"` へ遷移させる。AudioPlayer3 は buffer モード (`node.onended`) しか検知せず、デコード完了前に曲が終わると次曲送りが発火しなかった
2. **エラーを必ず通知する**: open 失敗 / `HTMLAudioElement` の `error` イベント / `decodeAudioData` 失敗 (degrade する場合も playback へ影響したとき) を `PlaybackError` として snapshot に載せる。AudioPlayer3 にはエラー通知機構自体がなく、すべて `console.error` 止まりだった
3. **duration の更新を通知する**: `durationchange` とモード移行時に snapshot を更新する。UI が「たまたま再描画されるまで duration が古い」状態をなくす
4. **`stop()` の到達経路を用意する**: キュー終端到達時に PlayerProvider が `stop()` を呼び、UI にも停止操作を置く ([プレーヤー UI](../features/player-ui.md))
5. **`seeking` / `bufferReady` を UI に出す**: 遅延シーク中の無音待ちが「何も起きていない」ように見えた問題への対応

## モード移行の仕様 (AudioPlayer3 から継承)

- 移行時に引き継ぐもの: 再生位置 (`pendingSeekTime` があればそれを優先)、再生状態 (playing なら移行後も再生)、音量・EQ (effectInput 以降のノードグラフは共有のため自動的に維持)
- streaming 側の後始末: `pause()` → リスナー除去 → `MediaElementAudioSourceNode.disconnect()` → `src` 除去 + `load()` (メモリー解放)
- `fetch` / `decodeAudioData` の失敗は握りつぶして streaming のまま継続。ただし `closed` チェックを await の後に必ず入れ、close 済みエンジンでの続行を防ぐ (AudioPlayer3 と同様)
- buffer モードの終端検知は `AudioBufferSourceNode.onended` + 再生位置が `duration - 0.01` 以上であることの確認 (pause による onended と区別)

## PlayerProvider との責務境界

- エンジンは「**1 つの音源 URL の再生**」だけを知ります。キュー、次曲、曲メタデータは一切持ちません
- 曲の切り替え = 旧エンジン `close()` → 新エンジン生成。エンジンの使い回しはしません (AudioContext ごと作り直すことでノードグラフの状態リセットを保証)
- 音量はアプリ状態 (PlayerProvider) が正で、エンジン生成時に `options.volume` で引き継ぎます
- `ended` → 次曲、エラー時のキュー継続判断 (次曲へスキップするか停止するか) は PlayerProvider の責務です。v1.0 では**エラー時は自動スキップせず停止して表示**します (連続失敗によるキュー全消化を避けるため)

## テスト

- 状態遷移 (イベント → snapshot 差分) を純関数 `reducePlayback(internal, event)` として切り出し、Web Audio 非依存でユニットテストします
- `isTimeBuffered` (TimeRanges 判定)、モード移行時の引き継ぎ計算 (`resumeOffset` の clamp) も純関数としてテストします
- 実デバイスでの結合確認 (フォーマット別再生、VBR MP3 のシーク) は Phase 3 の手動 QA 項目とします
