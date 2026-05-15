# 巽風易學決策系統 v3 UI × AI 軍團

本版保留原先 GitHub Pages v3 介面邏輯：
- Premium Consulting System 首頁
- 共同資料
- 出生年月日時下拉式輸入
- 四術專用介面
- 輸出中心：正式報告 / JSON資料包

差異：
- 內容產製改為呼叫 `/api/council`
- OpenAI、Gemini、DeepSeek 僅作為內部攻防校核
- 對外只呈現風羿老師綜合判讀

## Vercel Environment Variables

OPENAI_API_KEY
GEMINI_API_KEY
DEEPSEEK_API_KEY
ENABLE_DEBATE_ROUND=true
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.5-flash
DEEPSEEK_MODEL=deepseek-chat
