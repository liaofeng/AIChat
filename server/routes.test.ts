import { vi } from 'vitest'

vi.mock('./storage', () => ({
  storage: {
    getMessages: vi.fn(),
    createMessage: vi.fn()
  }
}))

vi.mock('./mock', () => ({
  mockService: {
    chat: vi.fn()
  }
}))

import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { registerRoutes } from './routes'
import { storage } from './storage'
import { mockService } from './mock'
import session from 'express-session'
import type { Message } from '@shared/schema'

const mockMessages: Message[] = []

describe('routes', () => {
  let app: express.Express
  beforeEach(() => {
    app = express()
    
    // Setup session middleware for testing
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      name: 'test-session'
    }))
    
    app.use(express.json())
    
    // Setup session ID middleware
    app.use((req, _res, next) => {
      if (!req.session.id) {
        req.session.id = 'test-session'
      }
      next()
    })
    
    registerRoutes(app)
    
    // Reset mocks and storage
    vi.clearAllMocks()
    mockMessages.length = 0 // Clear the messages array
    
    // Setup default mock implementations
    vi.mocked(storage.getMessages).mockImplementation((sessionId: string) => 
      Promise.resolve(mockMessages.filter(msg => msg.sessionId === sessionId))
    )
    
    vi.mocked(storage.createMessage).mockImplementation((msg: Omit<Message, 'id' | 'timestamp'>) => {
      const newMessage: Message = {
        id: mockMessages.length + 1,
        timestamp: new Date(),
        ...msg
      }
      mockMessages.push(newMessage)
      return Promise.resolve(newMessage)
    })
    
    vi.mocked(mockService.chat).mockImplementation((message: string, sessionId: string) => {
      const userMessage = {
        id: mockMessages.length + 1,
        sessionId,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      const assistantMessage = {
        id: mockMessages.length + 2,
        sessionId,
        role: 'assistant',
        content: '测试回复',
        timestamp: new Date()
      };
      return Promise.resolve([userMessage, assistantMessage]);
    });
  })

  describe('POST /api/chat', () => {
    it('handles chat messages with session ID', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' })
        .expect(200)
      
      const { messages } = response.body
      expect(messages).toBeDefined()
      expect(messages).toHaveLength(2)
      expect(messages[0]).toMatchObject({
        content: 'test message',
        role: 'user',
        sessionId: 'test-session'
      })
      expect(messages[1]).toMatchObject({
        content: '测试回复',
        role: 'assistant',
        sessionId: 'test-session'
      })
    })

    it('maintains message separation between sessions', async () => {
      // First session
      await request(app)
        .post('/api/chat')
        .send({ message: 'message 1' })
        .expect(200)

      // Second session
      const session2Id = 'test-session-2'
      app.use((req, _res, next) => {
        req.session.id = session2Id
        next()
      })

      await request(app)
        .post('/api/chat')
        .send({ message: 'message 2' })
        .expect(200)

      // Verify messages are separated
      const session1Messages = await storage.getMessages('test-session')
      const session2Messages = await storage.getMessages(session2Id)

      expect(session1Messages.filter(m => m.role === 'user')[0].content).toBe('message 1')
      expect(session2Messages.filter(m => m.role === 'user')[0].content).toBe('message 2')
    })

    it('handles invalid messages', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' })
      
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('消息格式无效')
    })

    it('handles mock service errors', async () => {
      vi.mocked(mockService.chat).mockRejectedValue(new Error('Mock Error'))
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' })
        .expect(200)
      
      const { messages } = response.body
      expect(messages[1].content).toBe('抱歉，AI服务暂时不可用，请检查API密钥是否正确设置。')
      expect(messages[1].role).toBe('assistant')
      expect(messages[1].sessionId).toBe('test-session')
    })
  })

  describe('GET /api/messages', () => {
    it('retrieves messages for specific session', async () => {
      // Add messages for different sessions
      const session1Messages = [
        {
          id: 1,
          sessionId: 'test-session',
          role: 'user',
          content: 'message 1',
          timestamp: new Date()
        },
        {
          id: 2,
          sessionId: 'test-session-2',
          role: 'user',
          content: 'message 2',
          timestamp: new Date()
        }
      ]
      mockMessages.push(...session1Messages)
      
      // Get messages for first session
      const response1 = await request(app)
        .get('/api/messages')
        .expect(200)
      
      expect(response1.body.messages).toHaveLength(1)
      expect(response1.body.messages[0].content).toBe('message 1')
      expect(response1.body.messages[0].sessionId).toBe('test-session')

      // Switch session and verify
      app.use((req, _res, next) => {
        req.session.id = 'test-session-2'
        next()
      })

      const response2 = await request(app)
        .get('/api/messages')
        .expect(200)
      
      expect(response2.body.messages).toHaveLength(1)
      expect(response2.body.messages[0].content).toBe('message 2')
      expect(response2.body.messages[0].sessionId).toBe('test-session-2')
    })

    it('handles storage errors', async () => {
      vi.mocked(storage.getMessages).mockRejectedValueOnce(new Error('Storage error'))
      
      const response = await request(app)
        .get('/api/messages')
        .expect(500)
      
      expect(response.body).toEqual({ message: '获取消息失败' })
    })
  })
})
