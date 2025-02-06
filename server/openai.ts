import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function getChatCompletion(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || "很抱歉，我现在无法回答。";
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    // 检查具体的错误类型
    if (error.status === 429) {
      return "抱歉，OpenAI API 使用配额已超限。请检查您的 OpenAI 账户计费设置：https://platform.openai.com/account/billing";
    } else if (error.status === 401) {
      return "抱歉，OpenAI API 密钥无效。请提供有效的 API 密钥。";
    } else {
      return "抱歉，AI 服务暂时出现问题。请稍后再试。";
    }
  }
}