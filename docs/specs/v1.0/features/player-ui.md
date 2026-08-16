# プレーヤー UI

全ルート共通で表示するプレーヤーバー (PlayerBar) と、OS メディアコントロール連携の仕様です。

## レイアウト

PlayerBar はウィンドウ最下段・全幅の帯です。タイトルバー相当の役割 (ドラッグ領域、ウィンドウ操作コントロールのセーフエリア) は最上段のツールバー帯が受け持つため、PlayerBar 自体に drag 領域やセーフエリアの調整はありません ([ルーティングとレイアウト](../renderer/routing-layout.md))。

```
┌──────────────────────────────────────────────────────────────┐
│              [Art] Title / Artist — Album                    │
│ [⏮][⏯][⏭][⏹]   0:42 ─────────●───────── 3:28    [キュー][🔊] │ ← 全要素を垂直中央揃え
└──────────────────────────────────────────────────────────────┘
```

- 中央ブロック (アートワーク + 曲情報 + SeekBar) が帯の幅を最大に使います
- コントロールは左右へ振り分け、**垂直中央揃え**で配置します
  - 左: 前曲・再生/一時停止・次曲・停止
  - 右: キュー ([Playlist](playlist.md) のキュー Popover)、音量

## 表示要素

| 要素 | 仕様 |
| --- | --- |
| アートワーク | 現在曲の `picture` (`media-file://`)。なければ Lucide `Music` アイコン |
| 曲情報 | タイトル / アーティスト — アルバム。未再生時は「No music playing」相当の文言 (i18n) |
| 前曲・次曲 | キュー上の前後が null なら disabled ([Playlist](playlist.md) のキュー仕様で決まる) |
| 再生・一時停止 | `state` に応じてトグル。`loading` 中はスピナー |
| 停止 | `stop()`。audio-player には停止導線がなかったため明示的に追加 |
| SeekBar | shadcn Slider。step 1 秒。`duration` 未確定 (0) の間は disabled |
| 時間表示 | 経過 / 総時間。`stopped` でも現在曲があれば 0:00 / 総時間を表示 |
| 音量 | Popover 内 Slider (0-100 表示、内部は 0-1)。ミュートトグルつき |
| バッファリング表示 | `seeking` (遅延シーク中) の間、SeekBar 上にスピナーまたはパルス表示 |

## 状態の購読と表示更新

`useAudioPlayer()` (snapshot 購読) と PlayerProvider の state (現在曲・キュー) を組み合わせます ([状態管理](../renderer/state-management.md))。ポーリングは行いません。

### SeekBar の楽観更新

audio-player の「シーク直後に摘まみが巻き戻る」「停止中のシークが反映されない」問題への対応:

- ドラッグ中はローカル state の値を表示し、snapshot の `currentTime` を無視する
- ドラッグ確定 (commit) で `seek(value)` を呼び、以後は snapshot を表示する。エンジンは遅延シーク中も `currentTime` として目標値を返すため、巻き戻りは発生しない
- 曲切替時は snapshot 自体が新エンジンの初期値 (0) になるため、リセット漏れも発生しない

### エラー表示

- snapshot の `error` を PlayerBar 直上のインラインアラート (shadcn Alert / destructive) で表示します。閉じるまで残り、曲切替で自動クリアされます (PlayerBar は最下段のため、アラートは帯の上に積み上がります)
- インポートエラーなど再生以外のエラーは各ビューの責務です。PlayerBar は再生エラー専用とします
- エラー時は自動で次曲へ進みません (連続失敗でキューを消化してしまうため)。ユーザーが次曲ボタンで先へ進めます

## キー操作

| キー | 動作 |
| --- | --- |
| Space | 再生 / 一時停止 (入力フォーカスが input 系にない場合) |
| ← / → | 5 秒シーク |
| メディアキー | 下記 MediaSession 経由 |

## MediaSession 連携

Renderer 中心方針に合わせ、Main の `globalShortcut` ではなく **Web 標準の MediaSession API** を使います。OS のメディアコントロール (macOS の Now Playing、Windows の SMTC) とハードウェアメディアキーに対応します。

MediaSession への同期も useEffect では行いません ([状態管理](../renderer/state-management.md) の方針)。

- `navigator.mediaSession.metadata` (title / artist / album / artwork) は、**現在曲を変更するコマンド (`playMusic` / `playNext` / `playPrevious` / `stop`) の中で**更新します
  - artwork の URL は `media-file://` を指定します。MediaSession が受け付けない場合は Blob URL へフォールバックします (実装時に検証。Phase 3 の確認項目)
- action handler (`play` / `pause` / `previoustrack` / `nexttrack` / `seekto` → PlayerCommands) の登録は PlayerProvider の初期化時に 1 回だけ行います (コマンド参照は React 外のディスパッチャー経由で常に最新を呼ぶ)
- `navigator.mediaSession.playbackState` と `setPositionState()` は、エンジン生成時にコマンド内で登録する snapshot 購読 (`engine.subscribe`) の中で同期します。React のレンダリングを経由しません

## 再生中表示 (各ビューとの連携)

- 曲リスト内の現在曲は、トラック番号をスピーカーアイコン (再生中) / 一時停止アイコンに置き換えてハイライトします
- 判定は `music.id === current.id` (PlayerProvider の state)。各ビューが個別に実装します
