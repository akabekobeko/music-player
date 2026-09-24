# Cover Art Archive / API (私訳)

カバーアートを取得するリクエストはすべて coverartarchive.org サービスを経由しなければなりません。エンドポイントには 3 種類のクラスがあり、波括弧で囲まれたテキストは変数を示します。

### /release/{mbid}/

#### 概要

MusicBrainz release で利用可能なカバーアートの JSON 一覧を取得します。

#### 受け付けるメソッド

- GET
- HEAD

#### 応答

- 307: この MBID の release がある場合、index.json ファイルへリダイレクト
- 400: {mbid} を有効な UUID として解釈できない場合
- 404: この MBID の release がない場合
- 405: リクエスト メソッドが GET でも HEAD でもない場合
- 406: Accept ヘッダーに適した応答をサーバーが生成できない場合
- 503: ユーザーがレート制限を超えた場合

#### 例

```
   > GET /release/76df3287-6cda-33eb-8e9a-044b5e15ffdd HTTP/1.1
   > Host: coverartarchive.org
   > Accept: application/json
```

```
   < HTTP/1.0 200 OK
   < Status: 200
   {
     "images":[
        {
           "types":[
              "Front"
           ],
           "front":true,
           "back":false,
           "edit":17462565,
           "image":"http://coverartarchive.org/release/76df3287-6cda-33eb-8e9a-044b5e15ffdd/829521842.jpg",
           "comment":"",
           "approved":true,
           "id":"829521842",
           "thumbnails":{
             "250":"http://coverartarchive.org/release/76df3287-6cda-33eb-8e9a-044b5e15ffdd/829521842-250.jpg",
             "500":"http://coverartarchive.org/release/76df3287-6cda-33eb-8e9a-044b5e15ffdd/829521842-500.jpg",
             "1200":"http://coverartarchive.org/release/76df3287-6cda-33eb-8e9a-044b5e15ffdd/829521842-1200.jpg",
             "small":"http://coverartarchive.org/release/76df3287-6cda-33eb-8e9a-044b5e15ffdd/829521842-250.jpg",
             "large":"http://coverartarchive.org/release/76df3287-6cda-33eb-8e9a-044b5e15ffdd/829521842-500.jpg"
           }
        }
     ],
     "release":"http://musicbrainz.org/release/76df3287-6cda-33eb-8e9a-044b5e15ffdd"
   }
```

### /release/{mbid}/front

#### 概要

release の「表 (front)」と呼ぶのに最もふさわしい画像を取得します。これは意図的に曖昧にしてあり、ユーザーがこのデータを意味のあるものへ整えていきますが、ここには次の場面でユーザーが最も期待するであろうアートワークがあります。

- release を検索したときのデジタル ショップ
- ポータブル メディア プレイヤー
- ファイル ブラウザーのフォルダー アイコン (サポートされていれば)
- 店でこの release を探したときに見つかると期待するもの

#### 受け付けるメソッド

- GET
- HEAD

#### 応答

- 307: コミュニティーがこの release の「表」画像を決めている場合
- 400: {mbid} を有効な UUID として解釈できない場合
- 404: この MBID の release がないか、コミュニティーが release の表を表す画像を選んでいない場合
- 405: リクエスト メソッドが GET でも HEAD でもない場合
- 503: ユーザーがレート制限を超えた場合

#### 例

```
   > GET /release/76df3287-6cda-33eb-8e9a-044b5e15ffdd/front HTTP/1.1
   > Host: coverartarchive.org
```

```
   < HTTP/1.1 307 Temporary Redirect
   < Status: 307
   < Location: http://s3.us.archive.org/mbid-76df3287-6cda-33eb-8e9a-044b5e15ffdd/mbid-76df3287-6cda-33eb-8e9a-044b5e15ffdd-829521842.jpg
```

### /release/{mbid}/back

#### 概要

