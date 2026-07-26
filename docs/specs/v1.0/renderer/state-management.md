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
| ライブラリーデータ (アーティスト、アルバム、フィルター結果) | Main への問い合わせ結果 (サーバー状態相当) | 各ビューのフック内で fetch + `mp:library:changed` 購読で再取得 |
| ビューのローカル状態 (選択中、ダイアログ開閉) | コンポーネント局所 | `useState` |

**非同期 Action という概念を廃止します。** 非同期処理は Provider が公開する通常の async 関数 (コマンド) で行い、dispatch は純粋な同期 reducer への通知だけに使います。「この関数は async か」が型シグネチャに現れるため、規約を覚える必要がなくなります。

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
- エンジンの `ended` イベント購読も Provider が行い、`playNext()` を呼びます。audio-player のような「ポーリング再描画への相乗りで終了検知」は行いません
- Context は audio-player 同様に **State 用と Commands 用を分離**します (コマンドは安定参照のため、購読不要なコンポーネントの再レンダーを防ぐ)

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

### ライブラリーデータの取得

サーバー状態相当のデータはグローバル store に持たず、各ビューのフックで完結させます。

```ts
export const useArtists = () => {
  const [result, setResult] = useState<FetchState<Artist[]>>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await window.mp.library.getArtists();
      if (alive) setResult(fromIpcResult(res));
    };
    load();
    return window.mp.library.onChanged(load); // ライブラリー変更で自動再取得
  }, []);
  return result;
};
```

- `FetchState<T>` は `loading / success / error` の判別 union。エラーを握りつぶさず UI に出します
- audio-player の `useTabArtists` (毎レンダーで IPC を発行) のようなパターンは禁止します。fetch は必ず `useEffect` (または明示的なイベント) から発行します
- ビュー間で共有が必要になったデータのみ Context へ昇格します。v1.0 で昇格が確定しているのは PlayerProvider と SettingsProvider だけです

### SettingsProvider

mme-gui 方式です。起動時に `mp:settings:get`、変更は `mp:settings:set` を呼び、**IPC のレスポンス (Main がマージ・永続化した値) を唯一の真実として** state に反映します。

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
