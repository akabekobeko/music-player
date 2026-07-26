# 状態管理

Renderer の状態管理設計です。audio-player の方式を分析し、課題を解消する形で刷新します。

## audio-player の課題 (前提整理)

audio-player は「2 層 Reducer」でした: 外側の `dispatchWrapper` が非同期 Action (`PLAYER_OPEN_PLAY` など) を横取りして async 処理し、完了後に `*_DISPATCHED` Action を内側の `useReducer` へ投げ直す方式です。また再生時間などは Reducer state に入れず、`AudioPlayer3` インスタンスへの getter 委譲 (live view) + UI 側の 1 秒ポーリングで表示していました。

この方式の問題:

1. **同期・非同期の区別が Action 名の規約 (`XXX` / `XXX_DISPATCHED`) に埋まっていて追いにくい**。dispatch した Action が reducer に届くのか wrapper に横取りされるのか、呼び出し側から見えない
2. **AudioPlayer3 インスタンスが Reducer state に入っている**。reducer 内で `audioPlayer.play()` を呼んで `{...state}` を返すなど、純粋性が崩れている
3. **getter 委譲 + ポーリングは再描画契機が偶発的**。`Playing → Stopped` の検知漏れ、シークバーの巻き戻り、エラーの不可視化を生んだ
4. 状態が単一 Context に同居し、アーティストタブの更新でプレーヤーも再レンダーされる

## v1.0 の設計

### 全体像: 役割で 3 分割する

「Reducer にすべてを通す」のをやめ、状態の性質ごとに React 標準の適切な道具を割り当てます。

| 状態 | 性質 | 道具 |
| --- | --- | --- |
| 再生状態 (state / currentTime / duration / エラー) | React 外のエンジンが所有、高頻度更新 | オーディオエンジンの store を `useSyncExternalStore` で購読 |
| カレントキュー + 現在曲 | UI 操作で変わる純粋なアプリ状態 | `useReducer` + Context (`PlayerProvider`) |
| ライブラリーデータ (アーティスト、アルバム、フィルター結果) | Main への問い合わせ結果 (サーバー状態相当) | React 外のクエリストア + `useSyncExternalStore` (後述) |
| ビューのローカル状態 (選択中、ダイアログ開閉) | コンポーネント局所 | `useState` |

**非同期 Action という概念を廃止します。** 非同期処理は Provider が公開する通常の async 関数 (コマンド) で行い、dispatch は純粋な同期 reducer への通知だけに使います。「この関数は async か」が型シグネチャに現れるため、規約を覚える必要がなくなります。

### useEffect・useMemo・useCallback を既定にしない

