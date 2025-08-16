import type { AIParams } from "@/types/llm"
import OpenAI from "openai"

const DEFAULT_MODEL = 'gpt-4o-mini'

export async function callLLM(params: AIParams): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const system = systemPrompt(params)
  const user = buildPrompt(params)

  const model = params.model || DEFAULT_MODEL
  const temperature = 0.7

  const resp = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })

  const content = resp.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Empty response from LLM')
  return content
}

// プロンプト生成
function systemPrompt(p: AIParams) {
  const lang = p.language || 'English'
  const extra = p.systemHint ? p.systemHint : ''

  return [
      'あなたは Marp 形式のスライド作成を支援するアシスタントです。',
      '出力は可能な限り Marp の 1スライド/セクションで貼り付けやすい Markdown に整形してください。',
      '箇条書きは "- " を使用し、冗長表現を避けて簡潔に。',
      `出力言語: ${lang}`,
      extra,
    ].filter(Boolean).join('\n')
}

function buildPrompt(p: AIParams) {
  const lang = p.language || 'English'
  const base = p.text?.trim() || ''

  switch (p.task) {
    case 'outline':
      return `次の内容から5~10枚のスライド構成を作ってください。\n各スライドは、- タイトル - 箇条書き3~5個 - フッター用の短い要約 で出力。\n---\n${base}`
    case 'summarize':
      return `次の内容を要約してください。\n出力は、箇条書きで3~5個のポイントを含むMarkdownで。\n---\n${base}`
    case 'rewrite':
      return `次の内容を、${lang}で書き直してください。\n---\n${base}`
    case 'translate':
      return `次の内容を${lang}に翻訳してください。\n---\n${base}`
    default:
      return base
  }
}
