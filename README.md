# chaff-corpus

Real documents with judged [chaff](https://isamu.github.io/lab/en/) findings, run by CI.
Each document comes with what chaff should and should not report on it; CI runs chaff over all of them and reports
precision and misses per rule and per genre.

実際の文書と、それに対する chaff の指摘の判定（正しい・誤検出・見逃し）を組にして置き、CI で全部を回します。

The layout, the runner and how to contribute a document arrive in the first pull request.
Code in this repository is under the MIT License; each document keeps its own license, named next to it.
