import { type Message } from '@shared/schema'
import { type IStorage } from '@server/storage'

export class MockStorage implements IStorage {
  messages: Message[] = []
  
  async getMessages(sessionId: string): Promise<Message[]> {
    return this.messages.filter(msg => msg.sessionId === sessionId)
  }

  async createMessage(message: any): Promise<Message> {
    const newMessage = {
      id: this.messages.length + 1,
      timestamp: new Date(),
      ...message
    }
    this.messages.push(newMessage)
    return newMessage
  }
}

export const mockDeepSeekResponse = {
  completion: '这是一个测试回复'
}
