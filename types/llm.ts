export type AITask = 
  | 'outline'
  | 'summarize'
  | 'rewrite'
  | 'translate'

export type AIParams = {
  task: AITask
  text: string
  language?: string
  model?: string
  systemHint?: string
}