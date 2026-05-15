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
import { callDeepSeek, callGemini, callOpenAI, stringifyRound } from "@/lib/aiProviders";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CouncilInput;

    if (!body.question || body.question.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "請輸入問題。" }, { status: 400 });
    }

    const input: CouncilInput = {
      question: body.question.trim(),
      context: body.context?.trim() || "",
      clientProfile: body.clientProfile?.trim() || "",
      topic: body.topic || "未指定",
      deliverableMode: body.deliverableMode || "商業決策顧問報告",
    };

    const [openaiFirst, geminiFirst, deepseekFirst] = await Promise.all([
      callOpenAI("openaiFengYi", "ChatGPT 風羿分身", openaiFengYiSystem(), firstRoundPrompt(input, "ChatGPT 風羿分身")),
      callGemini("geminiFengYi", "Gemini 風羿分身", geminiFengYiSystem(), firstRoundPrompt(input, "Gemini 風羿分身")),
      callDeepSeek("deepseekAttack", "DeepSeek 攻防反證", deepseekAttackSystem(), firstRoundPrompt(input, "DeepSeek 攻防反證")),
    ]);

    const firstRoundText = stringifyRound("第一輪：三方初判", [openaiFirst, geminiFirst, deepseekFirst]);

    let debateResults: any[] = [];
    let debateRoundText = "第二輪攻防未啟用。";

    if ((process.env.ENABLE_DEBATE_ROUND || "true").toLowerCase() === "true") {
      const [openaiDebate, geminiDebate, deepseekDebate] = await Promise.all([
        callOpenAI("openaiFengYi", "ChatGPT 風羿分身｜攻防修正", openaiFengYiSystem(), debatePrompt(input, "ChatGPT 風羿分身", firstRoundText)),
        callGemini("geminiFengYi", "Gemini 風羿分身｜攻防修正", geminiFengYiSystem(), debatePrompt(input, "Gemini 風羿分身", firstRoundText)),
        callDeepSeek("deepseekAttack", "DeepSeek 攻防反證｜第二輪", deepseekAttackSystem(), debatePrompt(input, "DeepSeek 攻防反證", firstRoundText)),
      ]);
      debateResults = [openaiDebate, geminiDebate, deepseekDebate];
      debateRoundText = stringifyRound("第二輪：攻防修正", debateResults);
    }

    const finalPrompt = finalSummaryPrompt(input, firstRoundText, debateRoundText);
    const final = await callOpenAI("finalChatGPT", "ChatGPT｜風羿老師最終總結", fengYiFinalSystem(), finalPrompt);

    const fallback = `# 風羿老師綜合決策報告

## 一、總結論
最終總結模型未成功回傳，建議暫採保守策略：先補資料、先做7日驗證、不做不可逆承諾。

## 二、內部校核摘要
${firstRoundText}

${debateRoundText}

## 三、下一步
1. 補齊時間、人物、資源、限制條件。
2. 建立7日內可驗證行動。
3. 設定停損條件。
4. 由風羿老師本人進行最後人工覆核。`;

    return NextResponse.json({
      ok: true,
      input,
      firstRound: [openaiFirst, geminiFirst, deepseekFirst],
      debateRound: debateResults,
      final: {
        ok: final.ok,
        label: final.label,
        text: final.ok ? final.text : fallback,
        error: final.ok ? undefined : final.error,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "伺服器發生錯誤" }, { status: 500 });
  }
}
