# 巽風品牌安全版 v3 升級

修正重點：
1. 前台移除「AI軍團」字眼。
2. 改稱「風羿老師多重分身校核」或「巽風多維校核系統」。
3. route.ts 加入品質門檻，要求報告不可空泛。
4. 報告必須具體輸出：結論、資料完整度、四術判讀、交叉驗證、3/7/30日行動、停損條件。
5. 對外正式報告不得出現 OpenAI、Gemini、DeepSeek、AI軍團、模型、API、後端等字眼。

使用方式：
- GitHub Pages repo：用 index.html 覆蓋根目錄 index.html。
- Vercel Next.js repo：用 route.ts 覆蓋 app/api/council/route.ts。
