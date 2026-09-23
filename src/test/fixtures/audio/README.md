# テスト用音声ファイル

`@akabeko/music-metadata-editor` (mme) のリポジトリー `packages/core/tests/fixtures/` から複製したフィクスチャーです (MIT)。いずれも数百バイトから数 KB の最小構成で、メタデータの書き込み往復テスト (`src/main/library/runUpdateMusics/writeMusicFile.test.ts`) が対応フォーマットごとに使います。

| ファイル | フォーマット | 内容 |
| --- | --- | --- |
| v23-basic.mp3 | mp3 | ID3v2.3 の基本タグ |
| v24-with-extras.mp3 | mp3 | ID3v2.4、フロントカバーつき |
| basic.flac | flac | Vorbis Comment の基本タグ |
| with-picture.flac | flac | フロントカバーつき |
| basic.m4a | m4a | iTunes ilst の基本タグ |
| with-picture.m4a | m4a | フロントカバーつき |
| vorbis-basic.ogg | ogg | Ogg Vorbis の基本タグ |
| opus-basic.opus | opus | Ogg Opus の基本タグ |
| id3.wav | wav | ID3 チャンクの基本タグ |
| id3.aiff | aiff | ID3 チャンクの基本タグ |
| both-descriptions.wma | wma | Content Description と Extended Content Description |
| basic.ape | ape | APEv2 の基本タグ |
| with-picture.ape | ape | フロントカバーつき |

テストは各ファイルを一時ディレクトリーへコピーしてから書き込むため、ここにあるファイルは変更されません。
