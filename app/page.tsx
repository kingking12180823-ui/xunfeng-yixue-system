\
"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Copy, Download, Loader2, MessageSquare, Send, ShieldCheck, Swords } from "lucide-react";

type ModelResult = {
  role: string;
  label: string;
  ok: boolean;
  text: string;
  error?: string;
};

type CouncilResponse = {
  ok: boolean;
  error?: string;
  firstRound?: ModelResult[];
  debateRound?: ModelResult[];
  final?: {
    ok: boolean;
    label: string;
    text: string;
    error?: string;
  };
  generatedAt?: string;
};

const topics = ["事業／工作", "財運／投資", "考試／升學", "感情／人際", "房產／陽宅", "健康／身心", "企業決策", "風水顧問", "其他"];
const modes = ["商業決策顧問報告", "個人諮詢報告", "主管簡報版", "攻防反證版", "成交策略版"];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ResultCard({ result }: { result: ModelResult }) {
  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-premium">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-xf-navy text-white">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-black text-xf-navy">{result.label}</h3>
            <p className="text-xs text-slate-500">內部會議角色</p>
          </div>
        </div>
        {result.ok ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} /> 成功
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <AlertTriangle size={14} /> 異常
          </span>
        )}
      </div>
      <div className="max-h-80 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        {result.ok ? result.text : `失敗：${result.error}`}
      </div>
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [clientProfile, setClientProfile] = useState("");
  const [topic, setTopic] = useState("事業／工作");
  const [deliverableMode, setDeliverableMode] = useState("商業決策顧問報告");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CouncilResponse | null>(null);
  const [tab, setTab] = useState<"final" | "debate" | "json">("final");
  const [copied, setCopied] = useState(false);

  const rawJson = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const canSubmit = question.trim().length >= 2 && !loading;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setData(null);
    setTab("final");

    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context, clientProfile, topic, deliverableMode }),
      });
      const json = (await res.json()) as CouncilResponse;
      setData(json);
    } catch (error: any) {
      setData({ ok: false, error: error?.message || "前端請求失敗" });
    } finally {
      setLoading(false);
    }
  }

  const currentText =
    tab === "final"
      ? data?.final?.text || ""
      : tab === "json"
        ? rawJson
        : [
            "# 第一輪初判",
            ...(data?.firstRound || []).map((r) => `## ${r.label}\n${r.ok ? r.text : r.error}`),
            "# 第二輪攻防",
            ...(data?.debateRound || []).map((r) => `## ${r.label}\n${r.ok ? r.text : r.error}`),
          ].join("\n\n");

  async function copyCurrent() {
    await navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function downloadCurrent() {
    const blob = new Blob([currentText], { type: tab === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab === "json" ? "xunfeng-council-result.json" : tab === "final" ? "fengyi-final-report.md" : "ai-council-debate.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-xf-navy text-xl text-white shadow-lg">☯</div>
            <div>
              <h1 className="text-base font-black text-xf-navy sm:text-xl">巽風 AI 會議室</h1>
              <p className="hidden text-xs text-slate-500 sm:block">ChatGPT 風羿分身 × Gemini 風羿分身 × DeepSeek 攻防 → ChatGPT 最終統整</p>
            </div>
          </div>
          <div className="hidden rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-800 sm:block">Vercel Ready</div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-10">
        <div className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-premium sm:p-8 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-800">
            <Swords size={14} /> AI 攻防決策會議
          </div>

          <h2 className="text-3xl font-black leading-tight tracking-tight text-xf-navy sm:text-5xl">
            讓三支 AI 先攻防，最後由風羿老師定案。
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            平台會先啟動 ChatGPT 風羿分身、Gemini 風羿分身、DeepSeek 攻防反證。三方交換意見後，再由 ChatGPT 依「風羿老師總結 Prompt」輸出最終報告。
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-xf-navy">問題類型</span>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-xf-navy">
                {topics.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-xf-navy">交付模式</span>
              <select value={deliverableMode} onChange={(e) => setDeliverableMode(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-xf-navy">
                {modes.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-xf-navy">使用者問題</span>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例如：這個合作案是否要推進？我要怎麼包裝風羿老師品牌收費？" className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-xf-navy" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-xf-navy">背景補充</span>
              <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="目前卡點、已做行動、時間壓力、相關人物、資源限制。" className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-xf-navy" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-xf-navy">案主身份／條件</span>
              <input value={clientProfile} onChange={(e) => setClientProfile(e.target.value)} placeholder="例如：企業主、博士生、投資人、諮詢個案。" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-xf-navy" />
            </label>

            <button onClick={submit} disabled={!canSubmit} className={cx("flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white shadow-lg transition", canSubmit ? "bg-xf-navy hover:bg-xf-navy2" : "bg-slate-300")}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {loading ? "AI 會議攻防中..." : "啟動 AI 會議室"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] bg-xf-navy p-5 text-white shadow-premium sm:p-8">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                <ShieldCheck />
              </div>
              <div>
                <h3 className="text-2xl font-black">最終主體：風羿老師</h3>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  三支 AI 只做內部攻防。對外報告由 ChatGPT 依風羿老師總結 Prompt 統整，不讓客戶覺得只是直接問一般 AI。
                </p>
              </div>
            </div>
          </div>

          {data?.error && <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">{data.error}</div>}

          <div className="rounded-[2rem] border border-white/80 bg-white/85 p-4 shadow-premium sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[["final", "風羿最終報告"], ["debate", "攻防會議"], ["json", "JSON"]].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key as any)} className={cx("rounded-full px-4 py-2 text-sm font-black transition", tab === key ? "bg-xf-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={copyCurrent} disabled={!data} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">
                  <Copy size={15} /> {copied ? "已複製" : "複製"}
                </button>
                <button onClick={downloadCurrent} disabled={!data} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">
                  <Download size={15} /> 下載
                </button>
              </div>
            </div>

            {tab === "final" && (
              <div className="min-h-[420px] rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 sm:p-6">
                {loading ? (
                  <div className="flex min-h-[330px] flex-col items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="animate-spin" />
                    <p className="text-sm font-bold">AI 會議進行中：初判、攻防、風羿老師總結...</p>
                  </div>
                ) : data?.final?.text ? (
                  <article className="prose-report text-sm leading-8 text-slate-800 sm:text-base">{data.final.text}</article>
                ) : (
                  <div className="flex min-h-[330px] items-center justify-center text-center text-sm font-bold text-slate-400">
                    尚未產生風羿老師最終報告。
                  </div>
                )}
              </div>
            )}

            {tab === "debate" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-black text-xf-navy"><MessageSquare size={20} /> 第一輪初判</h3>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {(data?.firstRound || []).map((r, idx) => <ResultCard key={`${r.label}-${idx}`} result={r} />)}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-black text-xf-navy"><Swords size={20} /> 第二輪攻防</h3>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {(data?.debateRound || []).length ? (data?.debateRound || []).map((r, idx) => <ResultCard key={`${r.label}-${idx}`} result={r} />) : <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">尚未產生攻防結果。</div>}
                  </div>
                </div>
              </div>
            )}

            {tab === "json" && <pre className="max-h-[650px] overflow-auto rounded-[1.5rem] border border-slate-100 bg-slate-950 p-5 text-xs leading-6 text-slate-100">{data ? rawJson : "尚未產生 JSON。"}</pre>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[["分身可替換", "把你的 GPT / Gemini 分身核心規則貼到環境變數。"], ["攻防可控", "ENABLE_DEBATE_ROUND 可開關第二輪討論。"], ["API Key 安全", "所有 Key 放 .env.local / Vercel 後端環境變數。"]].map(([title, desc]) => (
              <div key={title} className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-lg shadow-slate-900/5">
                <h4 className="font-black text-xf-navy">{title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
