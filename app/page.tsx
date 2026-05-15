"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Copy, Download, Loader2, Send, ShieldCheck, Swords } from "lucide-react";

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

const topicOptions = ["事業／工作", "財運／投資", "考試／升學", "感情／人際", "房產／陽宅", "健康／身心", "企業決策", "風水顧問", "其他"];
const modes = ["商業決策顧問報告", "個人諮詢報告", "主管簡報版", "攻防反證版", "成交策略版"];
const genderOptions = ["男", "女", "其他／不指定"];
const calendarOptions = ["國曆", "農曆"];
const yesNoOptions = ["是", "否", "不確定"];
const hourOptions = [
  ["子", "23:00-00:59"], ["丑", "01:00-02:59"], ["寅", "03:00-04:59"], ["卯", "05:00-06:59"],
  ["辰", "07:00-08:59"], ["巳", "09:00-10:59"], ["午", "11:00-12:59"], ["未", "13:00-14:59"],
  ["申", "15:00-16:59"], ["酉", "17:00-18:59"], ["戌", "19:00-20:59"], ["亥", "21:00-22:59"], ["不確定", "不知道出生時辰"],
];
const trigramOptions = ["乾", "兌", "離", "震", "巽", "坎", "艮", "坤", "不確定"];
const qimenTimeOptions = ["現在起局", "指定時間", "不確定，由系統抓目前時間"];
const liuyaoModeOptions = ["時間起卦", "三枚銅錢", "手動輸入卦象"];
const coinOptions = ["少陽", "少陰", "老陽", "老陰", "不會判斷，請用時間起卦"];
const meihuaModeOptions = ["時間起卦", "數字起卦", "上下卦起卦"];
const birthYears = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
const years = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 5 + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);
const numberOptions = Array.from({ length: 99 }, (_, i) => i + 1);

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SelectField({ label, value, onChange, options }: { label: string; value: any; onChange: (v: string) => void; options: any[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#10203A]">
        {options.map((o) => Array.isArray(o)
          ? <option key={o[0]} value={o[0]}>{o[0]}｜{o[1]}</option>
          : <option key={String(o)} value={o}>{String(o)}</option>
        )}
      </select>
    </label>
  );
}

function InputField({ label, value, onChange, placeholder, textarea = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#10203A]" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#10203A]" />
      )}
    </label>
  );
}

function ModuleToggle({ active, title, desc, onClick }: { active: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx("rounded-3xl border p-4 text-left transition", active ? "border-[#10203A] bg-[#10203A] text-white shadow-lg" : "border-slate-200 bg-white hover:bg-slate-50")}>
      <div className="font-black">{title}</div>
      <div className={cx("mt-1 text-xs leading-5", active ? "text-slate-300" : "text-slate-500")}>{desc}</div>
    </button>
  );
}

