"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Loader2, RefreshCw } from "lucide-react";

type ApiResult = {
  ok?: boolean;
  error?: string;
  final?: { ok?: boolean; text?: string; error?: string };
  firstRound?: unknown;
  debateRound?: unknown;
};

const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
const eventYears = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 5 + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);
const hourBranches = [
  ["子", "23:00-00:59"],
  ["丑", "01:00-02:59"],
  ["寅", "03:00-04:59"],
  ["卯", "05:00-06:59"],
  ["辰", "07:00-08:59"],
  ["巳", "09:00-10:59"],
  ["午", "11:00-12:59"],
  ["未", "13:00-14:59"],
  ["申", "15:00-16:59"],
  ["酉", "17:00-18:59"],
  ["戌", "19:00-20:59"],
  ["亥", "21:00-22:59"],
  ["不確定", "不知道"],
];
const trigram = ["不確定", "乾", "兌", "離", "震", "巽", "坎", "艮", "坤"];
const yaoOptions = ["不會判斷，請用時間起卦", "少陽", "少陰", "老陽", "老陰"];
const reportTemplates = ["商業決策顧問報告", "標準個人諮詢報告", "企業主管簡報版", "教學展示版"];
const topics = ["事業／工作", "財運／投資", "考試／升學", "感情／人際", "房產／陽宅", "健康／身心"];
const reviewModes = ["啟用策略校核層", "啟用深度反證層", "不啟用"];

function cx(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#10203A]">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, children }: { value: string | number; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-2xl border border-[#d9e3f0] bg-white px-4 text-[15px] text-[#10203A] outline-none transition focus:border-[#10203A] focus:ring-4 focus:ring-[#10203A]/10">
      {children}
    </select>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-[#d9e3f0] bg-white px-4 text-[15px] text-[#10203A] outline-none transition focus:border-[#10203A] focus:ring-4 focus:ring-[#10203A]/10" />
  );
}

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-28 w-full rounded-2xl border border-[#d9e3f0] bg-white px-4 py-3 text-[15px] leading-7 text-[#10203A] outline-none transition focus:border-[#10203A] focus:ring-4 focus:ring-[#10203A]/10" />
  );
}

function CardTitle({ n, title, desc }: { n: string; title: string; desc?: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#10203A] text-xl font-black text-white shadow-lg">{n}</div>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-[#10203A]">{title}</h2>
        {desc && <p className="mt-1 text-sm leading-6 text-[#607089]">{desc}</p>}
      </div>
    </div>
  );
}

function buildLocalSkeleton(form: any, modules: any) {
  const active = [
    modules.bazi ? "八字命理" : "",
    modules.qimen ? "奇門遁甲" : "",
    modules.liuyao ? "卜卦／六爻" : "",
    modules.meihua ? "梅花易數" : "",
  ].filter(Boolean).join("、");

  return `# 巽風易學綜合決策報告

## 一、個案總論
案主：${form.clientName || "未填"}
問題：${form.question || "未填"}
啟用模組：${active || "未指定"}

本報告以原 v3 介面收集的基本資料為核心，先建立四術資料包，再由 AI 軍團進行內部校核，最後輸出風羿老師綜合判讀。

## 二、八字命理
出生資料：${form.calendarType} ${form.birthYear} 年 ${form.birthMonth} 月 ${form.birthDay} 日 ${form.birthHourBranch} 時。
本段需依正式排盤引擎或風羿老師人工校核後，再進一步判斷五行承載、行運節奏與色系建議。

## 三、奇門遁甲
起局方式：${form.qimenTimeMode}
事件方位：${form.direction}
本段重點為部署、時機、先後手、人事攻防與可借勢資源。

## 四、卜卦／六爻
起卦方式：${form.liuyaoMode}
六爻資料：${[form.yao1, form.yao2, form.yao3, form.yao4, form.yao5, form.yao6].join("、")}
本段重點為事件成敗、卡點、應期與條件。

## 五、梅花易數
起卦方式：${form.meihuaMode}
上卦／下卦：${form.upperTrigram}／${form.lowerTrigram}
本段重點為象意、變化、觸發訊號與短期觀察點。

## 六、下一步
若目前使用 GitHub Pages 靜態版，AI 軍團不會啟動；若使用 Vercel 正式版並設定 API Key，會自動呼叫 /api/council 產生完整 AI 校核報告。`;
}

