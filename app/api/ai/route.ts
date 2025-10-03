import { NextRequest } from 'next/server'
import { callLLM } from '@/lib/llm'
import type { AIParams } from '@/types/llm'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AIParams>
    if (!body || !body.text || !body.task) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
    }

    const params: AIParams = {
      task: body.task,
      text: body.text,
      language: body.language || 'Japanese',
      model: body.model,
      systemHint: body.systemHint,
    }

    const content = await callLLM(params)
    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}





