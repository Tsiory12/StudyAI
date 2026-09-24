import { AIProvider, AIChatOptions, AIMessage, AIGeneratedQuiz, AIGeneratedFlashcards, AIServiceResponse } from "./types";
import { OpenAICompatibleProvider } from "./providers/openai.provider";
import { env } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import { z } from "zod";
import { SYSTEM_PROMPTS, buildMessages, extractJsonString } from "./prompts";

const QUIZ_RESPONSE_SCHEMA = z.object({
  title: z.string().min(1),
  questions: z.array(
    z.object({
      question: z.string().min(1),
      type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
      options: z.array(z.string()).min(2),
      correctAnswer: z.string().min(1),
      explanation: z.string().optional(),
    }),
  ),
});

const FLASHCARDS_RESPONSE_SCHEMA = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    }),
  ),
});

export class AIService {
  private provider: AIProvider | null = null;

  constructor() {
    if (env.AI_API_KEY) {
      this.provider = new OpenAICompatibleProvider(env.AI_API_KEY, env.AI_API_URL, env.AI_MODEL);
    }
  }

  isConfigured(): boolean {
    return this.provider !== null;
  }

  private getProvider(): AIProvider {
    if (!this.provider) {
      throw new AppError("AI service is not configured. Set AI_API_KEY in the environment.", 503);
    }
    return this.provider;
  }

  private defaultOptions(): AIChatOptions {
    return {
      maxTokens: env.AI_MAX_TOKENS,
      temperature: env.AI_TEMPERATURE,
    };
  }

  async chat(input: { question: string; context?: string }): Promise<AIServiceResponse> {
    const provider = this.getProvider();
    const messages = buildMessages(
      SYSTEM_PROMPTS.general,
      `Answer the following question. If context is provided, ground your answer on it.\nQuestion: ${input.question}`,
      input.context,
    );
    const answer = await provider.chat(messages, this.defaultOptions());
    return { answer };
  }

  async explain(input: { subject: string; difficulty: string; context?: string }): Promise<AIServiceResponse> {
    const provider = this.getProvider();
    const userPrompt = `Explain "${input.subject}" as if I were a ${input.difficulty} student. Be clear and use examples.`;
    const messages = buildMessages(SYSTEM_PROMPTS.explain, userPrompt, input.context);
    const answer = await provider.chat(messages, { ...this.defaultOptions(), temperature: 0.7 });
    return { answer };
  }

  async summarize(input: { text: string; maxLength?: number }): Promise<AIServiceResponse> {
    const provider = this.getProvider();
    const lengthInstruction = input.maxLength
      ? ` Keep the summary concise, targeting roughly ${input.maxLength} words.`
      : "";
    const userPrompt = `Summarize the following text, producing a structured markdown summary with key points and takeaways.${lengthInstruction}\n\nText:\n${input.text}`;
    const messages: AIMessage[] = [
      { role: "system", content: SYSTEM_PROMPTS.summarize },
      { role: "user", content: userPrompt },
    ];
    const answer = await provider.chat(messages, { ...this.defaultOptions(), temperature: 0.3 });
    return { answer };
  }

  async generateQuiz(input: {
    content: string;
    questionCount: number;
    difficulty: string;
    title: string;
  }): Promise<AIGeneratedQuiz> {
    const provider = this.getProvider();
    const userPrompt = `Generate a ${input.questionCount}-question ${input.difficulty} difficulty quiz titled "${input.title}" based ONLY on the following content:\n\n${input.content}`;
    const messages = buildMessages(SYSTEM_PROMPTS.quiz, userPrompt);
    const raw = await provider.chat(messages, { ...this.defaultOptions(), temperature: 0.4 });

    const jsonStr = extractJsonString(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new AppError("AI service returned an invalid quiz response (unparseable JSON).", 502);
    }

    const result = QUIZ_RESPONSE_SCHEMA.safeParse(parsed);
    if (!result.success) {
      throw new AppError(`AI service returned a quiz that did not match the expected schema.`, 502);
    }

    const data = result.data;
    const questions = data.questions.map((q) => ({
      question: q.question,
      type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE",
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
    return { title: data.title, questions };
  }

  async generateFlashcards(input: { content: string; count: number }): Promise<AIGeneratedFlashcards> {
    const provider = this.getProvider();
    const userPrompt = `Generate ${input.count} flashcards based ONLY on the following content. Each flashcard has a question and a concise answer.\n\n${input.content}`;
    const messages = buildMessages(SYSTEM_PROMPTS.flashcards, userPrompt);
    const raw = await provider.chat(messages, { ...this.defaultOptions(), temperature: 0.4 });

    const jsonStr = extractJsonString(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new AppError("AI service returned an invalid flashcards response (unparseable JSON).", 502);
    }

    const result = FLASHCARDS_RESPONSE_SCHEMA.safeParse(parsed);
    if (!result.success) {
      throw new AppError("AI service returned flashcards that did not match the expected schema.", 502);
    }

    return { flashcards: result.data.flashcards };
  }
}

export const aiService = new AIService();
