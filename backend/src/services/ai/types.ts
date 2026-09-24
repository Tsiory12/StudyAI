export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AIChatOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  chat(messages: AIMessage[], options?: AIChatOptions): Promise<string>;
}

export interface AIServiceResponse {
  answer: string;
}

export interface AIGeneratedQuestion {
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface AIGeneratedQuiz {
  title: string;
  questions: AIGeneratedQuestion[];
}

export interface AIGeneratedFlashcard {
  question: string;
  answer: string;
}

export interface AIGeneratedFlashcards {
  flashcards: AIGeneratedFlashcard[];
}
