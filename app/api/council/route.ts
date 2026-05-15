import { NextRequest, NextResponse } from "next/server";
import {
  debatePrompt,
  fengYiFinalSystem,
  finalSummaryPrompt,
  firstRoundPrompt,
  geminiFengYiSystem,
  openaiFengYiSystem,
  deepseekAttackSystem,
  CouncilInput,
} from "@/lib/personas";
import {
  callDeepSeek,
  callGemini,
  callOpenAI,
  stringifyRound,
} from "@/lib/aiProviders";

export const runtime = "nodejs";
export const maxDuration = 120;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://kingking12180823-ui.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function cleanReportText(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/---+/g, "")
    .replace(/OpenAI/gi, "巽風主判讀分身")
    .replace(/Gemini/gi, "巽風策略推演分身")
    .replace(/DeepSeek/gi, "巽風攻防反證分身")
    .replace(/AI\s*軍團/g, "風羿老師多重分身校核")
    .replace(/API\s*Key/gi, "系統金鑰")
    .replace(/API/gi, "系統介面")
    .replace(/後端/g, "後台")
    .replace(/quota/gi, "系統額度狀態")
    .replace(/billing/gi, "系統帳務狀態")
    .replace(/access denied/gi, "系統權限狀態")
    .replace(/denied access/gi, "系統權限狀態")
    .replace(/timeout/gi, "系統回應逾時")
    .replace(/error/gi, "系統狀態")
    .replace(/Error/g, "系統狀態")
    .trim();
}

