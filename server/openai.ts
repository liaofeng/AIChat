import OpenAI from "openai";

const mockResponses = [
  "你好！我很高兴和你聊天。",
  "这是一个很有趣的话题，能详细说说吗？",
  "我明白你的意思了，让我想想...",
  "确实如此，我也是这么认为的。",
  "这个问题很有深度，值得好好探讨。",
  "我觉得这个想法很有创意！",
  "说得对，继续说下去吧。",
  "这让我想起了一个类似的情况...",
  "有意思的观点，能举个例子吗？",
  "我完全理解你的感受。"
];

export async function getChatCompletion(messages: { role: string; content: string }[]): Promise<string> {
  // Get the last user message for context (not used in mock implementation)
  const lastMessage = messages[messages.length - 1];

  // Return a random response
  const randomIndex = Math.floor(Math.random() * mockResponses.length);
  return mockResponses[randomIndex];
}