import { NextRequest, NextResponse } from "next/server";
import { getLLMClient } from "@/lib/llm";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
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
      console.error("Error in /api/llm:", error);
      return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