release の「裏 (back)」と呼ぶのに最もふさわしい画像を取得します。これは意図的に曖昧にしてあり、ユーザーがこのデータを意味のあるものへ整えていきますが、ここには通常次を含むアートワークがあります。

- トラックリスト、バーコード、レーベル
- 店でこの release を探したときに裏ジャケットに見つかるとユーザーが期待するもの

#### 受け付けるメソッド

- GET
- HEAD

#### 応答

- 307: コミュニティーがこの release の「裏」画像を決めている場合
- 400: {mbid} を有効な UUID として解釈できない場合
- 404: この MBID の release がないか、コミュニティーが release の裏を表す画像を選んでいない場合
- 405: リクエスト メソッドが GET でも HEAD でもない場合
- 503: ユーザーがレート制限を超えた場合

#### 例

```
   > GET /release/99b09d02-9cc9-3fed-8431-f162165a9371/back HTTP/1.1
   > Host: coverartarchive.org
```

```
   < HTTP/1.1 307 Temporary Redirect
   < Status: 307
   < Location: http://archive.org/download/mbid-99b09d02-9cc9-3fed-8431-f162165a9371/mbid-99b09d02-9cc9-3fed-8431-f162165a9371-135822686.jpg
```

### /release/{mbid}/{id}

#### 概要

特定のアートワークを取得します。取りうる {id} の値は /release/{mbid} リクエストの応答を解析して得られます。

#### 受け付けるメソッド

- GET
- HEAD

#### 応答

- 307: バイナリー画像へリダイレクト
- 404: この MBID の release が見つからない場合
- 405: リクエスト メソッドが GET でも HEAD でもない場合
- 503: ユーザーがレート制限を超えた場合

#### 例

```
   > GET /release/foo/135741621.jpg HTTP/1.1
   > Host: coverartarchive.org
```

```
   < HTTP/1.1 307 Temporary Redirect
   < Status: 307
   < Location: http://archive.org/download/mbid-99b09d02-9cc9-3fed-8431-f162165a9371/mbid-99b09d02-9cc9-3fed-8431-f162165a9371-135741621.jpg
```

### /release/{mbid}/({id}|front|back)-(250|500|1200)

#### 概要

特定のアートワークのサムネイルを取得します。取りうる {id} の値は /release/{mbid} リクエストの応答を解析して得られます。現在サポートされるサムネイル サイズは 250px、500px、1200px です。

#### 受け付けるメソッド

- GET
- HEAD

#### 応答

- 307: バイナリー画像へリダイレクト。サムネイルが存在しない場合、リダイレクト先のリクエストは 404 になることがあります
- 404: この MBID の release が見つからない場合
- 405: リクエスト メソッドが GET でも HEAD でもない場合
- 503: ユーザーがレート制限を超えた場合

#### 例

```
   > GET /release/99b09d02-9cc9-3fed-8431-f162165a9371/135741621-250.jpg HTTP/1.1
   > Host: coverartarchive.org
```

```
   < HTTP/1.1 307 Temporary Redirect
   < Status: 307
   < Location: http://archive.org/download/mbid-99b09d02-9cc9-3fed-8431-f162165a9371/mbid-99b09d02-9cc9-3fed-8431-f162165a9371-135741621-250.jpg
```

### /release-group/{mbid}/

#### 概要

MusicBrainz release group で利用可能なカバーアートの JSON 一覧と、そのアートの取得元となった特定の release の URL を取得します。

#### 受け付けるメソッド

- GET
- HEAD

#### 応答

- 200: この MBID の release group があり、カバーアートがある場合
- 400: {mbid} を有効な UUID として解釈できない場合
- 404: この MBID の release group がないか、コミュニティーが release group を表す画像を選んでいない場合
- 501: リクエスト メソッドがサポートされていない場合
- 503: ユーザーがレート制限を超えた場合

#### 例

```
   > GET /release-group/c31a5e2b-0bf8-32e0-8aeb-ef4ba9973932 HTTP/1.1
   > Host: coverartarchive.org
   > Accept: application/json
```

