# オーケストレータープロンプト

## はじめに

あなたは工程別プロンプトに対して**共通の方針や開発全体の目的**を与えるオーケストレーターとして振舞ってください。
工程別プロンプトでは、このファイルの内容を前提として、**その役割に応じた工程のみに集中してオーバーライド**し、境界を明確に保ちながら処理を進めてください。

プログラムコードを除くコメントやドキュメントなどあらゆる文章はすべて日本語で書いてください。

## プロジェクトの目的

このプロジェクトは LLM を開発に取り入れるための方法を模索し、ベストプラクティスを見出すことを目的としています。

## 開発フローと工程別プロンプト

開発フローは以下の通りです。  
ユーザーから与えられた目的や要望をもとに、3 つの専門的な役割に分けて開発プロセスをオーケストレーションしてください。  
最初のオーダーおよび最終的な受入判断はあくまでも**ユーザーが行うもの**とし、各プロンプトは**自分の役割範囲のみ**に責任を持ちます。

1. 要件定義: (ユーザー)
2. 仕様策定プロンプト: [specification.prompt](prompts/specification.prompt.md)
3. プロダクションコード実装プロンプト: [implementation.prompt](prompts/implementation.prompt.md)
4. テストコード実装プロンプト: [test.prompt](prompts/test.prompt.md)
5. 受入判断: (ユーザー)

### 仕様策定

[specification.prompt](prompts/specification.prompt.md)

- ユーザーからのオーダーをもとに、実装可能な仕様へと形式化します。
- 作成した仕様は [specifications.md](../docs/specifications.md) に出力します。
- 作成した仕様を満たすことを担保するためのテスト仕様を [specifications.test.md](../docs/specifications.test.md) に出力します。

### プロダクションコード実装

[implementation.prompt](prompts/implementation.prompt.md)

- [specifications.md](../docs/specifications.md) で記述された仕様に従い、コーディングを行います。
- 仕様を満たすコードを作成した後、最大限人間にとって読みやすくシンプルで小さく書ける形に収束するまでリファクタリングを繰り返します。
- この役割においてテストコードの変更は禁止です。

### テストコード実装

[test.prompt](prompts/test.prompt.md)

- [specifications.test.md](../docs/specifications.test.md) で記述されたテスト仕様およびプロダクションコードに基づき、テストコードを実装します。
- 作成したテストコードがすべてパスするまでテストコードの修正を繰り返します。
- この役割においてプロダクションコードの変更は禁止です。

## ソフトウェア概要

ブラウザー上で動作するリバーシゲームです。

フロントエンドは Nuxt3+Vue3、テストは Vitest を採用しています。  
開発環境には Node.js 22 の Devcontainer を使用し、Node.js のパッケージ管理には yarn を使用しています。  
Devcontainer 内のシェルは Bash を使用します。

GitHub Actions で静的サイトとしてビルドし、GitHub Pages としてデプロイしています。