function jsonResponse(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function buildQualityGate(input: CouncilInput) {
  return `
品質門檻，必須遵守：

一、品牌規則
1. 對外正式報告不得出現：OpenAI、Gemini、DeepSeek、AI軍團、模型、API、後端、quota、billing、access denied、timeout、error 等技術字眼。
2. 對外統一稱為：「風羿老師多重分身校核」或「巽風多維校核系統」。
3. 報告要像顧問交付文件，不要像一般聊天回答。
4. 若分身校核未完整完成，正式報告只能說「資料仍需補強」或「校核未達交付標準」，不得揭露技術錯誤。

二、格式規則
1. 不准使用 Markdown 粗體符號，例如：**、*、###、---。
2. 標題只用中文序號，例如：「一、個案總論」。
3. 不准輸出星號項目符號。
4. 條列請使用「1.」「2.」「3.」。
5. 每一段都要清楚、可讀、可交付。

三、內容規則
1. 不得寫空話，例如：低風險推進、調整作息、注意文件，除非明確說明怎麼做、何時做、做到什麼標準。
2. 每一術都必須有自己的獨立論述，不可只寫綜合結論。
3. 每一術至少要包含：資料輸入、推理過程、初步判斷、風險點、可行策略、本術數小結。
4. 如果資料不足，要說明哪些資料不足、造成哪個判斷降權、要補什麼資料。
5. ${input.topic || "本案"}必須輸出具體決策語句：可進、可試行、暫緩、不可進、或需補資料後再判。
6. 行動方案必須分成：3日內、7日內、30日內。
7. 投資、財務、法律、醫療相關內容必須提醒風險，不可保證獲利或結果。
8. 結論要明確，但不得神化或保證結果。
`;
}

function buildFinalFormatPrompt() {
  return `
最終定稿要求：

一、格式規則
1. 不准使用 Markdown 粗體符號，例如 **、*、###、---。
2. 標題只用中文序號，例如：「一、個案總論」。
3. 不准輸出星號項目符號。
4. 條列請使用「1.」「2.」「3.」。
5. 對外報告不得出現 OpenAI、Gemini、DeepSeek、AI軍團、模型、API、後端、quota、billing、access denied、timeout、error 等技術字眼。
6. 統一使用「風羿老師多重分身校核」或「巽風多維校核系統」。

二、內容規則
本報告不是摘要，必須寫出四術各自的分析過程。每一項術數都必須依照以下結構輸出：

1. 資料輸入
說明本術數採用哪些資料，例如出生年月日時、事件時間、起局方式、卦象、上下卦、方位、問題類型。

2. 推理過程
逐步說明本術數如何判斷，不可只寫結論。要說明哪個資訊代表機會、哪個資訊代表阻力、哪個資訊代表不確定。

3. 初步判斷
給出本術數自己的獨立判斷，不能直接跳到綜合結論。

4. 風險點
列出本術數看到的主要風險。

5. 可行策略
提出可執行建議，不可寫空話。

6. 本術數小結
用一句話收束本術數的判斷。

三、正式報告格式

巽風易學綜合決策報告

一、個案總論
1. 最終決策建議：可進、可試行、暫緩、不建議、或補資料後再判。
2. 最大機會。
3. 最大風險。
4. 本案建議採取的操作節奏。

二、四術資料完整度檢核
請用純文字表格呈現：
術數｜已取得資料｜不足資料｜可判斷程度｜降權原因
八字命理｜
奇門遁甲｜
卜卦／六爻｜
梅花易數｜

三、八字命理獨立判讀
1. 資料輸入
2. 推理過程
3. 初步判斷
4. 風險點
5. 可行策略
6. 八字小結

四、奇門遁甲獨立判讀
1. 資料輸入
2. 推理過程
3. 初步判斷
4. 風險點
5. 可行策略
6. 奇門小結

五、卜卦／六爻獨立判讀
1. 資料輸入
2. 推理過程
3. 初步判斷
4. 風險點
5. 可行策略
6. 卜卦／六爻小結

六、梅花易數獨立判讀
1. 資料輸入
2. 推理過程
3. 初步判斷
4. 風險點
5. 可行策略
6. 梅花易數小結

七、四術交叉驗證
1. 同向訊號
說明哪幾個術數的判斷方向一致。

2. 矛盾訊號
說明哪幾個術數出現不同判斷，以及原因。

3. 權重排序
請列出本案採用的判斷權重，例如：奇門 35%、八字 30%、六爻 20%、梅花 15%。

4. 綜合判斷
說明為什麼最後採用這個結論。

八、行動方案
1. 3日內
動作：
檢核標準：
停損條件：

2. 7日內
動作：
檢核標準：
停損條件：

3. 30日內
動作：
檢核標準：
停損條件：

九、最終建議
請用五句話內做決策收束，必須具體，不可空泛。

十、專業聲明
本報告為易學決策輔助；涉及陽宅、陰宅、重大投資、法律、醫療或不可逆決策，仍需由風羿老師本人進一步確認或親至現場評估。
`;
}

function buildSafeFallbackReport(input: CouncilInput) {
  const anyInput = input as any;
  const yixue = anyInput?.yixue || {};

  const clientName = yixue?.clientName || input?.clientProfile || "未填";
  const question = input?.question || "未填";
  const topic = input?.topic || "未指定";

  const birth = yixue?.birth;
  const eventTime = yixue?.eventTime;

  const baziFocus = yixue?.bazi?.focus || "未指定";
  const qimenMode = yixue?.qimen?.mode || "未指定";
  const direction = yixue?.qimen?.direction || "不確定";
  const liuyaoMode = yixue?.liuyao?.mode || "未指定";

  const liuyaoYao = Array.isArray(yixue?.liuyao?.yao)
    ? yixue.liuyao.yao.join("、")
    : "未提供";

  const meihuaMode = yixue?.meihua?.mode || "未指定";
  const upperGua = yixue?.meihua?.upperTrigram || "未提供";
  const lowerGua = yixue?.meihua?.lowerTrigram || "未提供";

  const birthText = birth
    ? `${birth.calendar || "曆法未填"} ${birth.year || "年未填"}年${birth.month || "月未填"}月${birth.day || "日未填"}日 ${birth.hourBranch || "時辰未填"}時`
    : "未提供";

  const eventText = eventTime
    ? `${eventTime.year || "年未填"}年${eventTime.month || "月未填"}月${eventTime.day || "日未填"}日 ${eventTime.hour || "時未填"}時${eventTime.minute || "分未填"}分`
    : "未提供";

  return `巽風易學綜合決策報告

一、個案總論
1. 案主：${clientName}。
2. 問題主軸：${question}。
3. 問題類型：${topic}。
4. 最終決策建議：補資料後再判，現階段不建議直接做不可逆決策。
5. 最大機會：本案已具備初步問事資料，可先建立風險盤點、四術補件與短期觀察架構。
6. 最大風險：目前部分術數資料尚未完整，若直接下定論，容易把象意提示誤當成最後決策。
7. 操作節奏：暫緩擴大投入，先補齊資料，再由風羿老師進行正式覆核。

二、四術資料完整度檢核
術數｜已取得資料｜不足資料｜可判斷程度｜降權原因
八字命理｜出生資料：${birthText}；分析重點：${baziFocus}｜仍需確認完整四柱、大運、流年、問題標的屬性｜中｜未完成命局與大運交叉比對
奇門遁甲｜問事時間：${eventText}；起局方式：${qimenMode}；方位：${direction}｜仍需確認用神、事件方、資金方、對手方或標的方｜中低｜方位與用神資料不足
卜卦／六爻｜起卦方式：${liuyaoMode}；六爻資料：${liuyaoYao}｜仍需確認世應、用神、動爻、變卦｜低｜若未親自起卦，判斷效力需降權
梅花易數｜起卦方式：${meihuaMode}；上卦：${upperGua}；下卦：${lowerGua}｜仍需確認動爻、互卦、變卦、體用生剋｜中低｜缺動爻時不能直接定後勢

三、八字命理獨立判讀
1. 資料輸入
本段採用案主出生資料、問題類型與八字分析重點作為初步判讀依據。若問題涉及投資、事業或重大決策，八字必須檢查日主承載力、財星狀態、食傷生財能力、比劫奪財風險，以及當前大運與流年是否支持資源擴張。

2. 推理過程
八字判斷不能只看有沒有財運，而要分成三層。第一層是命局本身能否承擔壓力，若日主承載力不足，遇到財星反而可能形成財多壓身。第二層是大運是否支持擴張，若大運不配合，即使短期有機會，也容易出現資金卡住、決策失準或人事牽制。第三層是流年是否引動財星、官殺、比劫或刑沖，若比劫或沖刑過重，容易出現競爭、破財、合約爭議或情緒化加碼。

3. 初步判斷
目前八字部分可以作為承載力評估，但不宜直接作為最終決策。若本案已經投入資金或資源，應優先檢查能否守住本金與現有資源，而不是急著擴張。

4. 風險點
最大風險是把短期機會誤判為長期財運，或把外部消息誤判為命局支持。若命局與大運不配合，容易出現前期看似順利，後期卻因資金壓力、人事壓力或合約條件而被迫調整。

5. 可行策略
先補齊完整四柱、大運與流年資料，再把本案分成短期、中期、長期三種策略。未完成命盤複核前，不建議一次投入重大資源。若已投入，應設定明確停損點與退出條件。

6. 八字小結
八字目前支持「先評估承載力，再談擴張」，不可只用單一句財運好壞作判斷。

四、奇門遁甲獨立判讀
1. 資料輸入
本段採用問事時間、起局方式、事件方位與問題類型作為奇門初判資料。奇門用於判斷當下時空局勢、可借勢方向、阻力來源與行動窗口。

2. 推理過程
奇門判斷需看生門、開門、休門、戊、時干、值符、年命與事件用神。若問題為投資，生門代表財利，戊代表資金，開門代表通道與市場，時干代表事件狀態。若生門受制、戊落凶宮、時干受克，通常代表資金流動受阻或事件推進不穩。若用神得門、得星、得神，且與求測人相生，才可考慮試行。

3. 初步判斷
目前奇門資料可做局勢初判，但因事件方位與用神資料仍不完整，不宜直接判定全力推進。若本案涉及投資或重大承諾，應先採取控局策略。

4. 風險點
最大風險是只看單一吉門，不看宮位、星、門、神、儀與用神互動。若只看到生門或開門就判斷可行，容易忽略資金受制、對手牽制或時間不對的問題。

5. 可行策略
先補事件方位、資金狀態、標的性質與決策期限。接著以奇門找出三個時間點：觀察點、推進點、停損點。若用神受制，應先觀望或小量試行，不宜直接加碼。

6. 奇門小結
奇門目前偏向「先控局、再推進」，不適合無條件衝刺。

五、卜卦／六爻獨立判讀
1. 資料輸入
本段採用起卦方式與六爻資料作為判讀依據。六爻最適合判斷事件成敗、應期、關係互動、資金得失與是否有暗藏阻力。

2. 推理過程
六爻問投資或決策時，需看世爻、應爻、用神、動爻、變爻與六親。投資通常以妻財爻代表財利，子孫爻代表財源與舒緩壓力，兄弟爻代表競爭、破財與分奪資源，官鬼爻代表壓力、規範、風險或問題。若妻財旺而生世，且兄弟不動，較利。若兄弟發動剋財，或官鬼持世帶壓，則風險升高。

3. 初步判斷
若目前六爻資料未完整，不能直接下定案。若使用時間起卦，僅能作為輔助參考；若由案主親自起卦，判斷效力會更高。

4. 風險點
最大風險是沒有明確卦象卻硬給結論。六爻重在世應、用神、動爻與應期，若這些資訊不足，正式判斷必須降權。

5. 可行策略
建議把問題縮小，例如：「目前這筆投資是否應續抱三個月？」或「是否應在本月內減碼？」問題越具體，卦象越能判斷成敗與應期。

6. 卜卦／六爻小結
六爻目前可作事件風險提醒，但若要定成敗，仍需補齊卦象資料。

六、梅花易數獨立判讀
1. 資料輸入
本段採用梅花起卦方式、上下卦與事件時間作為初步資料。梅花易數重點在象、數、理、占，可用來判斷事情當下象意、變化趨勢與體用關係。

2. 推理過程
梅花需看本卦、互卦、變卦、動爻與體用生剋。本卦代表當前狀態，互卦代表內在過程，變卦代表後續發展，體用代表自己與事件的關係。若本卦象意阻滯但體用相生，代表事情難推但仍有操作空間。若本卦阻滯且體用相剋，則應降低風險或暫緩。

3. 初步判斷
目前梅花可提供象意提示，但若動爻未確認，仍不能完整判斷後勢。若只看上下卦而不看變卦，容易把當前狀態誤當最終結果。

4. 風險點
最大風險是只看卦名，不看體用與變卦。卦名是象，體用是關係，變卦是後勢，三者缺一不可。

5. 可行策略
補齊動爻後，再判斷是否暫緩、試行或退出。若變卦轉通，可採小量試行；若變卦轉凶，應直接進入風險控管。

6. 梅花易數小結
梅花目前可提示事件氣象，但仍需補動爻與變卦後才能定案。

七、四術交叉驗證
1. 同向訊號
四術目前共同指向「資料尚需補強，暫不宜做不可逆決策」。八字看承載力，奇門看當下局勢，六爻看事件成敗，梅花看象意變化，四者都要求先補足關鍵資料。

2. 矛盾訊號
八字可能顯示個人有承擔力，但奇門可能顯示時機不佳；梅花可能顯示象意可動，但六爻可能顯示事件有阻。若出現矛盾，應以風險控管優先，而不是取最樂觀的訊號。

3. 權重排序
本案初步權重建議為：奇門 35%、八字 30%、六爻 20%、梅花 15%。若後續取得完整六爻卦象，六爻權重可提高至 30%。

4. 綜合判斷
目前不宜直接定為可全力推進。較穩健的判斷是：先暫緩擴大投入，補足資料後再判斷是否續行、減碼、轉向或退出。

八、行動方案
1. 3日內
動作：整理本案所有已投入資源、金額、時間、人員、合約與關鍵承諾。
檢核標準：能清楚列出成本、風險、可承受損失與最壞情境。
停損條件：若無法說清楚停損點，不得追加資金或承諾。

2. 7日內
動作：補齊完整八字、大運資料、事件方位、六爻卦象與梅花動爻。
檢核標準：四術資料完整度至少達到 80%。
停損條件：若補資料後三術以上同時指向不利，停止所有新投入。

3. 30日內
動作：建立追蹤表，每週檢查一次結果、風險、資金壓力與是否符合原策略。
檢核標準：每週都能判斷續行、減碼、停損或觀望。
停損條件：若實際結果連續兩週偏離原判斷，立即進入保守模式。

九、最終建議
1. 本案目前不建議直接加碼或做不可逆承諾。
2. 已投入的資源應先進入風險控管模式。
3. 四術資料尚未完整，正式定案前只能採「暫緩與補件」策略。
4. 若後續補齊資料後出現三術以上同向，才可進一步判定是否推進。
5. 最終仍需由風羿老師本人進一步覆核後，才能作為正式交付建議。

十、專業聲明
本報告為易學決策輔助；涉及陽宅、陰宅、重大投資、法律、醫療或不可逆決策，仍需由風羿老師本人進一步確認或親至現場評估。`;
}

function hasUsableFinal(final: any) {
  if (!final || !final.ok || !final.text) return false;

  const text = String(final.text);

  const forbidden = [
    "exceeded your current quota",
    "quota",
    "billing",
    "denied access",
    "access denied",
    "timeout",
    "逾時",
    "失敗",
    "API",
    "OpenAI",
    "Gemini",
    "DeepSeek",
    "error",
    "Error",
  ];

  return !forbidden.some((word) => text.includes(word));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CouncilInput;

    if (!body.question || body.question.trim().length < 2) {
      return jsonResponse(
        {
          ok: false,
          error: "請輸入問題。",
        },
        400
      );
    }

    const qualityGate = buildQualityGate(body);

    const input: CouncilInput = {
      ...body,
      question: body.question.trim(),
      context: `${body.context?.trim() || ""}

${qualityGate}`,
      clientProfile: body.clientProfile?.trim() || "",
      topic: body.topic || "未指定",
      deliverableMode: body.deliverableMode || "商業決策顧問報告",
    };

    const firstPrompt = `${firstRoundPrompt(input)}

${qualityGate}

請用「巽風多維校核」身份進行內部判讀，不要在內容中提及任何底層模型名稱。

第一輪請分別完成：
一、八字命理初判
二、奇門遁甲初判
三、卜卦／六爻初判
四、梅花易數初判
五、本輪初步風險與機會

每一術都要寫出：
1. 採用資料
2. 推理過程
3. 初步判斷
4. 風險
5. 可執行建議`;

    const [openaiFirst, geminiFirst, deepseekFirst] = await Promise.all([
      callOpenAI(
        "openaiFengYi",
        "巽風主判讀分身",
        openaiFengYiSystem(),
        firstPrompt
      ),
      callGemini(
        "geminiFengYi",
        "巽風策略推演分身",
        geminiFengYiSystem(),
        firstPrompt
      ),
      callDeepSeek(
        "deepseekAttack",
        "巽風攻防反證分身",
        deepseekAttackSystem(),
        firstPrompt
      ),
    ]);

    const firstRound = [openaiFirst, geminiFirst, deepseekFirst];

    const firstRoundText = stringifyRound(
      "第一輪：巽風多維初判",
      firstRound
    );

    let debateRound: any[] = [];
    let debateRoundText = "第二輪攻防未啟用。";

    const enableDebate =
      (process.env.ENABLE_DEBATE_ROUND || "true").toLowerCase() === "true";

    if (enableDebate) {
      const secondPrompt = `${debatePrompt(input, firstRoundText)}

${qualityGate}

請嚴格挑出空話、矛盾、不足與不可交付的句子，改成具體可執行建議。

第二輪請特別檢查：
一、各術數是否只有結論、沒有推理。
二、是否把四術混在一起，沒有各自論述。
三、是否出現星號、Markdown 粗體符號。
四、是否出現底層工具名稱。
五、是否缺乏具體行動與停損條件。

請輸出修正後的四術判斷方向。`;

      const [openaiDebate, geminiDebate, deepseekDebate] = await Promise.all([
        callOpenAI(
          "openaiFengYi",
          "巽風主判讀分身｜修正",
          openaiFengYiSystem(),
          secondPrompt
        ),
        callGemini(
          "geminiFengYi",
          "巽風策略推演分身｜修正",
          geminiFengYiSystem(),
          secondPrompt
        ),
        callDeepSeek(
          "deepseekAttack",
          "巽風攻防反證分身｜修正",
          deepseekAttackSystem(),
          secondPrompt
        ),
      ]);

      debateRound = [openaiDebate, geminiDebate, deepseekDebate];

      debateRoundText = stringifyRound(
        "第二輪：巽風多維攻防修正",
        debateRound
      );
    }

    const finalPrompt = `${finalSummaryPrompt(
      input,
      firstRoundText,
      debateRoundText
    )}

${qualityGate}

${buildFinalFormatPrompt()}

請整合第一輪與第二輪內容，但不要只摘要。正式報告必須把八字、奇門、卜卦／六爻、梅花易數各自拆開寫，每一術都要有完整討論過程與結果。

最後輸出前請自行檢查：
1. 是否還有星號。
2. 是否還有 Markdown 粗體。
3. 是否還有底層工具名稱。
4. 是否每一術都有「資料輸入、推理過程、初步判斷、風險點、可行策略、小結」。
5. 是否有 3日、7日、30日行動方案。
6. 是否有停損條件。

若有任何一項不符合，請自行重寫到符合為止。`;

    const final = await callOpenAI(
      "finalChatGPT",
      "風羿老師最終定稿分身",
      fengYiFinalSystem(),
      finalPrompt
    );

    const safeFallbackReport = buildSafeFallbackReport(input);

    const finalOk = hasUsableFinal(final);

    const finalText = finalOk
      ? cleanReportText(final.text)
      : cleanReportText(safeFallbackReport);

    return jsonResponse({
      ok: true,
      input,
      firstRound,
      debateRound,
      final: {
        ok: finalOk,
        label: finalOk ? final.label : "風羿老師備援交付稿",
        text: finalText,
        error: undefined,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return jsonResponse({
      ok: true,
      final: {
        ok: false,
        label: "風羿老師備援交付稿",
        text: cleanReportText(
          buildSafeFallbackReport({
            question: "未能取得完整問題資料",
            topic: "未指定",
            context: "",
            clientProfile: "",
          } as CouncilInput)
        ),
        error: undefined,
      },
      generatedAt: new Date().toISOString(),
    });
  }
}