```
   < HTTP/1.1 200 OK
   < Status: 200
   {
       "release":"https://musicbrainz.org/release/f268b8bc-2768-426b-901b-c7966e76de29",
       "images":[
           {
               "edit":37284546,
               "id":"12750224075",
               "image":"http://coverartarchive.org/release/f268b8bc-2768-426b-901b-c7966e76de29/12750224075.png",
               "thumbnails":{
                   "250":"http://coverartarchive.org/release/f268b8bc-2768-426b-901b-c7966e76de29/12750224075-250.jpg",
                   "500":"http://coverartarchive.org/release/f268b8bc-2768-426b-901b-c7966e76de29/12750224075-500.jpg",
                   "1200":"http://coverartarchive.org/release/f268b8bc-2768-426b-901b-c7966e76de29/12750224075-1200.jpg",
                   "small":"http://coverartarchive.org/release/f268b8bc-2768-426b-901b-c7966e76de29/12750224075-250.jpg",
                   "large":"http://coverartarchive.org/release/f268b8bc-2768-426b-901b-c7966e76de29/12750224075-500.jpg"
               },
               "comment":"",
               "approved":true,
               "front":false,
               "types":[
                   "Back"
               ],
               "back":true
           }
       ]
   }
```

### /release-group/{mbid}/front[-(250|500|1200)]

#### 概要

release group の「表 (front)」と呼ぶのに最もふさわしい画像 (またはそのサムネイルの 1 つ) を取得します。これは意図的に曖昧にしてあり、ユーザーがこのデータを意味のあるものへ整えていきますが、ここには次の場面でユーザーが最も期待するであろうアートワークがあります。

- release を検索したときのデジタル ショップ
- ポータブル メディア プレイヤー
- ファイル ブラウザーのフォルダー アイコン (サポートされていれば)
- 店でこの release を探したときに見つかると期待するもの

#### 受け付けるメソッド

- GET
- HEAD

#### 応答

- 307: コミュニティーがこの release group の「表」画像を決めている場合
- 400: {mbid} を有効な UUID として解釈できない場合
- 404: この MBID の release がないか、コミュニティーが release の表を表す画像を選んでいない場合
- 405: リクエスト メソッドが GET でも HEAD でもない場合
- 503: ユーザーがレート制限を超えた場合

#### 例

```
   > GET /release-group/48140466-cff6-3222-bd55-63c27e43190d/front HTTP/1.1
   > Host: coverartarchive.org
```

```
   < HTTP/1.1 307 Temporary Redirect
   < Status: 307
   < Location: http://archive.org/download/mbid-76df3287-6cda-33eb-8e9a-044b5e15ffdd/mbid-76df3287-6cda-33eb-8e9a-044b5e15ffdd-829521842.jpg
```

### OPTIONS のサポート

coverartarchive.org のすべてのエンドポイントは、各リソースで有効なリクエスト メソッドを判定するための HTTP OPTIONS メソッドをサポートします。OPTIONS リクエストに対してサーバーは、そのリソースでサポートするメソッドを 'Allow:' ヘッダー フィールドに設定した空の応答を返す以外の処理を行いません。サポートされるメソッドは各リソースの仕様を参照してください。

## レート制限のルール

