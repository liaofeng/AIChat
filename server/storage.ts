import { messages, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  getMessages(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private messages: Message[];
  private currentId: number;

  constructor() {
    this.messages = [];
    this.currentId = 1;
    // Log storage initialization for debugging
    console.log('Initializing MemStorage');
  }

  private logMessages() {
    console.log('Current messages:', this.messages);
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const messages = this.messages.filter(msg => msg.sessionId === sessionId);
    console.log(`Getting messages for session ${sessionId}:`, messages);
    return messages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.currentId++,
      ...insertMessage,
      timestamp: new Date()
    };
    this.messages.push(message);
    console.log(`Created message for session ${insertMessage.sessionId}:`, message);
    this.logMessages();
    return message;
  }
}

export const storage = new MemStorage();
