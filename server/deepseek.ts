import { unified, type UCompletionBaseParams, type UMessages, type UUnifiedResponse } from 'unified-llm';

const llm = unified;
const apiKey = process.env.DEEPSEEK_API_KEY as string;

if (!apiKey) {
  throw new Error("DEEPSEEK_API_KEY environment variable is not set");
}

export async function getChatCompletion(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const params: UCompletionBaseParams = {
      model_provider: 'deepseek',
      model_name: 'deepseek-chat',
      api_key: apiKey,
      system_messages: [{
        type: 'text' as const,
        content: '你是一个有帮助的助手，用中文回答问题。'
      }],
      messages: messages.map(msg => ({
        role: msg.role,
        content: [{
          type: 'text' as const,
          content: msg.content
        }]
      })) as UMessages,
      parameters: {
        temperature: 0.7,
        max_tokens: 1000
      }
    };

    const response = await llm.create(params) as UUnifiedResponse;
    return response.completion || "很抱歉，我现在无法回答。";
  } catch (error: any) {
    console.error("DeepSeek API error:", error);

    if (error.status === 429) {
      return "抱歉，API 使用配额已超限。请检查您的 DeepSeek 账户设置。";
    } else if (error.status === 401) {
      return "抱歉，API 密钥无效。请提供有效的 API 密钥。";
    } else {
      return "抱歉，AI 服务暂时出现问题。请稍后再试。";
    }
  }
}
