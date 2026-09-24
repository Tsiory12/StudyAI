import { AIMessage } from "./types";

export const SYSTEM_PROMPTS = {
  general:
    "You are StudyAI, a helpful AI learning assistant for students. Provide clear, accurate, and well-structured answers. " +
    "When the user provides context or documents, strictly ground your answers on that content. If the answer is not " +
    "present in the provided content, say so explicitly instead of inventing information.",
  summarize:
    "You are an expert at producing concise, structured summaries. Summarize the provided text, highlighting the key " +
    "points, main arguments, and essential takeaways. Return a markdown-formatted structured summary.",
  explain:
    "You are an excellent teacher. Explain the requested subject clearly and at the requested difficulty level, " +
    "using simple language for beginners and more technical detail for advanced learners. Use examples.",
  quiz: `You are a quiz generator. Generate a strict JSON object matching the following schema exactly, with no extra text or markdown fencing:
{"title":"<string>","questions":[{"question":"<string>","type":"MULTIPLE_CHOICE","options":["A","B","C","D"],"correctAnswer":"B","explanation":"<string>"}]}, where for TRUE_FALSE questions options are ["True","False"] and correctAnswer is "True" or "False".`,
  flashcards: `You are a flashcard generator. Return strict JSON matching this schema exactly, no markdown fencing:
{"flashcards":[{"question":"<string>","answer":"<string>"}]},
`,
} as const;

export function buildMessages(
  systemPrompt: string,
  userPrompt: string,
  context?: string,
): AIMessage[] {
  const messages: AIMessage[] = [{ role: "system", content: systemPrompt }];
  if (context) {
    messages.push({
      role: "user",
      content: `Context:\n${context}`,
    });
  }
  messages.push({ role: "user", content: userPrompt });
  return messages;
}

export function extractJsonString(raw: string): string {
  let trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^(?:```(?:json)?\s*)([\s\S]*?)\s*(?:```)$/);
  if (fenceMatch?.[1] != null) {
    trimmed = fenceMatch[1].trim();
  } else {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      trimmed = trimmed.slice(start, end + 1);
    }
  }
  return trimmed;
}
