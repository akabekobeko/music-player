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

## Provider 構成

```tsx
<StrictMode>
  <SettingsProvider>        {/* 設定 (テーマ・言語) */}
    <PlayerProvider>        {/* キュー + エンジン保持 */}
      <HashRouter>
        <AppLayout>         {/* Sidebar + PlayerBar + Outlet */}
          <Routes>...</Routes>
        </AppLayout>
      </HashRouter>
    </PlayerProvider>
  </SettingsProvider>
</StrictMode>
```

- StrictMode は有効のまま開発します。Effect 二重実行で壊れる実装 (毎レンダー IPC、クリーンアップなしの購読) を早期に検出するためです。オーディオエンジンの生成はコマンド (イベントハンドラー) 起点のため StrictMode の影響を受けません

## テーマ

- shadcn のセマンティックトークン (starter の `App.css`) を使用し、light / dark / system の 3 択を設定画面に置きます
- mme-gui の `useTheme` 方式: 設定値と `prefers-color-scheme` を合成して `<html>` に `.dark` クラスを付与します

## i18n

mme-gui 方式の軽量実装です。

- `src/shared/locales/{en,ja}.ts` のフラット辞書 + 自前 `t(key, locale)` (`{name}` プレースホルダー補間)
- Main (メニュー、ダイアログ) と Renderer の両方から参照するため shared に置きます
- 言語は設定 (`locale`) 未指定時に OS ロケールから解決します