export default function Home() {
  const now = new Date();
  const [form, setForm] = useState({
    clientName: "",
    gender: "男",
    topic: "事業／工作",
    reportTemplate: "商業決策顧問報告",
    question: "",
    context: "",
    calendarType: "國曆",
    birthYear: 1978,
    birthMonth: 9,
    birthDay: 9,
    birthHourBranch: "寅",
    isLeapMonth: "否",
    birthTimeKnown: "是",
    reviewMode: "啟用策略校核層",
    eventYear: now.getFullYear(),
    eventMonth: now.getMonth() + 1,
    eventDay: now.getDate(),
    eventHour: now.getHours(),
    eventMinute: now.getMinutes(),
    baziMode: "依出生資料自動初判",
    qimenTimeMode: "現在起局",
    direction: "不確定",
    liuyaoMode: "時間起卦",
    yao1: "不會判斷，請用時間起卦",
    yao2: "不會判斷，請用時間起卦",
    yao3: "不會判斷，請用時間起卦",
    yao4: "不會判斷，請用時間起卦",
    yao5: "不會判斷，請用時間起卦",
    yao6: "不會判斷，請用時間起卦",
    meihuaMode: "時間起卦",
    upperTrigram: "乾",
    lowerTrigram: "坤",
  });

  const [modules, setModules] = useState({ bazi: true, qimen: true, liuyao: true, meihua: true });
  const [tab, setTab] = useState<"report" | "json">("report");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [jsonPacket, setJsonPacket] = useState<any>(null);
  const [notice, setNotice] = useState("尚未生成報告。");

  function update(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function toggleModule(key: keyof typeof modules) {
    const next = { ...modules, [key]: !modules[key] };
    if (!Object.values(next).some(Boolean)) return;
    setModules(next);
  }

  const aiPayload = useMemo(() => ({
    question: form.question,
    context: form.context,
    topic: form.topic,
    deliverableMode: form.reportTemplate,
    clientProfile: `${form.clientName || "未填"}｜${form.gender}`,
    yixue: {
      clientName: form.clientName,
      gender: form.gender,
      birth: {
        calendar: form.calendarType,
        isLeapMonth: form.isLeapMonth,
        year: form.birthYear,
        month: form.birthMonth,
        day: form.birthDay,
        hourBranch: form.birthHourBranch,
        timeKnown: form.birthTimeKnown,
      },
      eventTime: {
        year: form.eventYear,
        month: form.eventMonth,
        day: form.eventDay,
        hour: form.eventHour,
        minute: form.eventMinute,
      },
      modules,
      qimen: {
        mode: form.qimenTimeMode,
        direction: form.direction,
      },
      liuyao: {
        mode: form.liuyaoMode,
        yao: [form.yao1, form.yao2, form.yao3, form.yao4, form.yao5, form.yao6],
      },
      meihua: {
        mode: form.meihuaMode,
        upperTrigram: form.upperTrigram,
        lowerTrigram: form.lowerTrigram,
      },
    },
    instruction: "保留原 v3 介面。內容產製必須經 AI 軍團內部討論，但最終只呈現為風羿老師綜合判讀。易學決策系統為主體，AI 只做校核與補強。",
  }), [form, modules]);

  async function generate() {
    if (!form.question.trim()) {
      setNotice("請先輸入問題主軸。");
      return;
    }

    setLoading(true);
    setNotice("AI 軍團協力校核中...");
    setReport("");
    setJsonPacket(null);

    const localSkeleton = buildLocalSkeleton(form, modules);

    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
      });

      const data: ApiResult = await res.json();
      const finalText = data?.ok && data?.final?.text
        ? data.final.text
        : `${localSkeleton}\n\n---\n\n## AI 軍團校核狀態\n後端回傳異常：${data?.final?.error || data?.error || "未取得最終報告"}`;

      setReport(finalText);
      setJsonPacket({ request: aiPayload, response: data });
      setNotice("");
      setTab("report");
    } catch (error: any) {
      const fallback = `${localSkeleton}\n\n---\n\n## AI 軍團校核狀態\n目前無法呼叫 /api/council。若正在 GitHub Pages 靜態版測試，這是正常狀況；正式 AI 軍團分析需使用 Vercel 版本並設定 OpenAI、Gemini、DeepSeek API Key。\n\n錯誤：${error?.message || "fetch failed"}`;
      setReport(fallback);
      setJsonPacket({ request: aiPayload, error: error?.message || "fetch failed" });
      setNotice("");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setReport("");
    setJsonPacket(null);
    setNotice("尚未生成報告。");
  }

  const currentContent = tab === "json" ? JSON.stringify(jsonPacket || aiPayload, null, 2) : report || notice;

  async function copy() {
    await navigator.clipboard.writeText(currentContent);
  }

  function download() {
    const blob = new Blob([currentContent], { type: tab === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab === "json" ? "xunfeng-yixue-packet.json" : "xunfeng-yixue-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffffff,#f3f7fb_40%,#dfeaf5)] text-[#10203A]">
      <header className="sticky top-0 z-40 border-b border-[#dbe5f0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#10203A] text-xl text-white shadow-lg">☯</div>
            <div>
              <h1 className="text-xl font-black tracking-tight">巽風易學決策系統</h1>
              <p className="text-xs text-[#66758d]">專業顧問｜四術同步｜策略校核｜商業報告交付</p>
            </div>
          </div>
          <a href="#workbench" className="rounded-2xl bg-[#10203A] px-5 py-3 text-sm font-black text-white shadow-lg">進入工作台</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[2.5rem] border border-white bg-white/90 p-8 shadow-2xl shadow-[#10203A]/10">
          <div className="mb-4 inline-flex rounded-full bg-[#efd9b8] px-4 py-2 text-sm font-black text-[#7d4f12]">Premium Consulting System</div>
          <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">把問事流程，升級成可交付的顧問報告。</h2>
          <p className="mt-5 text-lg leading-9 text-[#607089]">保留原 v3 介面：下拉式出生年月日時、四術各自輸入介面、綜合評判一次生成。內容產製改為經 AI 軍團內部討論後，由風羿老師綜合判讀輸出。</p>
          <a href="#workbench" className="mt-6 inline-flex rounded-2xl bg-[#be955c] px-6 py-4 text-sm font-black text-white shadow-lg">開始建立報告</a>
        </div>

        <div className="rounded-[2.5rem] bg-[#10203A] p-8 text-white shadow-2xl shadow-[#10203A]/20">
          <div className="mb-5 rounded-full bg-[#efd9b8] px-4 py-2 text-sm font-black text-[#7d4f12] w-fit">商業化重點</div>
          <div className="space-y-5 text-lg leading-8">
            <p>✓ 下拉式出生年月日時</p>
            <p>✓ 八字、奇門、六爻、梅花獨立介面</p>
            <p>✓ AI 軍團內部校核，不改前台主體</p>
            <p>✓ 報告與 JSON 可複製下載</p>
          </div>
        </div>
      </section>

      <section id="workbench" className="mx-auto max-w-7xl px-5 pb-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-xl shadow-[#10203A]/10">
              <CardTitle n="1" title="共同資料" />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="案主姓名"><TextInput value={form.clientName} onChange={(v) => update("clientName", v)} placeholder="例如：王先生" /></Field>
                <Field label="性別／身分">
                  <Select value={form.gender} onChange={(v) => update("gender", v)}>
                    {["男", "女", "其他／不指定", "企業主", "考生"].map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="問題類型">
                  <Select value={form.topic} onChange={(v) => update("topic", v)}>
                    {topics.map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="報告模板">
                  <Select value={form.reportTemplate} onChange={(v) => update("reportTemplate", v)}>
                    {reportTemplates.map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
                <div className="md:col-span-2"><Field label="問題主軸"><TextInput value={form.question} onChange={(v) => update("question", v)} placeholder="例如：我今年是否適合投資？" /></Field></div>
                <div className="md:col-span-2"><Field label="背景補充"><TextArea value={form.context} onChange={(v) => update("context", v)} placeholder="補充目前狀況、卡點、時間壓力、相關人物、資金條件。" /></Field></div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-xl shadow-[#10203A]/10">
              <CardTitle n="2" title="出生年月日時｜下拉式輸入" />
              <div className="grid gap-5 md:grid-cols-4">
                <Field label="曆法">
                  <Select value={form.calendarType} onChange={(v) => update("calendarType", v)}>
                    {["國曆", "農曆"].map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="出生年">
                  <Select value={form.birthYear} onChange={(v) => update("birthYear", Number(v))}>
                    {years.map((x) => <option key={x} value={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="出生月">
                  <Select value={form.birthMonth} onChange={(v) => update("birthMonth", Number(v))}>
                    {months.map((x) => <option key={x} value={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="出生日">
                  <Select value={form.birthDay} onChange={(v) => update("birthDay", Number(v))}>
                    {days.map((x) => <option key={x} value={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="出生時辰">
                  <Select value={form.birthHourBranch} onChange={(v) => update("birthHourBranch", v)}>
                    {hourBranches.map((x) => <option key={x[0]} value={x[0]}>{x[0]}｜{x[1]}</option>)}
                  </Select>
                </Field>
                <Field label="是否閏月">
                  <Select value={form.isLeapMonth} onChange={(v) => update("isLeapMonth", v)}>
                    {["否", "是", "不確定"].map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="時辰是否確定">
                  <Select value={form.birthTimeKnown} onChange={(v) => update("birthTimeKnown", v)}>
                    {["是", "否", "不確定"].map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="策略校核層">
                  <Select value={form.reviewMode} onChange={(v) => update("reviewMode", v)}>
                    {reviewModes.map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-xl shadow-[#10203A]/10">
              <CardTitle n="3" title="四術專用介面" desc="保留原 v3 工作台體驗，只把內容產製改為 AI 軍團協力。" />

              <div className="mb-6 grid gap-3 md:grid-cols-4">
                {[
                  ["bazi", "八字命理", "依出生資料自動初判"],
                  ["qimen", "奇門遁甲", "部署／時機／方位"],
                  ["liuyao", "卜卦／六爻", "成敗／卡點／應期"],
                  ["meihua", "梅花易數", "象意／變化／提示"],
                ].map(([key, title, desc]) => (
                  <button key={key} onClick={() => toggleModule(key as keyof typeof modules)} className={cx("rounded-2xl border p-4 text-left transition", (modules as any)[key] ? "border-[#10203A] bg-[#10203A] text-white" : "border-[#d9e3f0] bg-white text-[#10203A]")}>
                    <div className="font-black">{title}</div>
                    <div className={cx("mt-1 text-xs", (modules as any)[key] ? "text-slate-300" : "text-[#607089]")}>{desc}</div>
                  </button>
                ))}
              </div>

              <div className="mb-6 grid gap-5 md:grid-cols-5">
                <Field label="事件年"><Select value={form.eventYear} onChange={(v) => update("eventYear", Number(v))}>{eventYears.map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="事件月"><Select value={form.eventMonth} onChange={(v) => update("eventMonth", Number(v))}>{months.map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="事件日"><Select value={form.eventDay} onChange={(v) => update("eventDay", Number(v))}>{days.map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="事件時"><Select value={form.eventHour} onChange={(v) => update("eventHour", Number(v))}>{hours.map((x) => <option key={x}>{x}</option>)}</Select></Field>
                <Field label="事件分"><Select value={form.eventMinute} onChange={(v) => update("eventMinute", Number(v))}>{minutes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
              </div>

              {modules.bazi && (
                <div className="mb-5 rounded-3xl border border-[#d9e3f0] bg-[#f8fafc] p-5">
                  <Field label="八字命理">
                    <Select value={form.baziMode} onChange={(v) => update("baziMode", v)}>
                      {["依出生資料自動初判", "補充四柱資料", "只看流年趨勢"].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                </div>
              )}

              {modules.qimen && (
                <div className="mb-5 grid gap-5 rounded-3xl border border-[#d9e3f0] bg-[#f8fafc] p-5 md:grid-cols-2">
                  <Field label="奇門遁甲｜起局方式">
                    <Select value={form.qimenTimeMode} onChange={(v) => update("qimenTimeMode", v)}>
                      {["現在起局", "指定時間", "不確定，由系統抓目前時間"].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                  <Field label="奇門遁甲｜事件方位">
                    <Select value={form.direction} onChange={(v) => update("direction", v)}>
                      {trigram.map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                </div>
              )}

              {modules.liuyao && (
                <div className="mb-5 rounded-3xl border border-[#d9e3f0] bg-[#f8fafc] p-5">
                  <div className="grid gap-5 md:grid-cols-3">
                    <Field label="六爻｜起卦方式"><Select value={form.liuyaoMode} onChange={(v) => update("liuyaoMode", v)}>{["時間起卦", "三枚銅錢"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                    {["yao1","yao2","yao3","yao4","yao5","yao6"].map((k, i) => (
                      <Field key={k} label={["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][i]}>
                        <Select value={(form as any)[k]} onChange={(v) => update(k, v)}>
                          {yaoOptions.map((x) => <option key={x}>{x}</option>)}
                        </Select>
                      </Field>
                    ))}
                  </div>
                </div>
              )}

              {modules.meihua && (
                <div className="rounded-3xl border border-[#d9e3f0] bg-[#f8fafc] p-5">
                  <div className="grid gap-5 md:grid-cols-3">
                    <Field label="梅花易數｜起卦方式"><Select value={form.meihuaMode} onChange={(v) => update("meihuaMode", v)}>{["時間起卦", "數字起卦", "上下卦起卦"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                    <Field label="梅花易數｜上卦"><Select value={form.upperTrigram} onChange={(v) => update("upperTrigram", v)}>{["乾", "兌", "離", "震", "巽", "坎", "艮", "坤"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                    <Field label="梅花易數｜下卦"><Select value={form.lowerTrigram} onChange={(v) => update("lowerTrigram", v)}>{["坤", "艮", "坎", "巽", "震", "離", "兌", "乾"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={generate} disabled={loading} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#10203A] px-6 font-black text-white shadow-lg disabled:opacity-60">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  生成綜合報告
                </button>
                <button onClick={resetForm} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#d9e3f0] bg-white px-6 font-black text-[#10203A]">
                  <RefreshCw className="h-4 w-4" /> 重設
                </button>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-xl shadow-[#10203A]/10">
              <CardTitle n="4" title="輸出中心" />
              <div className="mb-4 flex flex-wrap gap-2">
                <button onClick={() => setTab("report")} className={cx("rounded-full px-4 py-2 text-sm font-black", tab === "report" ? "bg-[#10203A] text-white" : "bg-[#eef3fa] text-[#607089]")}>正式報告</button>
                <button onClick={() => setTab("json")} className={cx("rounded-full px-4 py-2 text-sm font-black", tab === "json" ? "bg-[#10203A] text-white" : "bg-[#eef3fa] text-[#607089]")}>JSON資料包</button>
              </div>
              <pre className="min-h-[520px] max-h-[720px] overflow-auto whitespace-pre-wrap rounded-3xl border border-[#d9e3f0] bg-[#f8fafc] p-5 text-sm leading-7 text-[#10203A]">{currentContent}</pre>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={copy} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#10203A] px-5 text-sm font-black text-white"><Copy className="h-4 w-4" /> 複製目前內容</button>
                <button onClick={download} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#d9e3f0] bg-white px-5 text-sm font-black text-[#10203A]"><Download className="h-4 w-4" /> 下載</button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
