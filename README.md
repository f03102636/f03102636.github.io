# 菜菜的學習筆記

用 [Eleventy](https://www.11ty.dev/) 做的部落格，推到 GitHub 後會自動建置、發布到 GitHub Pages。

## 第一次設定（只要做一次）

到 repo 的 **Settings → Pages**，把 **Source** 選成 **GitHub Actions**。之後每次推送都會自動更新網站。

## 新增文章（直接在 GitHub 網頁上）

1. 進入 `posts` 資料夾，按 **Add file → Create new file**
2. 檔名用「日期-英文代稱.md」，例如 `2026-11-03-n1-grammar.md`（英文代稱會變成網址）
3. 把 `templates/新文章範本.md` 的內容貼上，改標題、標籤，開始寫
4. 按 **Commit changes**，大約一分鐘後網站就會更新

Markdown 寫法（表格、程式碼、數學式、提示框）都整理在網站上的〈筆記寫法速查〉。

## 常用欄位

| 欄位 | 用途 |
| --- | --- |
| `title` | 標題 |
| `description` | 首頁列表的摘要，可省略 |
| `tags` | 科目名稱（AI、電子電路、Omniverse、PMP、管理、碳淨零、資料與雲端、英文、日文、論文）或生活分類（旅行、興趣、日常） |
| `cover` | 封面圖路徑，例如 `/assets/img/kyoto.jpg`，可省略 |
| `draft: true` | 草稿，不發布 |
| `updated: 2026-11-15` | 修改日期，會顯示「更新於」 |

標籤不要用 `posts`、`all`、`tagList`，這幾個名字系統已經用掉了。

## 想改網站名稱、自我介紹、大頭照

改 `_data/site.js`。橫幅顏色在 `assets/css/main.css` 的 `--band`。

## 密碼保護

科目頁、生活頁，以及標籤是科目或生活分類的文章，都需要密碼才能看。
密碼放在 repo 的 **Settings → Secrets and variables → Actions**，名稱是 `SITE_PASSWORD`。
要換密碼就改那個 Secret，再到 Actions 重新跑一次部署。

注意：這個 repo 是公開的，`posts` 資料夾裡的 .md 原稿在 GitHub 上任何人都看得到。密碼只保護「網站」上的內容。

## 圖片

上傳到 `assets/img/`，文章裡寫 `![說明](/assets/img/檔名.png)`。

## 在自己電腦上預覽（可選）

```bash
npm install
npm start
```

打開 http://localhost:8080 。