現在、[http://coverartarchive.org](http://coverartarchive.org) にレート制限のルールはありません。

## Cover Art Archive のメタデータ

Cover Art Archive は各 release とともにメタデータのコレクションを提供し、ユーザーはそれによってカバーアートを何に使えるかを判断できます。メタデータは application/json として保存・提供されます。メタデータは順序付きのエントリー リストで構成され、各エントリーは次を含みます。

| キー | 意味 |
| --- | --- |
| image | 元画像の coverartarchive.org の完全な URL |
| thumbnails | それぞれのサイズ (ピクセル) のサムネイルへリンクする "250"、"500"、"1200" キーを含むオブジェクト。"small" と "large" は非推奨のキーで、それぞれ "250" と "500" と同等 |
| types | 画像のタイプの 0 個以上のリスト ([一覧を参照](https://musicbrainz.org/doc/Cover_Art/Types)) |
| front | ブール値。これが「メインの表」(/front が返すもの) かどうかを示す |
| back | ブール値。これが「メインの裏」(/back が返すもの) かどうかを示す |
| comment | 自由記述のコメント |
| approved | 画像が musicbrainz の編集システムで承認されたかどうか |
| edit | musicbrainz 上の編集 ID (例: 123) |
| id | archive.org 内部のファイル ID |

メタデータには release フィールドの下に MusicBrainz release へのリンクも含まれます。

### JSON 出力の例

```
 {
    "images" : [
        {
            "types" : [ "Front" ],
            "front" : true,
            "back" : false,
            "comment" : "",
            "image" : "http://coverartarchive.org/...jpg",
            "thumbnails" : {
                "small" : "http://coverartarchive.org/...-250.jpg",
                "large" : "http://coverartarchive.org/...-500.jpg"
            },
            "approved" : true,
            "edit" : 123,
            "id" : "456"
        },
        {
            "types" : [ "Other" ],
            "front" : false,
            "back" : false,
            "comment" : "autographed by ModBot",
            "image" : "http://coverartarchive.org/...jpg",
            "thumbnails" : {
                "250" : "http://coverartarchive.org/...-250.jpg",
                "500" : "http://coverartarchive.org/...-500.jpg",
                "1200" : "http://coverartarchive.org/...-1200.jpg",
                "small" : "http://coverartarchive.org/...-250.jpg",
                "large" : "http://coverartarchive.org/...-500.jpg"
            },
            "approved" : true,
            "edit" : 124,
            "id" : "457"
        }
    ],
    "release" : "http://musicbrainz.org/release/2ba4396d-c0be-4a56-b4ea-0438306eb3be"
  }
```

### ファイルの命名

ファイルは現在の高分解能システム時刻から導出した整数で命名されます (たとえば Perl の `Time::HiRes::time` 関数によって)。新しいファイル名を作る正確な式は次のとおりです。

```
   int((time() - 1327528905) * 100)
```

このファイル名はアップロード時に MusicBrainz によって割り当てられ、決して変わりません。

## ライブラリー

C/C++ ライブラリー [libcoverart](https://musicbrainz.org/doc/libcoverart)、または Perl ライブラリー [CoverArtArchive](https://github.com/metabrainz/CoverArtArchive) ([CPAN Distribution](https://metacpan.org/dist/Net-CoverArtArchive)) でアクセスできます。サードパーティーのライブラリー:

- C#/Mono/.NET - [MetaBrainz.MusicBrainz.CoverArt](https://github.com/Zastai/MetaBrainz.MusicBrainz.CoverArt) ([NuGet Package](https://www.nuget.org/packages/MetaBrainz.MusicBrainz.CoverArt/))
- Go - [gocaa](https://github.com/mineo/gocaa)
- Java - [coverartarchive-api](https://github.com/lastfm/coverartarchive-api)。`CoverArtArchiveClient` クラスを提供。Last.fm が開発
- PHP - [php-cover-art-archive-api](https://github.com/stephan-strate/php-cover-art-archive-api)

---

## この文書について

- 元資料: [Cover Art Archive / API](https://musicbrainz.org/doc/Cover_Art_Archive/API) (MusicBrainz wiki の revision #77795 を 2026-09-24 に参照)
- 本文書は Parade の実装のために作成した**私訳**であり、MusicBrainz / MetaBrainz Foundation による公式の翻訳ではありません。内容は参照時点のものであり、最新の情報は必ず元資料を確認してください
- 元資料は [CC BY-NC-SA 3.0](https://musicbrainz.org/doc/About/Data_License) で提供されています
