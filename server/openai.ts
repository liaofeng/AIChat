import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getChatCompletion(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get response from AI");
  }
}