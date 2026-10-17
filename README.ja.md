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
scripts/                        yarn のコマンドが実行するスクリプト。それらが使う純粋関数は scripts/lib/
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
  format: html              # 任意: source.url が本文そのものでないとき、その形式
license:
  name: CC-BY-4.0
  url: https://creativecommons.org/licenses/by/4.0/   # ライセンスが書かれている場所
  note: 出典: 〇〇省ホームページ（…）を加工して作成     # 帰属表示など、ライセンスが求めること
redistribute: true          # false なら、この .yaml だけを置き、本文は実行時に取得する
sha256: 3f5a…               # chaff が読む本文の sha256
notes: 自由記述（任意）
```

再配布できない文書は `.yaml` だけを置きます。実行時に本文を `source.url` から git 管理外の `.cache/` に取得し、sha256 が
一致したときだけ使います。一致しなければ、レポートの「Not run」に理由とともに載ります。`source.url` が本文そのものでない
ときは、`source.format` に判定した本文を作った変換の名前（isamu/lab と同じ `wikitext`・`html`・`google-patents`・`kokkai`）を
書きます。実行時は取得したものを同じ変換にかけてから sha256 を比べます。

### Hugging Face のデータセットの1件: `source.hf`

本文が Hugging Face のデータセットの1件（1行）のときは、`source.hf` にどの1件かを書きます。`source.url` には読む人が文書を
見る場所（開示書類、データセットのページ）を書きます。`source.hf` と `source.format` は同時に書けません。

```yaml
source:
  url: https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100SXUQ,,
  fetched: 2026-10-15
  hf:
    dataset: numad/yuho-text-2024                         # <owner>/<name>
    config: default
    split: train
    offset: 98                                            # split の行、または file の行（0 から）
    field: text                                           # 本文が入っているフィールド
    revision: 2993206922ead839ce003e2faa65cd5d2ff07607    # 本文を取ったときのデータセットのコミット（40 桁の sha）
    file: yuho-202402.jsonl                               # 任意: revision の時点のデータセットの JSONL ファイル
```

| フィールド | |
| --- | --- |
| `dataset`・`config`・`split` | どのデータセットのどの split か。すべて必須 |
| `offset` | 0 以上の整数。split の中の行。`file` があればそのファイルの行 |
| `field` | 本文にあたるフィールド。`render` があるときは、レンダラーが読むフィールド |
| `revision` | 必須。本文を取ったときのデータセットのコミット sha |
| `file` | 任意。データセット内の `.jsonl` のパス。`https://huggingface.co/datasets/<dataset>/resolve/<revision>/<file>` から読むので、`revision` に固定されます |
| `render` | 任意。`field` をそのまま使わず、1件全体を描画します。レンダラーは `edinet-bench` だけです（SakanaAI/EDINET-Bench の1件を Markdown に: 表題、`field` の各節、続いて主要な経営指標と財務諸表を表で） |
| `omit` | 任意。`render` と一緒にだけ使えます。レンダラーが省く部分（人名が載る節など） |

`file` がないときは datasets-server の rows API
（`https://datasets-server.huggingface.co/rows?dataset=…&config=…&split=…&offset=…&length=1`）から読みます。rows API は
データセットの最新コミットしか返さないので、`revision` は記録されても守られません。データセットに JSONL ファイルがあれば
`file` を書きます。`Content-Length` が 64 MiB を超えるデータファイルは読みません。

取得するのは本文がコミットされていない文書（`redistribute: false`）だけです。実行時か `yarn judge` で取得し、sha256 が
一致したときだけ使います。一致しなければ、その理由が「Not run」に載ります（どのファイルの何行目、または rows API の何行目か。
rows API のときは、`revision` ではなく最新コミットを返したことも書かれます）。本文をコミットしている文書では、`source.hf` は
どこから取ったかの記録です。`yarn validate` がフィールドを確かめ、sha256 はコミットしたファイルの値です。

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

`redistribute: false` の文書では、どの項目も本文を引用しません。`text` の代わりに `sha256:`（指摘の位置にある本文の
sha256）を持ち、`message` は持ちません。`--update` はこの形で書き、実行時は指摘の本文の sha256 で照合し、レポートは
`id:行` とルールだけを出し、`yarn validate` はその文書の expected に `text` や `message` があれば拒否します。判定するときは、
手元の本文に chaff をかけて、その指摘を読んでください。

## 手元での実行

Node 24 と Yarn 1 を使います。

```sh
yarn install
yarn validate                 # メタデータ、ライセンス、個人情報、サイズ
yarn typecheck && yarn test
yarn run-corpus               # chaff をかけて expected/ と比べ、レポートを出す
yarn run-corpus --update      # 新しい指摘を unjudged として expected/ に足す（判定には触れない）
yarn run-corpus --resolve     # --update に加え、実行結果で決まる判定を確定する: 出なくなった false-positive は消し、
                              # 出るようになった missed は correct に（note に「found by chaffjs <version>」を足す）、
                              # 出なくなった correct は残す。resolved / found / regressed の一覧を出す（--resolve-out <file> で保存）
yarn run-corpus --chaff ../lab/text   # 固定版の代わりに手元の chaff（`yarn build` 済みの lab）を使う
yarn run-corpus --only q3-report,rouki --jobs 2 --offline
```

固定版の chaffjs は `package.json` に書いた版そのものです。chaff は利用者と同じくコマンドラインで、文書のジャンル
（`--genre`）を指定し、実験的なルールも有効にし、言語は `chaff.yaml` で指定して実行します。

## chaff のリリースへの追従

`follow-release` ワークフローは毎日（と workflow_dispatch で）動きます。npm の最新 `chaffjs` が固定版より新しく、
ブランチ `chore/chaffjs-<version>` もそこからの PR もまだ無ければ、固定版を上げ（`yarn add chaffjs@<version> --exact`）、
`yarn run-corpus --resolve` を実行して PR を出します。PR 本文には resolved（出なくなった false-positive）、
found（出るようになった missed。correct にした）、regressed（出なくなった correct）の一覧が載ります。

ワークフローのトークンで開いた PR は他のワークフローを起動しないので、`check` はその PR で自動では走りません。
このジョブが上げた版で validate・typecheck・test・コーパス実行を行い、結果を本文に載せます。PR に `check` を付けるには、
メンテナが Actions タブからそのブランチで `check` を実行するか、空コミットを push します。

## 文書の追加

[CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) を見てください。要するに、本文と `.yaml` を置き、`yarn validate` と
`yarn run-corpus --update` を実行し、判定できるものを判定して PR を出します。

chaff が文書を間違えた（誤った指摘を出した、または出すべき指摘を出さなかった）ときは、事例として投稿してください。
手順は [chaff が間違えた文書を投稿する](CONTRIBUTING.ja.md#chaff-が間違えた文書を投稿する) にあります。CI は未解決の事例として
受け入れ、isamu/lab が `corpus-case` ラベルのイシューで追い、それを直した chaff が公開されるとここで解決済みになります。

## ライセンス

このレポジトリのコードは [MIT License](LICENSE) です。各文書はそれぞれのライセンスのままで、`.yaml` に書いてあります。
文書には MIT License は適用されません。
