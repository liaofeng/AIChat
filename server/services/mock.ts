import type { Message } from "../shared/schema";

const RESPONSE_PATTERNS = {
  GREETING: ['你好！很高兴和你交谈。', '你好！有什么我可以帮你的吗？', '你好！让我们开始对话吧。'],
  QUESTION: ['这是一个很好的问题。', '让我想想...', '关于这个问题，我的看法是...'],
  SHORT_MESSAGE: ['能详细说明一下吗？', '请告诉我更多信息。', '可以具体描述一下吗？'],
  TASK: ['好的，我来帮你处理这个任务。', '我明白你的需求了。', '让我来协助你完成这个。'],
  DEFAULT: ['我明白你的意思了。', '这确实是个有趣的话题。', '让我们继续探讨这个问题。']
} as const;

function getRandomResponse(patterns: readonly string[]): string {
  return patterns[Math.floor(Math.random() * patterns.length)];
}

export class MockService {
  private messages: Message[] = [];
  private currentId = 1;

  constructor() {
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_SERVICE === 'true') {
      console.log('Using development mock service with varied responses');
    }
  }

  async chat(message: string, sessionId: string): Promise<Message[]> {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const userMessage: Message = {
      id: this.currentId++,
      sessionId,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Generate contextual response
    let response: string;
    if (message.includes('你好') || message.includes('hello')) {
      response = getRandomResponse(RESPONSE_PATTERNS.GREETING);
    } else if (message.includes('?') || message.includes('？')) {
      response = getRandomResponse(RESPONSE_PATTERNS.QUESTION) + 
        `关于"${message.slice(0, 10)}..."，`;
    } else if (message.length < 10) {
      response = getRandomResponse(RESPONSE_PATTERNS.SHORT_MESSAGE);
    } else if (message.includes('帮我') || message.includes('请') || message.includes('能否')) {
      response = getRandomResponse(RESPONSE_PATTERNS.TASK);
    } else {
      response = getRandomResponse(RESPONSE_PATTERNS.DEFAULT) +
        `关于"${message.slice(0, 10)}..."，`;
    }

    const assistantMessage: Message = {
      id: this.currentId++,
      sessionId,
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    this.messages.push(userMessage, assistantMessage);
    return [userMessage, assistantMessage];
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.messages.filter(msg => msg.sessionId === sessionId);
  }
}

export const mockService = new MockService();
