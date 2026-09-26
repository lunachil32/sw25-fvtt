# ソード・ワールド2.5 for FoundryVTT（フォーク）

FoundryVTT 用のソード・ワールド2.5ゲームシステムです。
[Jean.N 氏による本家リポジトリ](https://github.com/jeannjeann/sw25-fvtt)をもとに、このフォークでメンテナンスを行います。

## このフォークの目的

本家の更新が再開されるまでの一時的な対応として、ソード・ワールド2.5を FoundryVTT で継続して利用できるよう、以下の改善を進めます。

- 新しいバージョンの FoundryVTT への対応
- 新発売のサプリメントに伴う機能・データ構造への対応
- 不具合の修正、コードの整理とリファクタリング

開発は [lunachil32/sw25-fvtt](https://github.com/lunachil32/sw25-fvtt) で行います。
この期間に必要な改善を、このフォーク内で進めます。

## 開発・対応状況

現在は開発準備段階です。独自のリリースはまだありません。

| 項目 | 状況 |
| --- | --- |
| フォーク元のバージョン | 2.4.1 |
| 本家から継承した FoundryVTT の互換性宣言 | minimum: 12 / verified: 12.343 / maximum: 13 |
| フォークとしての動作検証 | 未実施。確認した環境を今後記載します |

互換性宣言は現在の [system.json](system.json) の記載です。
このフォークでの動作確認結果や、新しい FoundryVTT への対応完了を示すものではありません。

## インストール

フォーク版の配布用マニフェストとインストール手順は、初回リリース時に案内します。
現在の `system.json` にある `manifest`・`download` は本家のリリースを指しています。

本家版の導入方法や案内は、[本家リポジトリの README](https://github.com/jeannjeann/sw25-fvtt#readme) を参照してください。

## ドキュメント

- [日本語マニュアル](docs/MANUAL.md)
- [English Manual](docs/MANUAL-en.md)
- [変更履歴](CHANGELOG.md)

マニュアルと過去の変更履歴は本家から引き継いだ資料です。
マニュアル冒頭の版表記は日本語が v0.10.3、英語が v0.10.2 で、現在のシステムバージョンとは異なります。
このフォークでの機能変更や検証に合わせて更新していきます。

## 開発とブランチ運用

| ブランチ | 用途 |
| --- | --- |
| `main` | このフォークのリリース状態を管理する既定ブランチ |
| `upstream-sync` | 本家の `main` を追跡するブランチ |
| 作業ブランチ | 新機能、修正、リファクタリング、取り込み後の検証 |

本家の更新は `upstream-sync` に取り込み、作業ブランチで検証してからリリースに反映します。
ブランチの役割と命名規則は [ブランチ運用](docs/BRANCHING.md) を参照してください。

## AI ポリシー

このリポジトリは、[FoundryVTT の AI Content Policy](https://foundryvtt.com/article/ai-policy/) に全面的に同意し、同ポリシーに従って開発・運用します。

同ポリシーで認められる範囲で、実装・リファクタリング・調査・テスト・ドキュメント整備などへの AI の活用を許可します。
ただし、AI が生成した内容を含め、変更の目的・実装・影響を人間が理解し、説明・修正・保守できる状態を維持することを前提とします。
変更内容とその品質に対する責任は、人間の開発者・メンテナーが負います。

プルリクエストは、人間が内容を把握し、十分にレビューできる規模と構成にしてください。
変更量や複雑さが人間の理解・レビュー能力を超える大規模なプルリクエストは、分割を求めたり、受け入れを見送ったりする場合があります。
AI の利用有無にかかわらず、変更の目的・影響範囲・検証結果を説明し、必要に応じて独立してレビューできる単位に分けて提出してください。

## 不具合報告・問い合わせ

このフォークに関する不具合報告・問い合わせは、[このリポジトリの Issues](https://github.com/lunachil32/sw25-fvtt/issues) へお願いします。
このフォーク固有の変更に関する不具合や問い合わせを、本家リポジトリへ送らないでください。

## 本家システムの開発者・貢献者

本家リポジトリの FoundryVTT 用システムは、[Jean.N](https://github.com/jeannjeann) 氏が開発したものです。
本家の実装・翻訳・改善を引き継いでいます。

本家 README に記載された開発協力者：

- [kuouvadis](https://github.com/kuouvadis)
- [HikariNoTsurugi](https://github.com/HikariNoTsurugi)
- [keyslock](https://github.com/keyslock)
- [Airamhh](https://github.com/Airamhh)
- [Ryotai](https://github.com/ryotai-trpg)

継承した言語データは、日本語（Jean.N）、英語（kuouvadis）、韓国語（[CC8788](https://github.com/CC8788)）です。

本家システムの開発者への支援については、[本家リポジトリの README](https://github.com/jeannjeann/sw25-fvtt#readme) をご覧ください。

## 権利表記

[MIT ライセンス](LICENSE.txt)。本家システムの著作権表記とライセンス本文は `LICENSE.txt` を参照してください。

本作は、「グループSNE」および「株式会社KADOKAWA」が権利を有する『ソード・ワールド2.0/2.5』の、二次創作です。 (C)GroupSNE (C)KADOKAWA

このシステムは Boilerplate テンプレートをベースにしています。

このシステムは、Apache License 2.0 に基づいて許諾されている [MingCute Icon](https://www.mingcute.com/) を使用しています。 (C) 2025 MingCute Design.
