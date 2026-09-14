# 記者文章彙整站

這是一個「靜態網站 + GitHub Actions 每小時抓取」的新聞彙整器。

## 功能
- 集中顯示你提供的 49 個來源
- 標題、來源、時間、摘要與原文連結
- 關鍵字搜尋、來源篩選、時間排序
- GitHub Actions 每小時自動更新 `articles.json`
- 不複製完整新聞內文，只保留必要的索引資訊並連回原站

## 部署
1. 建立 GitHub repository。
2. 把本資料夾全部檔案上傳。
3. 在 Settings → Pages 啟用 GitHub Pages，來源選 `main` branch / root。
4. GitHub Actions 會每小時執行一次，也可在 Actions 頁面手動執行 `Update news`。
5. 若來源網站阻擋自動抓取，該來源會跳過；可再改成 RSS/API 或針對該站寫專用 parser。

## 注意
各媒體網站的 HTML 結構可能變動，也可能有 robots.txt、WAF 或頻率限制。實際部署時應遵守各網站服務條款、robots 規範與著作權；本專案刻意只做標題/索引彙整，不抓全文。


## 個人新聞儀表板
開啟 `index.html` 即可使用新版儀表板；收藏會保存在瀏覽器 LocalStorage，主題分類為前端規則式分類，可自行擴充。`dashboard.html` 為同一份介面備份。
