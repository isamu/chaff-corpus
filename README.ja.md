# chaff-corpus

[English](README.md)

実際の文書と、それに対する [chaff](https://isamu.github.io/lab/) の指摘の判定を組にして置き、CI で全部を回すレポジトリです。

chaff（npm [`chaffjs`](https://www.npmjs.com/package/chaffjs)）は日本語と英語のビジネス文書を、毎回同じ結果になるやり方で検査します。
ここには実際の文書と、chaff がその文書に出す指摘一つ一つの判定（正しい・誤検出・本来出すべきなのに出ない）を置きます。
CI は全文書に chaff をかけ、ルールごと・ジャンルごとの精度と見逃しを報告します。

このレポジトリは**報告するだけ**で、chaff 本体の PR を止めることはありません。このレポジトリ自身の CI が失敗するのは、
「正しい」と判定した指摘が消えたとき、全指摘を判定済みの文書に新しい指摘が出たとき、文書のメタデータが不正なときだけです。

## 置き方

```
docs/<lang>/<genre>/<id>.md     本文（プレーンテキストなら <id>.txt。chaff はテキストとして読む）
docs/<lang>/<genre>/<id>.yaml   文書の情報: 出典、ライセンス、言語、ジャンル、本文の sha256
expected/<id>.yaml              chaff が出す指摘すべてと、それぞれの判定
allowlist.yaml                  本文に残してよい、公開済みの連絡先アドレス・電話番号
scripts/                        validate.ts と run.ts、それらが使う純粋関数
```

`<genre>` は chaff のジャンル（`business/report`、`legal/statute` など。一覧は `npx chaff genres`）です。

### 文書の `.yaml`

```yaml
id: q3-report
title: 第3四半期報告
language: ja                # ja | en
genre: business/report      # chaff が知っているジャンル
format: markdown            # markdown（<id>.md、既定） | text（<id>.txt）
source:
  url: https://example.go.jp/reports/q3
  fetched: 2026-10-14
license:
  name: CC-BY-4.0
  url: https://creativecommons.org/licenses/by/4.0/   # ライセンスが書かれている場所
  note: 出典: 〇〇省ホームページ（…）を加工して作成     # 帰属表示など、ライセンスが求めること
redistribute: true          # false なら、この .yaml だけを置き、本文は実行時に取得する
sha256: 3f5a…               # chaff が読む本文の sha256
notes: 自由記述（任意）
```

再配布できない文書は `.yaml` だけを置きます。実行時に本文を `source.url` から git 管理外の `.cache/` に取得し、sha256 が
一致したときだけ使います。一致しなければ、レポートの「Not run」に理由とともに載ります（判定時に Markdown に変換した本文は
そのままでは取得できないので、変換済みの本文を手で `.cache/<id>.md` に置いてください）。

### `expected/<id>.yaml` と判定

```yaml
id: q3-report
chaff: 0.33.0               # このファイルを最初に書いたときの chaffjs の版
findings:
  - rule: orthographic-variant
    line: 26
    text: 但し、権利の行使又は公の職務の執行に妨げ      # 指摘の位置にある本文
    message: 「但し」と書いています（…）
    verdict: correct
  - rule: undefined-term
    line: 12
    text: 本サービス
    verdict: false-positive
    note: 定義は別紙にあり、本文からは見えない
  - rule: numbering-gap
    line: 40
    what: 第4条の次が第6条
    verdict: missed
```

| 判定 | 意味 | 実行結果が変わったとき |
| --- | --- | --- |
| `correct` | 正しい指摘で、出続けるべき | 消えた: **CI が失敗**（後退） |
| `false-positive` | 誤った指摘で、消えるべき | 消えた: 改善として報告。残っている: 残課題として列挙 |
| `missed` | 出るべきなのに出ない指摘（`rule`、`line`、`what`） | その行にそのルールが出た: 見つかったと報告 |
| `unjudged` | まだ誰も判定していない | 「to judge」に列挙 |

ルール・行・位置の本文が同じなら同じ指摘とみなします。`unjudged` が一つもない文書は**全指摘を判定済み**で、そこに新しい
指摘が出ると CI が失敗します（誰かが判定する必要があるため）。

## 手元での実行

Node 24 と Yarn 1 を使います。

```sh
yarn install
yarn validate                 # メタデータ、ライセンス、個人情報、サイズ
yarn typecheck && yarn test
yarn run-corpus               # chaff をかけて expected/ と比べ、レポートを出す
yarn run-corpus --update      # 新しい指摘を unjudged として expected/ に足す（判定には触れない）
yarn run-corpus --chaff ../lab/text   # 固定版の代わりに手元の chaff（`yarn build` 済みの lab）を使う
yarn run-corpus --only q3-report,rouki --jobs 2 --offline
```

固定版の chaffjs は `package.json` に書いた版そのものです。chaff は利用者と同じくコマンドラインで、文書のジャンル
（`--genre`）を指定し、実験的なルールも有効にし、言語は `chaff.yaml` で指定して実行します。

## 文書の追加

[CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) を見てください。要するに、本文と `.yaml` を置き、`yarn validate` と
`yarn run-corpus --update` を実行し、判定できるものを判定して PR を出します。

## ライセンス

このレポジトリのコードは [MIT License](LICENSE) です。各文書はそれぞれのライセンスのままで、`.yaml` に書いてあります。
文書には MIT License は適用されません。
