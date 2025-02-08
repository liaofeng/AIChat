import type { Message } from "../shared/schema";

export class MockService {
  private messages: Message[] = [];
  private currentId = 1;

  async chat(message: string, sessionId: string): Promise<Message[]> {
    const userMessage: Message = {
      id: this.currentId++,
      sessionId,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    const assistantMessage: Message = {
      id: this.currentId++,
      sessionId,
      role: 'assistant',
      content: '这是一个测试回复',
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
