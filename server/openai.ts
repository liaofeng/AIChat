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
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "抱歉，我遇到了一些问题。请稍后再试。";
  }
}