# ルーティングとレイアウト

画面遷移とアプリ全体のレイアウト構成です。

## ルーティング

React Router v7 の HashRouter を使用します (file:// ロードのため。選定理由は [技術選定](../architecture/tech-stack.md))。

| パス | 画面 | 備考 |
| --- | --- | --- |
| `/` | `/artists` へリダイレクト | |
| `/artists` | Artist ビュー (未選択状態) | |
| `/artists/:artistName` | Artist ビュー (選択済み) | アーティスト名は encodeURIComponent |
| `/albums` | Album ビュー | フィルター状態は URL に持たず state + settings 永続化 |
| `/playlists` | Playlist ビュー (未選択状態) | |
| `/playlists/:playlistId` | Playlist ビュー (選択済み) | 静的・動的とも。id は `p<id>` / `s<id>` で種別を区別 |
| `/settings` | 設定画面 | モーダルではなくルートにする (将来の項目増加に備える) |

- 選択状態をルートに載せることで、「アーティストを選ぶ」「プレイリストを開く」がブラウザーバック相当 (mod+[ 等) で戻れるようになります。audio-player は選択状態が Context のみで、ルーティングが実質機能していませんでした
- 再生状態・カレントキューはルートと独立です。画面遷移しても再生は継続します

## レイアウト

audio-player の構成 (左サイドバー + 右コンテンツ、下部固定ではなく上部プレーヤー) を基本に、react-resizable-panels は使わずシンプルな CSS Grid で開始します (パネルリサイズは要望が出てから)。

```
┌────────────────────────────────────────────┐
│ タイトルバー (macOS: hiddenInset + drag 領域)  │
├──────────┬─────────────────────────────────┤
│ Sidebar  │ PlayerBar (常時表示)              │
│          ├─────────────────────────────────┤
│ - ナビ    │                                 │
│ - フィルター│ コンテンツ領域 (Outlet)            │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

- **Sidebar**: 上段にナビゲーション (Artists / Albums / Playlists。Lucide アイコン + ラベル)、下段にビュー固有のセカンダリー領域
  - Artist ビュー: アーティスト一覧
  - Album ビュー: フィルター UI ([Album ビュー](../features/album-view.md))
  - Playlist ビュー: プレイリスト一覧 + 新規作成
  - audio-player のタブ方式 (Tabs で 3 リストを切り替え) はやめ、**ルートに応じて Sidebar の中身が変わる**方式にします。ナビとコンテンツの対応が明確になり、タブの forceMount キャッシュも不要になります
- **PlayerBar**: 全ルートで常時表示 ([プレーヤー UI](../features/player-ui.md))
- **コンテンツ領域**: ルートの Outlet。一覧は @tanstack/react-virtual で仮想スクロール

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

## i18n

mme-gui 方式の軽量実装です。

- `src/shared/locales/{en,ja}.ts` のフラット辞書 + 自前 `t(key, locale)` (`{name}` プレースホルダー補間)
- Main (メニュー、ダイアログ) と Renderer の両方から参照するため shared に置きます
- 言語は設定 (`locale`) 未指定時に OS ロケールから解決します