[You Might Not Need an Effect](https://ja.react.dev/learn/you-might-not-need-an-effect) の指針に従い、useEffect は「レンダー結果を外部システムへ同期する、他のどの手段にも当てはまらない場合」の最終手段とします。本設計で useEffect になりがちな処理は、次の対応表で置き換えます。

| ありがちな useEffect | 置き換え |
| --- | --- |
| 前後曲などの派生値を state にコピーする | レンダー中に計算する (state に持たない) |
| エンジン・IPC push など外部ストアの購読 | `useSyncExternalStore` |
| ユーザー操作起点の副作用 (再生開始、MediaSession metadata 更新、設定保存) | イベントハンドラー (コマンド関数) 内で実行する |
| アプリ寿命の初期化・購読 (設定ロード、`mp:menu:action` / `mp:library:changed` の購読、テーマの matchMedia 監視) | React の外。`createRoot` 前のブートストラップで 1 回だけ行う ([ルーティングとレイアウト](routing-layout.md)) |
| データフェッチ | クエリストア (次節)。コンポーネントの useEffect からは発行しない |

この方針により、v1.0 の設計上 useEffect が必須になる箇所は原則ありません。実装時に useEffect を書きたくなったら、まず上の表のどれかに置き換えられないかを検討します。

**useMemo / useCallback / React.memo も同様に既定では使いません。** これらは「状態の置き場所と階層が不適切なことによる過剰レンダー」への対症療法になりがちです。本設計は原因側を先に潰します。

- 高頻度に変わる値 (再生時間、フェッチ結果) は React の外 (エンジン / クエリストア) に置き、購読したコンポーネントだけが再レンダーされる
- Context は State 用と Commands 用を分離し、コマンドしか使わないコンポーネントは状態変化で再レンダーされない
- 派生値 (前後曲、表示用の整形) はレンダー中に素朴に計算する。この規模の計算コストはメモ化に値しない
- 大量要素のレンダーコストは仮想スクロール (@tanstack/react-virtual) が抑える

それでも計測で問題が出た場合のみ、該当箇所に限定して導入します。その際も個別の手書きメモ化より先に React Compiler の導入 (自動メモ化) を検討します (v1.0 時点では不要の想定のため採用しません)。

### PlayerProvider (キューと再生コマンド)

```ts
// 純粋な状態: エンジンのインスタンスは含めない
type PlayerState = {
  queue: Music[];             // カレントキュー
  queueSource: QueueSource;   // どのビュー操作で設定されたか (artist / album / playlist / none)
  current: Music | null;
  // previous / next は queue と current からの導出値 (state に持たない)
};

type PlayerCommands = {
  playMusic: (music: Music, queue: Music[], source: QueueSource) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (timeSec: number) => void;
  setVolume: (volume: number) => void;
  replaceQueue: (queue: Music[], source: QueueSource) => void; // 再生は維持
};
```

実装の要点:

- Provider 内部で `useReducer` (queue / current の純粋 reducer) と、オーディオエンジンのインスタンスを `useRef` で保持します。**エンジンは React state に入れません**
- `playMusic` は「前エンジンの close → `createAudioEngine` → 再生開始 → reducer へ current 更新を dispatch」までを担う async コマンドです。失敗はエンジン store の error に載るため、コマンド自体は throw しません
- エンジンへの `ended` 購読 (→ `playNext()`) や MediaSession の metadata 更新は、**エンジンを生成するコマンドの中で**行います。useEffect で「current の変化を監視して同期する」形は取りません (変化を起こした場所で副作用も実行する)。audio-player のような「ポーリング再描画への相乗りで終了検知」も行いません
- Context は audio-player 同様に **State 用と Commands 用を分離**します。Commands オブジェクトは **Provider マウント時に 1 回だけ生成** (`useState` の initializer で作り、`useReducer` の dispatch と `useRef` のエンジン参照を閉じ込める) するため、useCallback なしで恒久的に安定参照になります。コマンドしか使わないコンポーネントは状態変化で再レンダーされません

### 再生状態の購読: useAudioPlayer

エンジンは `getSnapshot() / subscribe()` を公開します ([オーディオエンジン](audio-engine.md))。React へは `useSyncExternalStore` で接続します。

```ts
export const useAudioPlayer = (): PlaybackSnapshot => {
  const engineRef = usePlayerEngineRef(); // PlayerProvider から
  return useSyncExternalStore(
    (listener) => engineRef.current?.subscribe(listener) ?? noopSubscribe,
    () => engineRef.current?.getSnapshot() ?? IDLE_SNAPSHOT,
  );
};
```

- snapshot はエンジン内でイベント発生時のみ差し替えられる不変オブジェクトです。参照が変わったときだけ React が再レンダーするため、「1 秒ポーリング」も「getter 委譲」も不要になります
- `currentTime` は snapshot に含めますが更新は 250ms 間隔にスロットルします。より高頻度が必要な描画 (将来のビジュアライザー) は snapshot を経由せず `getSpectrums()` を rAF で直接読みます

### ライブラリーデータの取得: クエリストア

useEffect でフェッチしません。React の外に小さなクエリストア (`src/renderer/features/library/queryStore.ts`) を実装し、コンポーネントは `useSyncExternalStore` で読むだけにします。再生状態と同じプリミティブに揃うため、アプリ全体で「外部の状態は subscribe / getSnapshot」という単一のメンタルモデルになります。

```ts
// React 非依存の純粋な TS モジュール
type FetchState<T> =
  | { status: "loading" }
  | { status: "success"; value: T }
  | { status: "error"; error: IpcError };

export const libraryStore = {
  subscribe: (key: QueryKey, listener: () => void) => Unsubscribe,
  getSnapshot: <T>(key: QueryKey) => FetchState<T>, // 純粋。fetch は起動しない
};
```

- キー例: `"artists"`、`"musicsByArtist:<name>"`、`"albums:<AlbumFilter のハッシュ>"`。キーごとに `FetchState<T>` の不変スナップショットを保持します
- fetch の起動タイミングは「そのキーへの最初の `subscribe` 時」と「無効化時」です。`getSnapshot` は純粋に保ちます (レンダー中に副作用を起こさない)
- **無効化**: `mp:library:changed` の購読はアプリのブートストラップで 1 回だけ登録し ([ルーティングとレイアウト](routing-layout.md))、受信したらキャッシュを無効化して購読中のキーを再取得します。購読者のいないキーはキャッシュを破棄するだけです
- 応答の適用時は世代チェック (リクエスト発行時の世代と一致する場合のみ反映) を行い、無効化と交差した古い応答を捨てます

コンポーネント側は 1 行です。

```ts
export const useArtists = (): FetchState<Artist[]> =>
  useSyncExternalStore(
    (listener) => libraryStore.subscribe("artists", listener),
    () => libraryStore.getSnapshot("artists"),
  );
```

- エラーは `FetchState` の `error` として UI に出します。握りつぶしません
- audio-player の `useTabArtists` (毎レンダーで IPC を発行) のようなパターンは禁止します。fetch を起動してよいのはクエリストア内部 (subscribe / 無効化) とイベントハンドラーだけです
- React 19 の `use()` + Suspense によるフェッチも検討しましたが、無効化 (ライブラリー変更時の再取得) にはどのみち外部の購読機構が必要で、Suspense / ErrorBoundary の層も増えるため、`useSyncExternalStore` 一本に揃えます

### SettingsProvider

mme-gui 方式をベースに、初期ロードを React の外へ出します。

- 起動時の `mp:settings:get` は **`createRoot` 前のブートストラップで await** し、初期値として `SettingsProvider` に渡します。マウント後に useEffect でロードする方式は取りません (設定はテーマ・言語の決定に必要で、「設定ロード中」の中間状態を UI から消せる)
- 変更は `mp:settings:set` を呼ぶイベントハンドラー (コマンド) で行い、**IPC のレスポンス (Main がマージ・永続化した値) を唯一の真実として**そのハンドラー内で state に反映します

## ディレクトリー構成

mme-gui の「features にロジック、components にコンポーネント + 専用フック」の規約を採用します。

```
src/renderer/
├── features/
│   ├── player/        # PlayerProvider, reducer, useAudioPlayer, キュー導出ロジック
│   ├── audio/         # オーディオエンジン (React 非依存)
│   ├── library/       # useArtists / useAlbums / フィルターロジック
│   ├── playlist/      # プレイリスト操作、スマートプレイリストのルール型
│   ├── settings/      # SettingsProvider
│   └── i18n/          # t() ラッパー
├── components/
│   ├── ui/            # shadcn 生成プリミティブ
│   └── app/<Name>/    # 画面コンポーネント + use<Name>.ts のコロケーション
└── pages/             # ルートに対応するページ
```

- reducer / コマンド / 導出関数はすべて純関数として切り出し、`*.test.ts` を並置します
- Action 型は audio-player の「1 Action 1 ファイル + 各ファイルが型を export」の規約を継承します (見通しがよかったため)。ただし非同期 Action が消えるため、ファイル数は大幅に減ります
