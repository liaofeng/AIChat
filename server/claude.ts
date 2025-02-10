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
      return "Sorry, I cannot answer right now.";
    }
    return response.content[0].text;
  } catch (error: any) {
    console.error("Claude API error:", error);

    if (error.status === 429) {
      return "Sorry, Claude API rate limit exceeded. Please check your Anthropic account settings.";
    } else if (error.status === 401) {
      return "Sorry, invalid Claude API key. Please provide a valid API key.";
    } else {
      return "Sorry, the AI service is temporarily unavailable. Please try again later.";
    }
  }
}
