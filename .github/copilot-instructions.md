# ガイドライン

## はじめに

このプロジェクトの開発者は日本人です。  
コードを除くコメントやドキュメントなどあらゆる文章はすべて日本語で書いてください。

## プロジェクト概要

ブラウザー上で動作するリバーシゲームです。

フロントエンドは Nuxt3+Vue3、テストは Vitest を採用しています。  
開発環境には Node.js 22 の Devcontainer を使用し、Node.js のパッケージ管理には yarn を使用しています。  
Devcontainer 内のシェルは Bash を使用します。

GitHub Actions で静的サイトとしてビルドし、GitHub Pages としてデプロイしています。

仕様書を docs/specifications.md にて管理しています。  
プロジェクト内のコードに変更が入った際は必ず更新し、コードと仕様書が乖離しないように徹底してください。

## コーディング規約

- Vue ファイル内のロジック部分は TypeScript で記述してください。
- コードは可能な限りシンプルかつ可読性の高いものにしてください。
  - シンプルとは、記述量や行数が少ないことではありません。コードを順に読んでいって日本語訳したときに最も簡潔な日本語の文章となることがシンプルなコードです。つまり、コードをシンプルに保つためには仕様そのものが単純である必要があります。
  - 分岐は可能な限り減らし、冪等性を高めるようにしてください。
- コード上のコメントは処理の「内容」ではなく「意味」を記述してください。
  - コードからただ日本語に直訳しただけのコメントは一切不要です。
  - なぜその処理が必要となったのか、あるいは仕様レベルで意味を記述するようにしてください。
  - 行末のコメントは禁止です。コメントを書く場合は必ずブロック単位で先頭に記述するようにしてください。
- IDE の静的解析の恩恵を受けるため、JSDoc、型アノテーションを可能な限り付与してください。
- 非同期処理は async/await で記述してください。同時に行える非同期処理は Promise.all を使用してください。

### 命名規則

- 変数名や関数名は camelCase を使用してください。
- 定数名は UPPER_CASE を使用してください。
- クラス名は PascalCase を使用してください。

## テスト規約

- テストファーストを原則とします。仕様を決めた後はそれを検査するテストコードを先に用意し、これを通すプロダクションコードを書いてください。
- コードを変更した際は必ず自動テスト (yarn test) を実行してください。テストが通らないコードは通るようになるまで提供しないでください。
- 仕様を変更した場合は必ずこれに合わせてテストも修正してください。
- テストが失敗するとき、仕様が変わったことに起因する場合は正しい仕様に合わせてテストコードを修正してください。仕様が変わっていない場合はテストが通るようにプロダクションコードを修正してください。この判断がつかない場合は開発者に確認してください。
- テストは describe でグループ化し、it でテストケースを書いてください。タイトルはすべて日本語としてください。

## デバッグ時の注意事項

- エラーやトラブルシューティングにあたっては、仕様やコードベース全体における一貫性を犠牲とするような局所的な解決（あるいは力技ともいう）を許容しません。場当たり的な解決ではなく根本的な解決を優先してください。
