# 巽風 AI 會議室｜ChatGPT 風羿分身 × Gemini 風羿分身 × DeepSeek 攻防

## 功能

1. 使用者輸入問題。
2. 同時呼叫：
   - ChatGPT／OpenAI 版風羿老師分身
   - Gemini 版風羿老師分身
   - DeepSeek 攻防反證角色
3. 第一輪：三方初判。
4. 第二輪：三方看彼此意見後攻防修正。
5. 最後：固定由 ChatGPT／OpenAI 依「風羿老師總結 Prompt」統整。
6. UI 支援手機版、商業化版面、複製與下載。
7. API Key 使用 `.env.local`，部署 Vercel 時放 Environment Variables。

## 本機啟動

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Vercel 部署

1. 上傳整個專案到 GitHub。
2. Vercel 匯入 GitHub repository。
3. 在 Vercel Project Settings → Environment Variables 填入：
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `DEEPSEEK_API_KEY`
   - `OPENAI_MODEL`
   - `GEMINI_MODEL`
   - `DEEPSEEK_MODEL`
   - `ENABLE_DEBATE_ROUND`
   - 可選：四個 persona prompt 變數
4. Deploy。

## 關鍵設計

ChatGPT 的 GPTs、Gemini Gems 這類 App 內分身，不建議用網址直接丟進平台呼叫。正確工程做法是：把分身的核心指令、知識、語氣規則抽出來，放入 system prompt 或後端資料庫，再透過 OpenAI / Gemini / DeepSeek API 執行。
