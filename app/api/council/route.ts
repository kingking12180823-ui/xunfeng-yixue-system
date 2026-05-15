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
1. 對外正式報告不得出現：OpenAI、Gemini、DeepSeek、AI軍團、模型、API、後端等字眼。
2. 對外統一稱為：「風羿老師多重分身校核」或「巽風多維校核系統」。
3. 報告要像顧問交付文件，不要像一般聊天回答。

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
5. 對外報告不得出現 OpenAI、Gemini、DeepSeek、AI軍團、模型、API、後端等字眼。
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

    const fallbackReport = `巽風易學綜合決策報告

一、總結論
本次最終定稿未成功回傳，建議暫採「補資料後再判」。目前不可直接做不可逆決策。

二、內部校核摘要
${firstRoundText}

${debateRoundText}

三、下一步
1. 補齊出生時間、事件時間、標的、資金條件、可承受損失。
2. 建立 3 日與 7 日觀察點。
3. 設定停損條件。
4. 由風羿老師本人進行最後人工覆核。`;

    const finalText = final.ok
      ? cleanReportText(final.text)
      : cleanReportText(fallbackReport);

    return jsonResponse({
      ok: true,
      input,
      firstRound,
      debateRound,
      final: {
        ok: final.ok,
        label: final.label,
        text: finalText,
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
