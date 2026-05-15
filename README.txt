# GitHub Pages v3 介面整併 AI 軍團

目標網址：
https://kingking12180823-ui.github.io/xunfeng-yixue-system/?v=3

## 要做兩件事

### 1. GitHub Pages 專案
用 `index.html` 覆蓋 GitHub Pages 的根目錄 `index.html`。

### 2. Vercel Next.js 專案
用 `route.ts` 覆蓋：
app/api/council/route.ts

原因：
GitHub Pages 是靜態網站，不能安全存放 API Key，也不能執行後端。
所以前台保留 GitHub Pages URL，AI 軍團由 Vercel 後端 `/api/council` 執行。

## 正式資料流

GitHub Pages v3 UI
→ https://xunfeng-yixue-system.vercel.app/api/council
→ OpenAI + Gemini + DeepSeek
→ ChatGPT 風羿老師總結
→ 回填 GitHub Pages 輸出中心
