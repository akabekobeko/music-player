# ルーティングとレイアウト

画面遷移とアプリ全体のレイアウト構成です。

## ルーティング

React Router v8 の HashRouter を使用します (file:// ロードのため。選定理由は [技術選定](../architecture/tech-stack.md))。

| パス | 画面 | 備考 |
| --- | --- | --- |
| `/` | `/artists` へリダイレクト | |
| `/artists` | Artist ビュー (未選択状態) | |
| `/artists/unknown` | Artist ビュー (「不明なアーティスト」= 空名バケット選択) | 空文字はパスセグメントにできないため予約パスで表現 |
| `/artists/name/:artistName` | Artist ビュー (選択済み) | アーティスト名は encodeURIComponent。`name/` 配下なので予約語 `unknown` と衝突しない |
| `/albums` | Album ビュー | フィルター状態は URL に持たず state + settings 永続化 |
| `/playlists` | Playlist ビュー (未選択状態) | |
| `/playlists/:playlistId` | Playlist ビュー (選択済み) | 静的・動的とも。id は `p<id>` / `s<id>` で種別を区別 |
| `/settings` | 設定画面 | モーダルではなくルートにする (将来の項目増加に備える) |

- 選択状態をルートに載せることで、「アーティストを選ぶ」「プレイリストを開く」がブラウザーバック相当 (mod+[ 等) で戻れるようになります。audio-player は選択状態が Context のみで、ルーティングが実質機能していませんでした
- 再生状態・カレントキューはルートと独立です。画面遷移しても再生は継続します

## ウィンドウとタイトルバー

OS 標準のタイトルバーは全プラットフォームで非表示にし、アプリ UI の最上段がタイトルバーの役割 (ドラッグ移動、ウィンドウ操作コントロールの受け皿) を兼ねます。BrowserWindow のオプションは [プロセス構成](../architecture/process-model.md) を参照。

### ウィンドウ操作コントロールとセーフエリア

| プラットフォーム | コントロール位置 | 実現方法 |
| --- | --- | --- |
| macOS | 左上端 | `titleBarStyle: "hiddenInset"` (トラフィックライト) |
| Windows | 右上端 | `titleBarStyle: "hidden"` + `titleBarOverlay` (Window Controls Overlay) |
| Linux | 右上端 | 同上。WCO 非対応の場合は自前コントロールへフォールバック (実装時に検証) |

- ウィンドウの**左上端・右上端はセーフエリア (余白)** とし、アプリ UI を配置しません。左右両端を空けることで、全プラットフォームで同一レイアウトを共有できます
- 余白幅は WCO の CSS 環境変数 (`env(titlebar-area-x)` / `env(titlebar-area-width)`) から導出し、取得できない環境では固定値へフォールバックします

### ドラッグ領域

audio-player の方式を踏襲し、CSS の `-webkit-app-region` で制御します。

- ユーティリティークラス `.app-region-drag` (`-webkit-app-region: drag`) / `.app-region-no-drag` を定義します
- 最上段のツールバー帯 (サイドバー / コンテンツ領域それぞれ) は背景・余白を drag とし、内部の対話要素 (ボタン、テキストボックス) へ個別に no-drag を付与します。「コンテナーは drag、対話 UI は no-drag」の役割分担で、ドラッグ移動とアプリ内 UI 操作を両立させます
- drag 領域内のテキストは `user-select: none` とし、ウィンドウ移動とテキスト選択の競合を避けます

## レイアウト

audio-player の構成 (左サイドバー + 右コンテンツ) を基本に、プレーヤーは**最下段・全幅の帯**、最上段はサイドバー / コンテンツ領域それぞれが持つ**タイトルバー相当のツールバー帯** (高さ `--toolbar-height: 40px` = `titleBarOverlay.height`) です。サイドバー / コンテンツの左右分割は react-resizable-panels (`ResizablePanelGroup` horizontal) で、サイドバーはドラッグでリサイズできます。ウィンドウリサイズ時はサイドバーのピクセル幅を維持します (`groupResizeBehavior="preserve-pixel-size"`)。

VS Code / Slack のクロスプラットフォーム UI と、macOS 版 Apple Music のプレーヤー下段配置に倣った構成です。ウィンドウ操作コントロールを避けて PlayerBar をレイアウトする必要がなくなり、美観・機能の両面で調整が単純になります。

```
┌──────────┬──────────────────────────────────┐
│ ツールバー │ ツールバー (drag 帯)         (余白) │ ← タイトルバー相当
├──────────┤──────────────────────────────────┤
│ Sidebar  │ コンテンツ領域 (Outlet)             │
│ - ナビ    │                                  │
│ - リスト   │                                  │
├──────────┴──────────────────────────────────┤
│ PlayerBar                                    │
└─────────────────────────────────────────────┘
```

- **PlayerBar**: 全ルートで常時表示。最下段・全幅で、ウィンドウ操作コントロールと衝突しないためセーフエリア調整は不要です。内部レイアウトは [プレーヤー UI](../features/player-ui.md)
- **Sidebar**: 最上段にツールバー、その下にナビゲーション (Artists / Albums / Playlists)、下段にビュー固有のセカンダリー領域。幅はリサイズ可能 (160〜480px、初期値 224px = 14rem)
  - Artist ビュー: アーティスト一覧
  - Album ビュー: フィルター UI ([Album ビュー](../features/album-view.md))
  - Playlist ビュー: プレイリスト一覧 + 新規作成
  - audio-player のタブ方式 (Tabs で 3 リストを切り替え) はやめ、**ルートに応じて Sidebar の中身が変わる**方式にします。ナビとコンテンツの対応が明確になり、タブの forceMount キャッシュも不要になります
- **コンテンツ領域**: 最上段にツールバー、その下がルートの Outlet。一覧は @tanstack/react-virtual で仮想スクロール

### ツールバー

サイドバー / コンテンツ領域それぞれの最上段に置くタイトルバー相当の帯です。下地が drag 領域で、ウィンドウのドラッグ移動を受け持ちます。

**サイドバー側** — アイコンクラスター (アイコンのみ + 遅延表示のツールチップ) を持ちます。

| プラットフォーム | 配置 |
| --- | --- |
| macOS | 左端にトラフィックライト (セーフエリア)、その右にサイドバー開閉 (`PanelLeft`)・インポート (`FolderInput`)・Settings (`Settings`) を左詰めで続ける |
| Windows | 左端にアプリケーションメニューボタン (`Menu`、[システムメニュー](../cross-platform/system-menu.md))、右端にサイドバー開閉・インポート・Settings |
| Linux | Windows と同じ (アプリケーションメニューは全プラットフォームでインストールされるためメニューボタンも表示) |

**コンテンツ領域側** — 右端 (Windows / Linux の WCO セーフエリアの内側) に、ビューごとの曲絞り込みテキストボックスを置きます ([各ビュー仕様](../features/))。

- Artists / Albums / Playlists の各ルートで表示し、Settings では非表示
- 絞り込みテキストは `trackFilterStore` (React 外ストア、セクション別・非永続) が持ち、draft → applied を 200ms デバウンスして各ビューが `useSyncExternalStore` で読みます
- Artist ビュー: 選択中アーティストの曲をタイトルで絞り込み、一致曲を含まないアルバムは非表示
- Album ビュー: `AlbumFilter.musicTitle` として SQL WHERE に合流し、一致曲を含むアルバムだけをグリッドに表示。下段の曲リストも同じテキストで絞り込み
- Playlist ビュー: 選択中プレイリストの曲をタイトルで絞り込み。絞り込み中は並べ替えドラッグを無効化 (行番号は元の並び順を維持)

**最後に表示したビューとセクションごとの選択の復元** — 表示中のセクション (Artists / Albums / Playlists) と、Artists / Playlists それぞれの最後のサイドバー選択 (選択中アーティスト・選択中プレイリスト) を `lastViewStore` (React 外ストア) が持ち、変更のたびに `AppSettings.lastView` (`{ section, artist?, playlist? }`) へ永続化します。サイドバーのタブはこのストアを参照して各セクションの最後の選択へリンクするため、タブを行き来しても選択が保たれます。記録はルート変更を監視する `LastViewRecorder` (`/settings` は対象外、セクションのルート表示はその選択のクリア)、起動時の復元はブートストラップの `restoreLastView` が存在確認のうえストアを seed し `createRoot` 前に hash を設定して行うため、既定ルートが一瞬表示されることはありません。選択対象のアーティスト・プレイリストが消えていた場合はその選択だけを落とします。Albums のサイドバー条件は従来どおり `albumFilter` として別途永続化されます。

**サイドバー開閉・幅** — 開閉状態と幅は `sidebarStore` (React 外ストア) が持ち、変更のたびに `AppSettings.sidebar` へ永続化して再起動時に復元します (幅の保存はドラッグ確定時 = `onLayoutChanged`)。閉じている間はサイドバーのアイコンクラスターがコンテンツ領域ツールバーの左端に移り、クラスターの幅・配置を保存済みサイドバー幅と揃えることで、**開閉を操作しても各アイコンの画面上の位置が変わりません**。

## ブートストラップと Provider 構成

アプリ寿命の初期化・購読は useEffect ではなく、**`createRoot` 前のブートストラップ (`renderer.tsx`) で 1 回だけ**行います ([状態管理](state-management.md) の「useEffect・useMemo・useCallback を既定にしない」)。アプリと同寿命のため解除も不要で、StrictMode の二重実行の影響も受けません。

```tsx
// renderer.tsx (概略)
const settings = await window.mp.settings.get();     // 設定の初期ロード
applyTheme(resolveTheme(settings));                  // 初期テーマ適用
watchSystemTheme();                                  // matchMedia の監視登録
window.mp.library.onChanged(libraryStore.invalidate); // クエリストアの無効化
window.mp.menu.onAction(handleMenuAction);           // メニュー操作の受け口

createRoot(rootElement).render(
  <StrictMode>
    <SettingsProvider initialSettings={settings}>
      <PlayerProvider>
        <HashRouter>
          <AppLayout>...</AppLayout>
        </HashRouter>
      </PlayerProvider>
    </SettingsProvider>
  </StrictMode>,
);
```

- `handleMenuAction` のようにルーターや Provider の操作が必要な購読は、ブートストラップで登録した受け口からアプリ内のディスパッチャー (React 外の小さなイベントターゲット) へ流し、必要なコンポーネントが `useSyncExternalStore` で読むか、コマンドを直接呼びます
- StrictMode は有効のまま開発します。useEffect をほぼ使わない設計のため二重実行の影響範囲は小さいですが、うっかり書かれた「クリーンアップなしの購読」「毎レンダー IPC」の早期検出として機能します。オーディオエンジンの生成はコマンド (イベントハンドラー) 起点のため影響を受けません

## テーマ

- shadcn のセマンティックトークン (starter の `App.css`) を使用し、light / dark / system の 3 択を設定画面に置きます
- mme-gui と同じく、設定値と `prefers-color-scheme` を合成して `<html>` に `.dark` クラスを付与します。ただし useEffect による同期ではなく、**テーマが変わりうる 3 つの契機のハンドラーで直接適用**します
  1. 起動時: ブートストラップの `applyTheme()`
  2. 設定変更時: 設定コマンド (`setTheme`) の中で保存と同時に適用
  3. OS テーマ変更時: ブートストラップで登録した `matchMedia("(prefers-color-scheme: dark)")` リスナー (設定が system の場合のみ反映)
- 起動時のチラつき防止のため、Main は `BrowserWindow` の `backgroundColor` を保存済みテーマに合わせて指定します ([プロセス構成](../architecture/process-model.md))
- Windows / Linux の `titleBarOverlay` の配色もテーマへ追従させます。Main が `mp:settings:set` の theme 変更を検知して `setTitleBarOverlay()` を呼ぶため、新規 IPC チャネルは不要です ([プロセス構成](../architecture/process-model.md))

## i18n

mme-gui 方式の軽量実装です。

- `src/shared/locales/{en,ja}.ts` のフラット辞書 + 自前 `t(key, locale)` (`{name}` プレースホルダー補間)
- Main (メニュー、ダイアログ) と Renderer の両方から参照するため shared に置きます
- 言語は設定 (`locale`) 未指定時に OS ロケールから解決します
