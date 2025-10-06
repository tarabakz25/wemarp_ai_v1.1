/**
 * Marp Markdown generation prompts and utilities
 */

export interface MarpGenerateInput {
  userPrompt: string;
  theme?: string;
  tone?: "academic" | "business" | "casual";
  slideCount?: number;
}

export function buildMarpPrompt(input: MarpGenerateInput): string {
  const { userPrompt, theme = "default", tone = "business", slideCount = 10 } = input;
  
  return `You are an expert presentation creator. Generate a complete Marp Markdown slide deck based on the user's request.

**Requirements:**
- Output ONLY valid Marp Markdown (no explanation text before or after)
- Start with YAML frontmatter containing: marp: true, theme: ${theme}, size: 16:9
- Create approximately ${slideCount} slides
- Use appropriate Marp directives (---, <!-- _class: lead -->, etc.)
- Tone: ${tone}
- Use proper heading levels (# for title, ## for slide titles, ### for sections)
- Include bullet points, numbered lists, and formatting where appropriate
- DO NOT include any explanatory text outside the Markdown

**User Request:**
${userPrompt}

**Output Format Example:**
\`\`\`markdown
---
marp: true
theme: ${theme}
size: 16:9
---

# Main Title
## Subtitle

---

## First Slide Title
- Key point 1
- Key point 2
- Key point 3

---

## Second Slide Title
Content here...

\`\`\`

Now generate the Marp Markdown for the user's request:`;
}

export function extractMarpMarkdown(llmOutput: string): string {
  // Remove markdown code fences if present
  let cleaned = llmOutput.trim();
  
  // Remove ```markdown or ``` wrapper
  const codeBlockMatch = cleaned.match(/^```(?:markdown)?\s*\n([\s\S]*?)\n```$/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  
  // Ensure it starts with YAML frontmatter
  if (!cleaned.startsWith('---')) {
    // Add default frontmatter if missing
    cleaned = `---
marp: true
theme: default
size: 16:9
---

${cleaned}`;
  }
  
  return cleaned;
}

export function validateMarpMarkdown(md: string): { valid: boolean; error?: string } {
  if (!md || md.trim().length === 0) {
    return { valid: false, error: "Empty markdown" };
  }
  
  if (!md.includes('---')) {
    return { valid: false, error: "Missing slide separator (---)" };
  }
  
  // Check for YAML frontmatter
  if (!md.trim().startsWith('---')) {
    return { valid: false, error: "Missing YAML frontmatter" };
  }
  
  return { valid: true };
}
