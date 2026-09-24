import { AIProvider, AIChatOptions, AIMessage } from "../types";

export class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";
  readonly isConfigured: boolean;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(apiKey: string, baseUrl: string, defaultModel: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.defaultModel = defaultModel;
    this.isConfigured = Boolean(apiKey);
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<string> {
    if (!this.isConfigured) {
      throw new Error("AI provider is not configured: missing API key");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model ?? this.defaultModel,
        messages,
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `AI provider request failed (${response.status}): ${response.statusText}${body ? ` - ${body}` : ""}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (data.error?.message) {
      throw new Error(`AI provider error: ${data.error.message}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI provider returned an empty response");
    }

    return content;
  }
}
