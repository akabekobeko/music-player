# MusicBrainz API (私訳)

ここで説明する API は [MusicBrainz Database](https://musicbrainz.org/doc/MusicBrainz_Database) へのインターフェースです。メディアプレイヤー、CD リッパー、タガーなど音楽メタデータを必要とするアプリケーションの開発者を対象としています。API のアーキテクチャーは REST の設計原則に従います。API とのやり取りは HTTP で行い、すべてのコンテンツは XML または JSON のシンプルかつ柔軟な形式で提供されます。既定の形式は XML です。JSON の応答を得るには、Accept ヘッダーに `"application/json"` を設定するか、クエリー文字列に `fmt=json` を加えます (両方を設定した場合は `fmt=` が優先されます)。

## 一般的な FAQ

**MusicBrainz API で何ができますか?**
特定の [MusicBrainz エンティティー](https://musicbrainz.org/doc/MusicBrainz_Entity) の情報を調べる (「The Beatles の情報を教えて」)、あるエンティティーに結びついたエンティティーをブラウズする (「The Beatles の全リリースを見せて」)、特定のクエリーに一致するエンティティーを検索する (「クエリー 'Beatles' に一致するアーティストをすべて見せて。目当てのものを見つけて詳細を尋ねたい」) ことができます。

**誰が MusicBrainz API を使えますか? 無料ですか?**
この Web サービスの[非商用](https://musicbrainz.org/doc/Live_Data_Feed)利用は無料です。商用で利用したい場合は[商用プラン](https://metabrainz.org/supporters/account-type)を参照するか、[お問い合わせ](https://musicbrainz.org/doc/Contact_Us)ください。

**API キーは必要ですか?**
現時点では不要です。ただし、意味のある [user-agent 文字列](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting#Provide_meaningful_User-Agent_strings)が必須です。

**認証は必要ですか?**
[認証](#認証)を参照してください。

**どの形式でデータを取得できますか?**
API はもともと XML を返すように書かれましたが、現在は JSON も返せます。

**XML API と JSON API に大きな違いはありますか?**
データの取得に関しては、XML API と JSON API は実質的に同等です。MusicBrainz への[データ送信](#データの送信)ができるのは XML API だけです (ただし API 経由で送信できるのは評価、タグ、バーコード、ISRC のみです。ほとんどのデータ追加には Web サイトを使ってください)。

**1 秒あたりに発行できるリクエスト数に制限はありますか?**
**あります。**[レート制限のルール](musicbrainz-api-rate-limiting.md)を参照してください。

**とても複雑に見えます。例はありますか?**
あります。いくつかのクエリーと、それぞれで期待できる返却形式を示した[例のページ](https://musicbrainz.org/doc/MusicBrainz_API/Examples)があります。

**API の言語バインディングはありますか?**
あります。多くの言語向けに存在します。[外部ライブラリーの一覧](#ライブラリー)を参照してください。

**このドキュメントにない予期しない挙動に遭遇したらどうすればよいですか?**
[IRC](https://musicbrainz.org/doc/IRC) や[フォーラム](https://community.metabrainz.org/)で質問できます。[バグトラッカー](https://tickets.metabrainz.org/issues/?jql=project%20%3D%20MBS%20AND%20component%20%3D%20%22Web%20service%22%20AND%20resolution%20%3D%20Unresolved%20ORDER%20BY%20priority%20DESC)にチケットが登録済みか確認し、なければ登録を検討してください。

**API を使い始める前に他に知っておくべきことはありますか?**
次を知っておくと役立つでしょう。

- [MusicBrainz の構造](https://musicbrainz.org/doc/MusicBrainz_Database/Schema)
- どのような[関係 (relationships)](https://musicbrainz.org/relationships/) があるか

**API はバージョン 2 なのですね? バージョン 1 はどうなりましたか?**
API のバージョン 1 は、MusicBrainz データベースの元 (2011 年以前) のデータ構造を念頭に設計されました。現在のデータスキーマへ移行した 2011 年に非推奨となり、それを使うツールを壊さないよう (更新のないまま) 数年間稼働したのち、2019 年に最終的に停止されました。

**破壊的変更を行うことはありますか?**
避けるよう努めていますが、必要になる場合があります。その場合は[ブログ](https://blog.metabrainz.org/category/musicbrainz+breaking-changes/)で告知しますので、フォローを検討してください。

## アプリケーションのレート制限と識別

API のすべての利用者は、各クライアント アプリケーションが**1 秒あたり 1 回を超える呼び出しを決して行わない**ようにしなければなりません。1 秒に 1 回を超える呼び出しはサーバーの負荷を押し上げ、他の人が MusicBrainz API を使えなくします。1 秒に 1 回を超える呼び出しでサーバーに影響を与えた場合、あなたの IP アドレスはブロックされ、MusicBrainz へのそれ以降のアクセスがすべて遮断されることがあります。また、アプリケーションが HTTP リクエスト ヘッダーに適切な User-Agent 文字列を設定することも重要です。これら 2 つの要件の詳細は[レート制限のページ](musicbrainz-api-rate-limiting.md)を参照してください。

## 認証

データの送信と、ユーザー情報に関わるリクエストには認証が必要です。[OAuth](https://musicbrainz.org/doc/Development/OAuth2) または HTTPS 上の [digest 認証](https://en.wikipedia.org/wiki/Digest_access_authentication)で認証できます。digest 認証の場合、ユーザーは [Applications](https://musicbrainz.org/account/applications) ページで**トークン**を生成し、アカウントのパスワードの代わりに使う必要があります。

**注:** digest 認証は非推奨となり、2027 年 8 月に削除されます。詳細は[ブログの告知](https://blog.metabrainz.org/2026/06/25/upcoming-changes-to-user-accounts-and-authentication/)を参照してください。

## はじめに

API のルート URL は `https://musicbrainz.org/ws/2/` です。

API には、データベースのコア[エンティティー](https://musicbrainz.org/doc/Entity)を表す 13 のリソースがあります。

```
 area, artist, event, genre, instrument, label, place, recording, release, release-group, series, work, url
```

また、次の非コア リソース向けの API インターフェースも提供しています。

```
 rating, tag, collection
```

さらに、次のリソースでは他の一意な識別子に基づく lookup が行えます。

```
 discid, isrc, iswc
```

各エンティティー リソースでは、3 種類の GET リクエストを実行できます。

```
 lookup:   /<ENTITY_TYPE>/<MBID>?inc=<INC>
 browse:   /<RESULT_ENTITY_TYPE>?<BROWSING_ENTITY_TYPE>=<MBID>&limit=<LIMIT>&offset=<OFFSET>&inc=<INC>
 search:   /<ENTITY_TYPE>?query=<QUERY>&limit=<LIMIT>&offset=<OFFSET>
```

ただし、genre エンティティーでは現時点で browse と search は実装されていません。

**注:** [MBID](https://musicbrainz.org/doc/MusicBrainz_Identifier) (または特定の場合は disc ID、ISRC、ISWC) なしで使えるのは search リクエストだけであることに注意してください。たとえばアーティスト名やアルバム名しか持っていない場合は、検索を行って正しい結果を選び、その MBID を得る必要があります。そうして初めて lookup や browse リクエストで使えるようになります。

genre リソースでは、すべてのジャンルをアルファベット順・ページ分割で取得する "all" サブリソースをサポートしています。

```
 all:      /genre/all?limit=<LIMIT>&offset=<OFFSET>
```

`/genre/all` リソースは XML と JSON に加えて、`fmt=txt` を指定するか Accept ヘッダーを `"text/plain"` にすることで、すべてのジャンル名をテキストで出力できます。ジャンル名はアルファベット順に改行区切りで返されます (`txt` 形式では `limit` と `offset` はサポートされません)。

これら最初の 3 種類のリクエストのうち、

- lookup、非 MBID lookup、browse リクエストは以降の節で説明します。例は[専用の例のページ](https://musicbrainz.org/doc/MusicBrainz_API/Examples)にあります
- search はより複雑で、[検索のドキュメント ページ](https://musicbrainz.org/doc/MusicBrainz_API/Search)で説明しています

### Relax NG スキーマ

ファイル [musicbrainz_mmd-2.0.rng](https://github.com/metabrainz/mmd-schema/blob/master/schema/musicbrainz_mmd-2.0.rng) は、この API の XML 版の Relax NG スキーマです。API 経由で行おうとする[送信](#データの送信)の検証にも使えます。

## 検索 (Search)

検索は[検索のドキュメント ページ](https://musicbrainz.org/doc/MusicBrainz_API/Search)で説明しています。

## Lookup

エンティティーの MBID を持っていれば、そのエンティティーの lookup を行えます。

```
 lookup:   /<ENTITY_TYPE>/<MBID>?inc=<INC>
```

上記どおりの形式で MBID を指定していない限り、それは lookup リクエストではないことに注意してください。URL に artist=<MBID> のようなものが含まれるなら [Browse](#browse) の節を、query=<QUERY> が含まれるなら [Search](https://musicbrainz.org/doc/MusicBrainz_API/Search) のページを参照してください。

### サブクエリー

inc= パラメーターで、エンティティーについてより多くの情報を含めるよう要求できます。そのエンティティーに直接リンクされたエンティティーはどれでも含められます。

```
 /ws/2/area
 /ws/2/artist            recordings, releases, release-groups, works
 /ws/2/collection        user-collections (非公開コレクションを含む。認証が必要)
 /ws/2/event
 /ws/2/genre
 /ws/2/instrument
 /ws/2/label             releases
 /ws/2/place
 /ws/2/recording         releases, release-groups
 /ws/2/release           collections, labels, recordings, release-groups
 /ws/2/release-group     releases
 /ws/2/series
 /ws/2/work
 /ws/2/url
```

加えて、genre を除くすべてのエンティティー タイプで inc パラメーターにより[関係 (Relationships)](#関係-relationships) を取得できます。

1 つのリクエストに複数のサブクエリーを含めるには、`inc=` の引数を + (プラス記号) で区切ります。例: `inc=recordings+labels`。

release-groups を含むすべての lookup では、release-groups を特定のタイプで絞り込む type= 引数を使えます。releases を含むすべての lookup でも type= 引数が使え、さらに status= 引数も使えます。

返されるリンク先エンティティーの数は常に 25 件に制限されることに注意してください。残りの結果が必要なら browse リクエストを行う必要があります。リンク先エンティティーは常に gid のアルファベット順に並びます。

**注:** XML API では、`release` エンティティーに `recordings` を含めた場合、`media` 内に列挙される `tracks` は、recording のタイトルと異なるときだけ `title` を持ちます (応答サイズを減らすため)。

### サブクエリーに影響する inc= 引数

リンク先エンティティーについてどの程度のデータを含めるかを指定するため、追加の inc= パラメーターがいくつかサポートされています。

```
 - discids           releases 内のすべての media の discid を含める
 - media             すべての releases の media を含める。各 medium のトラック数とフォーマットを含む
 - isrcs             すべての recordings の isrc を含める
 - artist-credits    すべての releases と recordings の artist credit を含める
 - various-artists   アーティストがトラックのいずれかに登場するが、release 自体の artist credit には
                     含まれない releases だけを含める (/ws/2/artist?inc=releases リクエストでのみ有効)
```

### その他の inc= 引数

```
 - aliases                   artist、label、area、work の別名 (alias) を含める。意図的な順序付けはないため集合として扱うこと
 - annotation                注釈 (annotation) を含める
 - tags, ratings             エンティティーのタグや評価を含める
 - user-tags, user-ratings   上と同じだが、指定ユーザーが送信したタグや評価だけを返す
 - genres, user-genres       ジャンル (genres リストにあるタグ) を含める。それぞれ全員のもの、ユーザーが送信したもの
```

user-tags、user-genres、user-ratings を伴うリクエストには[認証](#認証)が必要です。

ジャンルの要求方法はタグと同じです。inc=genres でそのエンティティーに全員が提案したジャンルをすべて取得でき、inc=user-genres で自分が提案したジャンルをすべて取得できます (両方も可能)。たとえば [Nine Inch Nails の Year Zero](https://musicbrainz.org/release-group/3bd76d40-7f0e-36b7-9348-91a33afee20e) の release group のジャンルを得るには、XML API なら https://musicbrainz.org/ws/2/release-group/3bd76d40-7f0e-36b7-9348-91a33afee20e?inc=genres+user-genres、JSON API なら https://musicbrainz.org/ws/2/release-group/3bd76d40-7f0e-36b7-9348-91a33afee20e?inc=genres+user-genres&fmt=json です。

ジャンルはタグなので、すべてのジャンルは inc=tags でも他のタグと一緒に提供されます。そのため、MusicBrainz のジャンル リストに従うのではなく自分のジャンル リストでタグを絞り込みたい場合や、ジャンル以外のタグも取得したい場合 (ムードが欲しい、あるいはヒップホップを演奏し[殺害された](https://musicbrainz.org/tag/death%20by%20murder)アーティストを本気で探したいなど。止めはしません!) は、常にタグのエンドポイントを使えます。

### 関係 (Relationships)

適切な include で関係を要求できます。

```
 - area-rels
 - artist-rels
 - event-rels
 - genre-rels
 - instrument-rels
 - label-rels
 - place-rels
 - recording-rels
 - release-rels
 - release-group-rels
 - series-rels
 - url-rels
 - work-rels
```

これらは、要求したエンティティーと指定したエンティティー タイプとの間の関係を読み込みます。たとえば artist の lookup で "work-rels" を要求すると、その artist と任意の work との関係がすべて得られ、"artist-rels" を要求すると、その artist と他の artist との関係が得られます。したがって、artist に対する "artist-rels"、release に対する "release-rels" などは、そのエンティティーのすべての関係ではなく、同じタイプの他のエンティティーとの関係だけを読み込むことに注意してください。

release のリクエストでは、release にリンクされた recording の関係、release にリンクされた release group の関係、さらには release にリンクされた recording にリンクされた work の関係にも興味があるかもしれません (たとえば特定のトラックでギターを弾いたのは誰か、演奏されている曲の歌詞を書いたのは誰か、release group がシリーズの一部かどうかを知るため)。同様に recording のリクエストでは、リンクされた work の関係を得たい場合があるでしょう。このために 3 つの追加 include があります。

```
 - recording-level-rels
 - release-group-level-rels (release のみ)
 - work-level-rels
```

これらは単なるスイッチとして働くことに注意してください。recording に対して work-level-rels を要求しても、work-rels (そもそも recording から work への関係を得るため) と、見たい他の関係タイプ (たとえば work と artist の関係を見たいなら artist-rels) を別途要求する必要があります。

関係を含めると、エンティティーは対象エンティティー タイプごとの `<relation-list>` ノード (XML) または全関係を含む `relations` オブジェクト (JSON) を持ちます。[例のページ](https://musicbrainz.org/doc/MusicBrainz_API/Examples)にいくつかの例があります。

関係の[属性 (attributes)](https://musicbrainz.org/relationship-attributes) は `<attribute-list>` ノード (XML) または `attributes` 配列 (JSON) に入ります。関係属性は常にタイプ ID を持ち、関連する値を持つものもあります。それらは `<attribute>` 要素の属性 (XML) として、または属性名をキーとして `attribute-values` と `attribute-ids` 要素 (JSON) から得られます。関係属性には、ユーザーが指定した 'credited-as' 名がある場合もあります (たとえば "guitar" を "Fender Stratocaster"、"violin" を "1st violin" とクレジットするなど)。XML 応答ではこれは `<attribute>` 要素のさらにもう 1 つの属性であり、JSON 応答では `attribute-credits` 要素を見る必要があります。

"genre-rels" を要求しても、特定のエンティティーのジャンルは示されないことに注意してください。それには "genres" を使ってください。

## 非 MBID Lookup

MBID の代わりに、他のいくつかの一意な識別子で lookup を行えます。ただし衝突が起こることがあるため、これらの lookup はエンティティーのリストを返します (件数制限はなく、リンクされたエンティティーがすべて返されます。ページングはサポートされません)。

### discid

```
 lookup: /discid/<discid>?inc=<INC>&toc=<TOC>
```

`discid` lookup は関連する release のリストを返します。サポートされる 'inc=' 引数は release の lookup リクエストと同じです。MusicBrainz に一致する release がなく、一致する [CD stub](https://musicbrainz.org/doc/CD_Stub) がある場合は、それが返されます。これが既定の挙動です。CD stub を見たくない場合は 'cdstubs=no' を渡してください。CD stub は <cdstub> 要素に含まれ、それ以外は release と同じ形です。CD stub は artist credit を持たず、artist だけを持つことに注意してください。

"toc" クエリー パラメーターを指定し、かつ指定した disc ID を MusicBrainz が知らない場合、一致する MusicBrainz release を探すあいまい lookup が行われます。CD stub が見つかった場合はこれは行われないことに注意してください。TOC のあいまい lookup は行いたいが CD stub の検索は不要なら "cdstubs=no" を指定してください。例:

```
  /ws/2/discid/I5l9cCSFccLKFEKS.7wqSZAorPU-?toc=1+12+267257+150+22767+41887+58317+72102+91375+104652+115380+132165+143932+159870+174597
```

これはまず disc id を探し、失敗したら、指定したものと近い距離にあるトラックリストを探そうとします。

discid なしで TOC のあいまい検索を行うこともできます。discid に "-" (または任意の無効なプレースホルダー) を渡すと、有効な TOC があればそれは無視されます。

```
  /ws/2/discid/-?toc=1+12+267257+150+22767+41887+58317+72102+91375+104652+115380+132165+143932+159870+174597
```

既定では、TOC のあいまい検索はフォーマットが "CD" に設定された medium だけを返します。フォーマットにかかわらずすべての medium を検索したい場合は、クエリーに 'media-format=all' を加えてください。

```
  /ws/2/discid/-?toc=1+12+267257+150+22767+41887+58317+72102+91375+104652+115380+132165+143932+159870+174597&media-format=all
```

TOC は次で構成されます。

- 最初のトラック (常に 1)
- 総トラック数
- リードアウト (ディスクの終端) のセクター オフセット
- トラック 1 から始まる各トラックのセクター オフセットのリスト (一般に 150 セクター)

### isrc

```
 lookup: /isrc/<isrc>?inc=<INC>
```

`isrc` lookup は recording のリストを返します。サポートされる 'inc=' 引数は recording の lookup リクエストと同じです。

### iswc

```
 lookup: /iswc/<iswc>?inc=<INC>
```

`iswc` lookup は work のリストを返します。サポートされる 'inc=' 引数は work の lookup リクエストと同じです。

## url (テキストによる)

```
 lookup: /ws/2/url?resource=<URL>[&resource=<URL>]...
```

URL エンドポイントの 'resource' パラメーターは、URL の MBID ではなく URL そのものを指定するためのものです (たとえば [https://musicbrainz.org/ws/2/url?resource=http://www.madonna.com/](https://musicbrainz.org/ws/2/url?resource=http://www.madonna.com/) と [https://musicbrainz.org/ws/2/url/b663423b-9b54-4067-9674-fffaecf68851](https://musicbrainz.org/ws/2/url/b663423b-9b54-4067-9674-fffaecf68851))。この URL はクエリー パラメーターとして含めるために適切に URL エスケープする必要があります。つまり、URL エスケープ済みのパラメーターや独自のクエリー パラメーターを含む URL は、二重にエスケープする必要があります。要求した 'resource' が存在しない場合、このエンドポイントは 404 not found を返します。

'resource' パラメーターは 1 つのクエリーで複数回 (最大 100 回) 指定できます。

```
 /ws/2/url?resource=http://www.madonna.com/&resource=https://www.ladygaga.com/
```

この場合、応答は単一のトップレベル url ではなく url-list を含み、見つからなかった 'resource' はスキップされます。

## Browse

browse リクエストは、別のエンティティーに直接リンクされたすべてのエンティティーの直接的な lookup です (ここでの「直接リンク」には、関係 (relationship) によってリンクされたエンティティーは含まれません)。たとえば、レーベル ubiktune のすべての release を見たい場合:

```
 /ws/2/release?label=47e718e1-7ee4-460c-b1cc-1192a841c6e5
```

browse リクエストは検索ではないことに注意してください。ubiktune レーベルのすべての release をブラウズするには、ubiktune の MBID を知っている必要があります。

結果の順序はどのリンク先エンティティーでブラウズしているかに依存します (ただし常に一貫しています)。エンティティーを並べ替える必要がある場合は、すべてのエンティティーを取得して (下記「ページング」参照) 自分で並べ替える必要があります。

### リンク先エンティティー

browse リクエストで使えるリンク先エンティティーは次のとおりです。

```
 /ws/2/area              collection
 /ws/2/artist            area, collection, recording, release, release-group, work
 /ws/2/collection        area, artist, editor, event, label, place, recording, release, release-group, work
 /ws/2/event             area, artist, collection, event, place
 /ws/2/genre             collection
 /ws/2/instrument        collection
 /ws/2/label             area, collection, release
 /ws/2/place             area, collection
 /ws/2/recording         artist, collection, release, work
 /ws/2/release           area, artist, collection, label, track, track_artist, recording, release-group
 /ws/2/release-group     artist, collection, release
 /ws/2/series            collection
 /ws/2/work              artist, collection
```

特例として release では track_artist も使えます。これはアーティストの various artists への参加をブラウズするためのもので、トラックの artist credit にはそのアーティストが登場するが、release 全体の artist credit には登場しない release を返します (後者は artist=<MBID> のリクエストですでに返されるため)。

release-group は type で、release は type と status のいずれかまたは両方で絞り込めます。たとえば Metallica のすべてのライブ ブートレグ release が欲しい場合:

```
 /ws/2/release?artist=65f4f0c5-ef9e-490c-aee3-909e7ae6b2ab&status=bootleg&type=live
```

あるいは Autechre のすべてのアルバムと EP:

```
 /ws/2/release-group?artist=410c9baf-5469-44f6-9852-826524b80c61&type=album|ep
```

### ページング

browse リクエストはページングをサポートする唯一のリクエストです。どの browse リクエストも、さらに結果を得るための 'offset=' 引数をサポートします。browse リクエストは 'limit=' もサポートします。既定の limit は 25 で、最大 100 まで増やせます。

release に関する特記事項: リクエストがタイムアウトせずに完了できるよう、返される release の数はリスト全体で 500 トラックを超えないように制限されます (ただし、500 トラックを超える release であっても常に少なくとも 1 つの完全な release が返されます。「部分的な」release は返しません)。つまり `limit=100` を設定しても 1 ページに 100 件の release が得られるとは限らず、実際には release のサイズに応じてページごとに件数が変わります。結果を正しくページングするには、(より大きく固定された) `limit` の値ではなく、各応答で得た release の数だけ `offset` を進めてください。

### inc=

通常の lookup リクエストと同様に、'inc=' 引数でエンティティーについてより多くのデータを含めるようサーバーに指示できます。inc= でサポートされる値は次のとおりです。

```
 /ws/2/area              aliases
 /ws/2/artist            aliases
 /ws/2/event             aliases
 /ws/2/instrument        aliases
 /ws/2/label             aliases
 /ws/2/place             aliases
 /ws/2/recording         artist-credits, isrcs
 /ws/2/release           artist-credits, labels, recordings, release-groups, media, discids, isrcs (recordings と併用)
 /ws/2/release-group     artist-credits
 /ws/2/series            aliases
 /ws/2/work              aliases
 /ws/2/area              aliases
 /ws/2/url               (関係の include のみ)
```

上記の inc= 値に加えて、すべてのエンティティーが次をサポートします。

```
 annotation, tags, user-tags, genres, user-genres
```

area、place、release、series を除くすべてのエンティティーが次をサポートします。

```
 ratings, user-ratings
```

加えて、lookup リクエストと同様に、すべてのエンティティー タイプで inc パラメーターにより[関係 (Relationships)](#関係-relationships) を取得できます。

## Release (Group) の Type と Status

結果に release group を含むクエリーは、特定のタイプの release group だけを含むように絞り込めます。結果に release を含むクエリーは、特定のタイプや status の release だけを含むように絞り込めます。有効な値は次のとおりです。

```
 status     official, promotion, bootleg, pseudo-release, withdrawn, cancelled.
 type       album, single, ep, broadcast, other (primary type) / audio drama, audiobook, compilation, demo, dj-mix, field recording, interview, live, mixtape/street, remix, soundtrack, spokenword (secondary type).
```

これらの値の意味は [release status のドキュメント](https://musicbrainz.org/doc/Release#Status)と [release group type のドキュメント](https://musicbrainz.org/doc/Release_Group/Type)を参照してください。

さらに、artist による release group の browse では、Web サイトの既定の概要と同じ release group を表示する (status が promotional、bootleg、pseudo-release の release だけを含むものを除外する) 特別なフィルターをサポートします。有効な値は次のとおりです。

```
 release-group-status     website-default, all
```

## データの送信

API を使って特定の種類のデータを送信できます。現在、タグ (ジャンルを含む)、評価、ISRC を API 経由で登録できます。すべての POST リクエストには[認証](#認証)が必要です。

POST リクエストは常に URL (本文ではなく) に 'client' パラメーターを含めるべきです。'client' の値はデータを送信するクライアント ソフトウェアの ID にします。これはクライアント ライブラリーではなくアプリケーションの名前とバージョン番号でなければなりません (クライアント ライブラリーは HTTP の User-Agent ヘッダーを使うべきです)。推奨形式は "application-version" で、version には - 文字を含めません。

### ユーザーデータ

XML API で POST リクエストを使い、タグ (ジャンルを含む) と評価を送信できます。前述のとおり、クライアント ソフトウェアは 'client=' パラメーターで自身を識別する必要があります。以下の例ではクライアント識別子として 'example.app-0.4.7' を使います。これは当然ながら架空のクライアントです。

#### tags

タグ (ジャンルを含む) を送信するには、次のように /ws/2/tag の URL へ POST リクエストを行います。

```
  /ws/2/tag?client=example.app-0.4.7
```

リクエストの本文は、<user-tag> 要素を持つエンティティーの XML 形式のリストにします。リクエストの例を以下に示します。

```
<metadata xmlns="http://musicbrainz.org/ns/mmd-2.0#">
    <artist-list>
        <artist id="a16d1433-ba89-4f72-a47b-a370add0bb56">
            <user-tag-list>
                <user-tag><name>female</name></user-tag>
                <user-tag><name>korean</name></user-tag>
                <user-tag><name>jpop</name></user-tag>
            </user-tag-list>
        </artist>
    </artist-list>
    <recording-list>
        <recording id="047ea202-b98d-46ae-97f7-0180a20ee5cf">
            <user-tag-list>
                <user-tag><name>noise</name></user-tag>
            </user-tag-list>
        </recording>
    </recording-list>
</metadata>
```

POST リクエストの本文で XML を送るため、Content-Type も "application/xml; charset=utf-8" に設定してください。

タグ機能にはタグ (ジャンルを含む) への upvote と downvote があります。この用語は紛らわしいかもしれません。何かにタグを付けるとき、実際にはそれを "upvote" しています (タグの投票数に 1 を加える)。downvote は逆の操作で、タグの投票数から 1 を引きます。downvote したタグはあなたの UI から隠されます (合計の投票数が 0 以下になれば全員から隠されます)。"user-tag" 要素には、行いたい操作を指定する "vote" 属性を含められます。

```
<user-tag vote="upvote"><name>noise</name></user-tag>
<user-tag vote="downvote"><name>pop</name></user-tag>
<user-tag vote="withdraw"><name>rock</name></user-tag>
```

"withdraw" 投票は、以前に加えた upvote や downvote を取り消します (投票しなかったかのようになります)。リクエストに "vote" 属性をまったく指定しない場合 (上の例のように)、送信したタグのリストは upvote として扱われ、そのエンティティーに対する既存の upvote 済みタグをすべて置き換えます (つまりリクエストに含まれないタグは、以前に upvote されていれば取り消されます。downvote されたタグはそのまま残ります)。これはタグ投票が導入される前から維持している旧来の挙動です。リクエストに何らかの "vote" 属性を含めると、指定した投票だけが適用されます。

#### ratings

評価を送信するには、次のように /ws/2/rating の URL へ POST リクエストを行います。

```
  /ws/2/rating?client=example.app-0.4.7
```

リクエストの本文は、<user-rating> 要素を持つエンティティーの XML 形式のリストにします。リクエストの例を以下に示します。

```
<metadata xmlns="http://musicbrainz.org/ns/mmd-2.0#">
    <artist-list>
        <artist id="455641ea-fff4-49f6-8fb4-49f961d8f1ad">
            <user-rating>100</user-rating>
        </artist>
    </artist-list>
    <recording-list>
        <recording id="c410a773-c6eb-4bc0-9df8-042fe6645c63">
            <user-rating>20</user-rating>
        </recording>
    </recording-list>
</metadata>
```

#### collections

コレクションに (たとえば) release を追加・削除するには、それぞれ /ws/2/collection/<gid>/releases へ PUT または DELETE リクエストを行います。

```
   PUT /ws/2/collection/f4784850-3844-11e0-9e42-0800200c9a66/releases/455641ea-fff4-49f6-8fb4-49f961d8f1ad;c410a773-c6eb-4bc0-9df8-042fe6645c63?client=example.app-0.4.7
   DELETE /ws/2/collection/f4784850-3844-11e0-9e42-0800200c9a66/releases/455641ea-fff4-49f6-8fb4-49f961d8f1ad;?client=example.app-0.4.7
```

コレクションがサポートする他のタイプのエンティティーも送信できます。コレクションのタイプに応じて、URI の "releases" を areas、artists、events、labels、places、recordings、release-groups、works のいずれかに置き換えてください。

上の PUT の例のように、1 つのリクエストでセミコロン (;) 区切りで最大およそ 400 エンティティーを送信できます。現在、URI の長さは最大 16kb に制限されています (おおよそ 400 gid に相当します)。

コレクションの説明を得るには、コレクションの MBID で lookup リクエストを行います。

```
   GET /ws/2/collection/4a0a2cd0-3b20-4093-bd99-92788045845e
```

コレクションの説明と内容の要約を得るには、コレクションの MBID と適切なエンティティー サブクエリーで lookup リクエストを行います。

```
   GET /ws/2/collection/4a0a2cd0-3b20-4093-bd99-92788045845e/areas
   GET /ws/2/collection/f4784850-3844-11e0-9e42-0800200c9a66/releases
   ...
```

コレクションの内容を得るには、コレクションの MBID をパラメーターとして、適切なエンティティー エンドポイントで browse リクエストを行います。

```
   GET /ws/2/area?collection=4a0a2cd0-3b20-4093-bd99-92788045845e
   GET /ws/2/release?collection=f4784850-3844-11e0-9e42-0800200c9a66
   ...
```

特定ユーザーのコレクション一覧 (各コレクションのエンティティー数を含む) を得るには、editor 名で collection エンドポイントを browse します。

```
   GET /ws/2/collection?editor=rob
```

これは rob が公開したコレクションだけを返します。認証済みユーザーとして非公開コレクションも見たい場合は次のようにします。

```
   GET /ws/2/collection?editor=rob&inc=user-collections
```

### バーコードの送信

次へ XML の POST リクエストを発行することで、バーコードを release に関連付けられます。

```
   /ws/2/release/?client=example.app-0.4.7
```

リクエストの本文は、<release-list> 内の <release> のリストと、各 release につき 1 つの <barcode> 要素を持つ XML 文書でなければなりません。例:

```
<metadata xmlns="http://musicbrainz.org/ns/mmd-2.0#">
    <release-list>
        <release id="047ea202-b98d-46ae-97f7-0180a20ee5cf">
            <barcode>4050538793819</barcode>
        </release>
    </release-list>
</metadata>
```

GTIN (EAN/UPC) コードだけが受け付けられます。チェックサムが正しくないコードや 2 桁・5 桁のアドオンつきのコードは拒否されます。それらは代わりに release エディターで注釈として手動追加してください。

このリクエストを発行すると、MusicBrainz はこれらの変更を適用する 1 件の編集を編集キューに作成します。これらの変更は自動的には適用されませんが、誰も反対票を投じなかった場合、または変更が期限切れになった時点で適用されます。

### ISRC の送信

次へ XML の POST リクエストを発行することで、ISRC を recording に関連付けられます。

```
   /ws/2/recording/?client=example.app-0.4.7
```

リクエストの本文は、<recording-list> 内の <recording> のリストと、recording に関連付ける <isrc-list> 内の <ISRC> のリストを持つ XML 文書でなければなりません。例:

```
<metadata xmlns="http://musicbrainz.org/ns/mmd-2.0#">
  <recording-list>
    <recording id="b9991644-7275-44db-bc43-fff6c6b4ce69">
      <isrc-list count="1">
        <isrc id="JPB600601201" />
      </isrc-list>
    </recording>
    <recording id="75c961c9-6e00-4861-9c9d-e6ca90d57342">
      <isrc-list count="1">
        <isrc id="JPB600523201" />
      </isrc-list>
    </recording>
  </recording-list>
</metadata>
```

## ライブラリー

C/C++ ライブラリー [libmusicbrainz](https://musicbrainz.org/doc/libmusicbrainz) でアクセスできます。サードパーティーのライブラリー:

- C#/Mono/.NET:
  - [avatar29A/MusicBrainz](https://github.com/avatar29A/MusicBrainz)
  - [MetaBrainz.MusicBrainz](https://github.com/Zastai/MetaBrainz.MusicBrainz) ([NuGet Package](https://www.nuget.org/packages/MetaBrainz.MusicBrainz))
- Common Lisp - [cl-musicbrainz](https://github.com/0/cl-musicbrainz)
- Go
  - [github.com/michiwend/gomusicbrainz](https://github.com/michiwend/gomusicbrainz)
  - [go.uploadedlobster.com/musicbrainzws2](https://git.sr.ht/~phw/go-musicbrainzws2)
- Haskell:
  - [ClintAdams/MusicBrainz](http://hackage.haskell.org/package/MusicBrainz)
  - [ocharles/musicbrainz-data](https://github.com/ocharles/haskell-musicbrainz-ws2)
- Java - [musicbrainzws2-java](http://code.google.com/p/musicbrainzws2-java/)
- JavaScript/Node.js:
  - [musicbrainz-api](https://github.com/Borewit/musicbrainz-api)
  - [node-musicbrainz](https://github.com/maxkueng/node-musicbrainz)
- Objective-C - [libmusicbrainz-objc](https://github.com/demosdemon/libmusicbrainz-objc)
- Perl - [WebService::MusicBrainz](https://metacpan.org/pod/WebService::MusicBrainz)
- PHP:
  - [lachlan-00/MusicBrainz](https://github.com/lachlan-00/MusicBrainz) ([mikealmond/MusicBrainz](https://github.com/mikealmond/MusicBrainz) のフォーク)
  - [mikealmond/MusicBrainz](https://github.com/mikealmond/MusicBrainz) ([phpbrainz](https://musicbrainz.org/doc/phpbrainz) のフォーク)
  - [PBXg33k/MusicBrainz](https://github.com/PBXg33k/MusicBrainz)
  - [stephan-strate/php-music-brainz-api](https://github.com/stephan-strate/php-music-brainz-api)
- Python - [python-musicbrainzngs](http://python-musicbrainzngs.readthedocs.org/)
- Ruby:
  - [dwo/musicbrainz-ruby](https://github.com/dwo/musicbrainz-ruby)
  - [magnolia-fan/musicbrainz](https://github.com/magnolia-fan/musicbrainz)
- Rust - musicbrainz_rs: [Crate](https://crates.io/crates/musicbrainz_rs) ([GitHub](https://github.com/oknozor/musicbrainz_rs))

---

## この文書について

- 元資料: [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) (MusicBrainz wiki の revision #79405 を 2026-09-24 に参照)
- 本文書は Parade の実装のために作成した**私訳**であり、MusicBrainz / MetaBrainz Foundation による公式の翻訳ではありません。内容は参照時点のものであり、最新の情報は必ず元資料を確認してください
- 元資料は [CC BY-NC-SA 3.0](https://musicbrainz.org/doc/About/Data_License) で提供されています