function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const now = new Date();
  const [form, setForm] = useState({
    clientName: "",
    gender: "男",
    topic: "事業／工作",
    deliverableMode: "商業決策顧問報告",
    question: "",
    context: "",
    calendar: "國曆",
    birthYear: 1978,
    birthMonth: 9,
    birthDay: 9,
    birthHourBranch: "寅",
    birthTimeKnown: "是",
    eventYear: now.getFullYear(),
    eventMonth: now.getMonth() + 1,
    eventDay: now.getDate(),
    eventHour: now.getHours(),
    eventMinute: now.getMinutes(),
    qimenMode: "現在起局",
    direction: "不確定",
    liuyaoMode: "時間起卦",
    yao1: "不會判斷，請用時間起卦",
    yao2: "不會判斷，請用時間起卦",
    yao3: "不會判斷，請用時間起卦",
    yao4: "不會判斷，請用時間起卦",
    yao5: "不會判斷，請用時間起卦",
    yao6: "不會判斷，請用時間起卦",
    meihuaMode: "時間起卦",
    upperNumber: 1,
    lowerNumber: 2,
    movingNumber: 3,
    upperTrigram: "乾",
    lowerTrigram: "坤",
  });
  const [modules, setModules] = useState({ bazi: true, qimen: true, liuyao: true, meihua: true });
  const [activeTab, setActiveTab] = useState("report");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CouncilResponse | null>(null);
  const [error, setError] = useState("");

  const packet = useMemo(() => ({
    question: form.question,
    context: form.context,
    topic: form.topic,
    deliverableMode: form.deliverableMode,
    clientProfile: `${form.clientName || "未填"}｜${form.gender}`,
    yixue: {
      clientName: form.clientName,
      gender: form.gender,
      birth: {
        calendar: form.calendar,
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
        mode: form.qimenMode,
        direction: form.direction,
      },
      liuyao: {
        mode: form.liuyaoMode,
        yao: [form.yao1, form.yao2, form.yao3, form.yao4, form.yao5, form.yao6],
      },
      meihua: {
        mode: form.meihuaMode,
        upperNumber: form.upperNumber,
        lowerNumber: form.lowerNumber,
        movingNumber: form.movingNumber,
        upperTrigram: form.upperTrigram,
        lowerTrigram: form.lowerTrigram,
      },
    },
  }), [form, modules]);

  function update(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function toggleModule(key: keyof typeof modules) {
    const next = { ...modules, [key]: !modules[key] };
    if (!Object.values(next).some(Boolean)) return;
    setModules(next);
  }

  async function submit() {
    setError("");
    setResponse(null);
    if (!form.question.trim()) {
      setError("請先輸入使用者問題。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packet),
      });
      const data = await res.json();
      setResponse(data);
      if (!data.ok) setError(data.error || "分析失敗，請檢查 API Key、模型名稱或額度。");
    } catch (err: any) {
      setError(err?.message || "無法呼叫後端 API。");
    } finally {
      setLoading(false);
    }
  }

  const finalText = response?.final?.text || "";
  const jsonText = JSON.stringify({ request: packet, response }, null, 2);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff,#eef3fa_42%,#dce6f3)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#10203A] text-xl text-white shadow-lg">☯</div>
            <div>
              <div className="text-lg font-black text-[#10203A]">巽風易學決策系統</div>
              <div className="text-xs text-slate-500">八字 × 奇門 × 卜卦／六爻 × 梅花易數｜AI 軍團內部校核</div>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-800">Yixue First · AI Council Inside</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-white/80 bg-white/90 p-8 shadow-xl shadow-slate-900/5">
            <div className="mb-4 inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">易學決策為主體</div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#10203A] md:text-5xl">客戶資料先進四術系統，AI 軍團只做內部攻防與總結補強。</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              這版不是一般 AI 會議室。主流程改為：客戶基本資料 → 八字、奇門、卜卦／六爻、梅花易數 → 三方 AI 內部校核 → 風羿老師最終定稿。
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#10203A] text-white">1</div>
              <div>
                <h2 className="text-xl font-black text-[#10203A]">共同資料</h2>
                <p className="text-sm text-slate-500">先收案主資料與問題，不讓客戶自己貼盤。</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <InputField label="案主姓名" value={form.clientName} onChange={(v) => update("clientName", v)} placeholder="例如：王先生" />
              <SelectField label="性別／身分" value={form.gender} onChange={(v) => update("gender", v)} options={genderOptions} />
              <SelectField label="問題類型" value={form.topic} onChange={(v) => update("topic", v)} options={topicOptions} />
              <SelectField label="交付模式" value={form.deliverableMode} onChange={(v) => update("deliverableMode", v)} options={modes} />
              <div className="md:col-span-2">
                <InputField label="使用者問題" value={form.question} onChange={(v) => update("question", v)} placeholder="例如：我今年是否適合投資／創業／考試？" />
              </div>
              <div className="md:col-span-2">
                <InputField label="背景補充" value={form.context} onChange={(v) => update("context", v)} placeholder="目前卡住的地方、已經做的事、關係人、時間壓力、資金狀況等。" textarea />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#10203A] text-white">2</div>
              <div>
                <h2 className="text-xl font-black text-[#10203A]">八字命理輸入</h2>
                <p className="text-sm text-slate-500">出生年月日時全面下拉，後續可接正式四柱排盤引擎。</p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              <SelectField label="曆法" value={form.calendar} onChange={(v) => update("calendar", v)} options={calendarOptions} />
              <SelectField label="出生年" value={form.birthYear} onChange={(v) => update("birthYear", Number(v))} options={birthYears} />
              <SelectField label="出生月" value={form.birthMonth} onChange={(v) => update("birthMonth", Number(v))} options={months} />
              <SelectField label="出生日" value={form.birthDay} onChange={(v) => update("birthDay", Number(v))} options={days} />
              <SelectField label="出生時辰" value={form.birthHourBranch} onChange={(v) => update("birthHourBranch", v)} options={hourOptions} />
              <SelectField label="時辰是否確定" value={form.birthTimeKnown} onChange={(v) => update("birthTimeKnown", v)} options={yesNoOptions} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#10203A] text-white">3</div>
              <div>
                <h2 className="text-xl font-black text-[#10203A]">事件時間與四術專用介面</h2>
                <p className="text-sm text-slate-500">同一份資料可綜合判讀，也可單獨啟用某個術數。</p>
              </div>
            </div>
            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <ModuleToggle active={modules.bazi} title="八字命理" desc="承載、節奏、色系" onClick={() => toggleModule("bazi")} />
              <ModuleToggle active={modules.qimen} title="奇門遁甲" desc="部署、方位、時機" onClick={() => toggleModule("qimen")} />
              <ModuleToggle active={modules.liuyao} title="卜卦／六爻" desc="成敗、卡點、應期" onClick={() => toggleModule("liuyao")} />
              <ModuleToggle active={modules.meihua} title="梅花易數" desc="象意、變化、提示" onClick={() => toggleModule("meihua")} />
            </div>
            <div className="mb-5 grid gap-5 md:grid-cols-5">
              <SelectField label="事件年" value={form.eventYear} onChange={(v) => update("eventYear", Number(v))} options={years} />
              <SelectField label="事件月" value={form.eventMonth} onChange={(v) => update("eventMonth", Number(v))} options={months} />
              <SelectField label="事件日" value={form.eventDay} onChange={(v) => update("eventDay", Number(v))} options={days} />
              <SelectField label="事件時" value={form.eventHour} onChange={(v) => update("eventHour", Number(v))} options={hours} />
              <SelectField label="事件分" value={form.eventMinute} onChange={(v) => update("eventMinute", Number(v))} options={minutes} />
            </div>

            {modules.qimen && (
              <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-4 font-black">奇門遁甲</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField label="起局方式" value={form.qimenMode} onChange={(v) => update("qimenMode", v)} options={qimenTimeOptions} />
                  <SelectField label="事件／對方方位" value={form.direction} onChange={(v) => update("direction", v)} options={trigramOptions} />
                </div>
              </div>
            )}

            {modules.liuyao && (
              <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-4 font-black">卜卦／六爻</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField label="起卦方式" value={form.liuyaoMode} onChange={(v) => update("liuyaoMode", v)} options={liuyaoModeOptions} />
                  {["yao1","yao2","yao3","yao4","yao5","yao6"].map((k, i) => (
                    <SelectField key={k} label={`${i + 1}爻${i === 0 ? "｜初爻" : i === 5 ? "｜上爻" : ""}`} value={(form as any)[k]} onChange={(v) => update(k, v)} options={coinOptions} />
                  ))}
                </div>
              </div>
            )}

            {modules.meihua && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-4 font-black">梅花易數</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField label="起卦方式" value={form.meihuaMode} onChange={(v) => update("meihuaMode", v)} options={meihuaModeOptions} />
                  <SelectField label="上數" value={form.upperNumber} onChange={(v) => update("upperNumber", Number(v))} options={numberOptions} />
                  <SelectField label="下數" value={form.lowerNumber} onChange={(v) => update("lowerNumber", Number(v))} options={numberOptions} />
                  <SelectField label="動數" value={form.movingNumber} onChange={(v) => update("movingNumber", Number(v))} options={numberOptions} />
                  <SelectField label="上卦" value={form.upperTrigram} onChange={(v) => update("upperTrigram", v)} options={trigramOptions} />
                  <SelectField label="下卦" value={form.lowerTrigram} onChange={(v) => update("lowerTrigram", v)} options={trigramOptions} />
                </div>
              </div>
            )}
          </div>

          <button onClick={submit} disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#10203A] px-5 font-black text-white shadow-xl transition hover:bg-[#18345F] disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {loading ? "四術分析與 AI 校核中..." : "生成巽風易學綜合決策報告"}
          </button>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] bg-[#10203A] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-amber-200" />
              <h2 className="text-xl font-black">主從架構</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-200">
              <p>主體：巽風易學決策系統。</p>
              <p>分析骨架：八字、奇門、卜卦／六爻、梅花易數。</p>
              <p>AI 軍團：內部攻防、校核、補強。</p>
              <p>對外定稿：風羿老師綜合判讀。</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                ["report", "最終報告"],
                ["audit", "內部攻防"],
                ["json", "JSON"],
              ].map(([k, label]) => (
                <button key={k} onClick={() => setActiveTab(k)} className={cx("rounded-full px-4 py-2 text-sm font-bold", activeTab === k ? "bg-[#10203A] text-white" : "bg-slate-100 text-slate-600")}>{label}</button>
              ))}
            </div>

            {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

            {!response && !loading && (
              <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500">
                <div>
                  <Bot className="mx-auto mb-3 h-10 w-10" />
                  <p className="font-bold">尚未生成報告</p>
                  <p className="mt-2 text-sm">填完左側資料後，按下生成。</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="grid min-h-80 place-items-center rounded-3xl bg-slate-50 text-center text-slate-600">
                <div>
                  <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin" />
                  <p className="font-bold">AI 軍團正在協力校核四術資料...</p>
                </div>
              </div>
            )}

            {response && (
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button onClick={() => navigator.clipboard.writeText(activeTab === "json" ? jsonText : activeTab === "audit" ? JSON.stringify({ firstRound: response.firstRound, debateRound: response.debateRound }, null, 2) : finalText)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                    <Copy className="h-4 w-4" /> 複製
                  </button>
                  <button onClick={() => downloadText(activeTab === "json" ? "xunfeng-yixue-ai-payload.json" : "xunfeng-yixue-report.md", activeTab === "json" ? jsonText : finalText, activeTab === "json" ? "application/json" : "text/markdown")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                    <Download className="h-4 w-4" /> 下載
                  </button>
                </div>

                {activeTab === "report" && (
                  <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-800">{finalText || response.error || "尚無最終報告。"}</pre>
                )}

                {activeTab === "audit" && (
                  <div className="max-h-[680px] overflow-auto rounded-3xl bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2 font-black text-[#10203A]"><Swords className="h-5 w-5" /> 內部攻防紀錄</div>
                    <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-700">{JSON.stringify({ firstRound: response.firstRound, debateRound: response.debateRound }, null, 2)}</pre>
                  </div>
                )}

                {activeTab === "json" && (
                  <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-xs leading-6 text-slate-800">{jsonText}</pre>
                )}
              </div>
            )}
          </div>
        </aside>
      </section>

      <footer className="mx-auto max-w-7xl px-5 pb-10 text-center text-xs text-slate-500">
        本系統為易學決策輔助；涉及陽宅、陰宅、法律、醫療、財務或重大投資，仍需由專業人員與風羿老師本人現場評估。
      </footer>
    </main>
  );
}
