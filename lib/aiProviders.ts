\
export type CouncilRole = "openaiFengYi" | "geminiFengYi" | "deepseekAttack" | "finalChatGPT";

export type ModelResult = {
  role: CouncilRole;
  label: string;
  ok: boolean;
  text: string;
  error?: string;
};

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function safeJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export async function callOpenAI(role: CouncilRole, label: string, system: string, prompt: string): Promise<ModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) return { role, label, ok: false, text: "", error: "OPENAI_API_KEY 未設定" };
  const timer = timeoutSignal(60000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
      signal: timer.signal,
    });
    const data = await safeJson(res);
    if (!res.ok) return { role, label, ok: false, text: "", error: data?.error?.message || `OpenAI API 錯誤：${res.status}` };
    return { role, label, ok: true, text: data?.choices?.[0]?.message?.content || "OpenAI 無內容回傳" };
  } catch (error: any) {
    return { role, label, ok: false, text: "", error: error?.name === "AbortError" ? "OpenAI 請求逾時" : error?.message || "OpenAI 請求失敗" };
  } finally { timer.clear(); }
}

export async function callGemini(role: CouncilRole, label: string, system: string, prompt: string): Promise<ModelResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (!apiKey) return { role, label, ok: false, text: "", error: "GEMINI_API_KEY 未設定" };
  const timer = timeoutSignal(60000);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35 },
      }),
      signal: timer.signal,
    });
    const data = await safeJson(res);
    if (!res.ok) return { role, label, ok: false, text: "", error: data?.error?.message || `Gemini API 錯誤：${res.status}` };
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n") || "Gemini 無內容回傳";
    return { role, label, ok: true, text };
  } catch (error: any) {
    return { role, label, ok: false, text: "", error: error?.name === "AbortError" ? "Gemini 請求逾時" : error?.message || "Gemini 請求失敗" };
  } finally { timer.clear(); }
}

export async function callDeepSeek(role: CouncilRole, label: string, system: string, prompt: string): Promise<ModelResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  if (!apiKey) return { role, label, ok: false, text: "", error: "DEEPSEEK_API_KEY 未設定" };
  const timer = timeoutSignal(60000);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
      signal: timer.signal,
    });
    const data = await safeJson(res);
    if (!res.ok) return { role, label, ok: false, text: "", error: data?.error?.message || `DeepSeek API 錯誤：${res.status}` };
    return { role, label, ok: true, text: data?.choices?.[0]?.message?.content || "DeepSeek 無內容回傳" };
  } catch (error: any) {
    return { role, label, ok: false, text: "", error: error?.name === "AbortError" ? "DeepSeek 請求逾時" : error?.message || "DeepSeek 請求失敗" };
  } finally { timer.clear(); }
}

export function stringifyRound(title: string, results: ModelResult[]) {
  return `\n\n## ${title}\n` + results.map((r) => `\n### ${r.label}\n${r.ok ? r.text : `失敗：${r.error}`}`).join("\n");
}
