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
【品質門檻，必須遵守】
1. 對外正式報告不得出現：OpenAI、Gemini、DeepSeek、AI軍團、模型、後端、API 等字眼。
2. 對外統一稱為：「風羿老師多重分身校核」或「巽風多維校核系統」。
3. 不得寫空話，例如：低風險推進、調整作息、注意文件，除非明確說明怎麼做、何時做、做到什麼標準。
4. 每一術至少要有「判斷依據、可行策略、風險提醒、落地動作」四段。
5. 如果資料不足，要說明哪些資料不足、造成哪個判斷降權、要補什麼資料。
6. ${input.topic || "本案"}必須輸出具體決策語句：可進、可試行、暫緩、不可進、或需補資料後再判。
7. 行動方案必須分成：3日內、7日內、30日內。
8. 投資、財務、法律、醫療相關內容必須提醒風險，不可保證獲利或結果。
9. 正式報告要像顧問交付文件，不要像一般聊天回答。
10. 結論要明確，但不得神化或保證結果。
`;
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

請用「巽風多維校核」身份進行內部判讀，不要在內容中提及任何底層模型名稱。`;

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

請嚴格挑出空話、矛盾、不足與不可交付的句子，改成具體可執行建議。`;

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

【最終定稿要求】
請輸出完整正式報告，嚴禁提及 OpenAI、Gemini、DeepSeek、AI軍團、模型、API、後端。
請使用「巽風多維校核系統」或「風羿老師多重分身校核」作為內部方法名稱。
每一段都要具體，不要泛泛而談。

報告格式必須如下：

# 巽風易學綜合決策報告

## 一、個案總論
- 直接給結論：可進／可試行／暫緩／不建議／補資料後再判。
- 說明本案最大機會與最大風險。
- 不超過 250 字，但要有判斷。

## 二、四術資料完整度檢核
用表格列出：八字、奇門、卜卦／六爻、梅花易數，各自資料狀態、可判斷程度、降權原因。

## 三、八字命理判讀
包含：
1. 承載力與決策節奏
2. 財務／事業壓力點
3. 本案可用策略
4. 需要避開的行為

## 四、奇門遁甲部署
包含：
1. 目前局勢
2. 可借勢的人、時、地、物
3. 主動／被動策略
4. 事件推進窗口

## 五、卜卦／六爻事件判讀
包含：
1. 成敗條件
2. 卡點
3. 應期或觀察期
4. 需要補強的文件、承諾或證據

## 六、梅花易數象意提示
包含：
1. 本卦象意
2. 變化訊號
3. 三日內可觀察的人事物
4. 象意轉成行動建議

## 七、四術交叉驗證
列出：
1. 同向訊號
2. 矛盾訊號
3. 不能硬斷之處
4. 最終採用哪一個判斷權重

## 八、行動方案
分成：
- 3日內
- 7日內
- 30日內

每一項都要有：
1. 動作
2. 檢核標準
3. 失敗停損

## 九、最終建議
用 5 句話內收束，不要空泛。

## 十、專業聲明
本報告為易學決策輔助；涉及陽宅、陰宅、重大投資、法律、醫療或不可逆決策，仍需由風羿老師本人進一步確認或親至現場評估。`;

    const final = await callOpenAI(
      "finalChatGPT",
      "風羿老師最終定稿分身",
      fengYiFinalSystem(),
      finalPrompt
    );

    const fallbackReport = `# 巽風易學綜合決策報告

## 一、總結論
本次最終定稿未成功回傳，建議暫採「補資料後再判」。目前不可直接做不可逆決策。

## 二、內部校核摘要
${firstRoundText}

${debateRoundText}

## 三、下一步
1. 補齊出生時間、事件時間、標的、資金條件、可承受損失。
2. 建立 3 日與 7 日觀察點。
3. 設定停損條件。
4. 由風羿老師本人進行最後人工覆核。`;

    return jsonResponse({
      ok: true,
      input,
      firstRound,
      debateRound,
      final: {
        ok: final.ok,
        label: final.label,
        text: final.ok ? final.text : fallbackReport,
        error: final.ok ? undefined : final.error,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return jsonResponse(
      {
        ok: false,
        error: error?.message || "伺服器發生錯誤",
      },
      500
    );
  }
}
