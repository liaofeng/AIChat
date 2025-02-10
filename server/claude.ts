import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function getChatCompletion(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      messages: messages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      max_tokens: 1000,
      temperature: 0.7
    });

    if (!response.content[0] || !('text' in response.content[0])) {
      return "很抱歉，我现在无法回答。";
    }
    return response.content[0].text;
  } catch (error: any) {
    console.error("Claude API error:", error);

    if (error.status === 429) {
      return "抱歉，Claude API 使用配额已超限。请检查您的 Anthropic 账户设置。";
    } else if (error.status === 401) {
      return "抱歉，Claude API 密钥无效。请提供有效的 API 密钥。";
    } else {
      return "抱歉，AI 服务暂时出现问题。请稍后再试。";
    }
  }
}
