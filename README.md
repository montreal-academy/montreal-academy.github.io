# montreal-academy.github.io

モントリオールアカデミー会サイトの Jekyll ソースです。  
この README は、サイト更新担当者向けの運用手順です。

## ディレクトリ構成

- `index.md`  
  トップページ本文。新着情報 (`新 着 情 報`) の更新元です。
- `single-post/`  
  Blog 記事本体。`/single-post/.../` の公開URLになります。
- `pages/`  
  固定ページ（About, COVID-19, Contact など）。
- `_layouts/`, `_includes/`  
  レイアウト・共通部品。
- `assets/`  
  CSS / JavaScript / 画像。
- `_data/`  
  データファイル（例: 記事カード画像マップ）。
- `scripts/`  
  取り込み・整形の補助スクリプト。

## ローカル確認方法

初回のみ:

```bash
bundle install
```

起動:

```bash
bundle exec jekyll serve
```

ブラウザ確認:

- `http://127.0.0.1:4000/`

## 公開までの基本フロー

1. 変更ファイルを編集
2. ローカルで表示確認 (`bundle exec jekyll serve`)
3. コミット
4. `main` に push

```bash
git add <変更ファイル>
git commit -m "更新内容"
git push origin main
```

## Blog記事を追加する（重要）

### 1) 記事ファイルを作る

`single-post/` 配下に新規フォルダを作り、`index.md` を配置します。  
推奨パス例:

- 日付ベース: `single-post/2026/03/01/my-new-article/index.md`
- スラグベース: `single-post/my-new-article/index.md`

### 2) Front Matter を設定する

`layout` は `post` を使ってください（現在の標準）。

```yaml
---
layout: post
title: '記事タイトル'
subtitle: '一覧で使う短い説明文（任意）'
permalink: /single-post/my-new-article/
date: 2026-03-01T09:00:00.000Z
source_url: https://www.montreal-academy.com/single-post/my-new-article
---
```

注意点:

- `permalink` は必ず `/single-post/.../` にする
- `date` は一覧の並び順に影響（新しい日付ほど上）
- `title` は一覧カードにも表示

### 3) 本文を書く（Markdown）

- 見出しは `##` / `###` を使用
- URL単独行より `[表示名](URL)` を推奨
- 先頭画像をカードに使いたい場合は、本文の早い位置に画像を1枚置く

```md
![記事のアイキャッチ](/assets/images/imported/example.jpg)
```

### 4) 一覧カード画像の補足

`/single-post/` のカード画像は、以下の優先順で表示されます。

1. 記事本文の先頭画像
2. `_data/single_post_images.yml` のマッピング画像

本文に画像がない記事でカード画像を指定したい場合は、`_data/single_post_images.yml` に追記します。

```yaml
"/single-post/my-new-article/": https://static.wixstatic.com/media/xxxx.jpg
```

## トップページ「新着情報」を更新する（重要）

トップの新着情報は `index.md` の本文から生成されます。  
`新 着 情 報` のブロック内を編集してください。

### 書き方ルール

- 日付行は必ず次の形式にする  
  `YYYY年M月D日`  
  例: `2026年3月1日`
- 日付の次の行以降に本文を書く（1行でも複数行でも可）
- 次のニュースは、次の日付行から開始

例:

```md
新 着 情 報

2026年3月1日

春の交流会を開催します。日時: 2026年3月20日 19:00〜

2026年2月14日

Aboutページを更新しました。
```

注意:

- 日付形式が崩れると、新着情報として正しく分割されません
- 画像だけの段落はトップ変換時に削除されるため、新着情報用途では使わないでください

## 画像を追加する

1. 画像を `assets/images/imported/` に置く
2. Markdown から参照する

```md
![説明文](/assets/images/imported/your-image.jpg)
```

## 固定ページを追加する

`pages/<slug>/index.md` を作成し、`permalink` を設定します。

```yaml
---
layout: page
title: 'ページタイトル'
permalink: /my-page/
---
```

## よくあるチェックポイント

- URL末尾 `/` を統一しているか
- 内部リンクが `https://www.montreal-academy.com` に飛んでいないか
- `layout` が意図どおりか（記事は `post`、固定ページは `page`）
- 表示崩れがないか（PC/モバイル）
