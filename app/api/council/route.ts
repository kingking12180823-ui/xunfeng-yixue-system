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

    const input: CouncilInput = {
      ...body,
      question: body.question.trim(),
      context: body.context?.trim() || "",
      clientProfile: body.clientProfile?.trim() || "",
      topic: body.topic || "未指定",
      deliverableMode: body.deliverableMode || "商業決策顧問報告",
    };

    const firstPrompt = firstRoundPrompt(input);

    const [openaiFirst, geminiFirst, deepseekFirst] = await Promise.all([
      callOpenAI(
        "openaiFengYi",
        "ChatGPT 風羿分身",
        openaiFengYiSystem(),
        firstPrompt
      ),
      callGemini(
        "geminiFengYi",
        "Gemini 風羿分身",
        geminiFengYiSystem(),
        firstPrompt
      ),
      callDeepSeek(
        "deepseekAttack",
        "DeepSeek 攻防反證",
        deepseekAttackSystem(),
        firstPrompt
      ),
    ]);

    const firstRound = [openaiFirst, geminiFirst, deepseekFirst];

    const firstRoundText = stringifyRound(
      "第一輪：四術初判",
      firstRound
    );

    let debateRound: any[] = [];
    let debateRoundText = "第二輪攻防未啟用。";

    const enableDebate =
      (process.env.ENABLE_DEBATE_ROUND || "true").toLowerCase() === "true";

    if (enableDebate) {
      const secondPrompt = debatePrompt(input, firstRoundText);

      const [openaiDebate, geminiDebate, deepseekDebate] = await Promise.all([
        callOpenAI(
          "openaiFengYi",
          "ChatGPT 風羿分身｜攻防修正",
          openaiFengYiSystem(),
          secondPrompt
        ),
        callGemini(
          "geminiFengYi",
          "Gemini 風羿分身｜攻防修正",
          geminiFengYiSystem(),
          secondPrompt
        ),
        callDeepSeek(
          "deepseekAttack",
          "DeepSeek 攻防反證｜第二輪",
          deepseekAttackSystem(),
          secondPrompt
        ),
      ]);

      debateRound = [openaiDebate, geminiDebate, deepseekDebate];

      debateRoundText = stringifyRound(
        "第二輪：攻防修正",
        debateRound
      );
    }

    const finalPrompt = finalSummaryPrompt(
      input,
      firstRoundText,
      debateRoundText
    );

    const final = await callOpenAI(
      "finalChatGPT",
      "ChatGPT｜風羿老師最終總結",
      fengYiFinalSystem(),
      finalPrompt
    );

    const fallbackReport = `# 巽風易學綜合決策報告

## 一、總結論
最終總結模型未成功回傳，建議暫採保守策略：先補資料、先做 7 日驗證、不做不可逆承諾。

## 二、內部校核摘要
${firstRoundText}

${debateRoundText}

## 三、下一步
1. 補齊出生時間、事件時間、人物、資源、限制條件。
2. 建立 7 日內可驗證行動。
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
