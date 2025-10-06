import { NextRequest, NextResponse } from "next/server";
import { getLLMClient } from "@/lib/llm";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    // 環境変数の確認ログ
    console.log("API Route - Environment check:", {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || "none",
      model: process.env.OPENAI_MODEL,
      baseUrl: process.env.OPENAI_API_BASE_URL
    });

    const { instruction, userInput, maxTokens, temprature } = await request.json();
    if (!instruction) {
        return NextResponse.json({ error: "Instruction is required" }, { status: 400 });
    }
    const client = getLLMClient();
    const result = await client.generate({
      instruction,
      userInput,
      maxTokens,
      temperature: temprature,
    });
    return NextResponse.json(result);
  } catch ( error: any ) {
      console.error("Error in /api/llm:", {
        message: error?.message,
        stack: error?.stack,
        status: error?.status,
        timestamp: new Date().toISOString()
      });

      let message = error?.message || "Internal Server Error";
      let status = 500;

      if (/(^|\s)429(\s|$)/.test(String(message))) {
        status = 429;
        message = "レート制限によりリクエストが拒否されました。しばらく待ってから再試行してください。";
      } else if (message.includes("401")) {
        status = 401;
        message = "認証エラーです。APIキーを確認してください。";
      }

      return NextResponse.json({ error: message }, { status });
  }
}
