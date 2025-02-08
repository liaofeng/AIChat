import { vi } from 'vitest'

vi.mock('./storage', () => ({
  storage: {
    getMessages: vi.fn(),
    createMessage: vi.fn()
  }
}))

vi.mock('./deepseek', () => ({
  getChatCompletion: vi.fn()
}))

import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { registerRoutes } from './routes'
import { storage } from './storage'
import { getChatCompletion } from './deepseek'
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
    
    vi.mocked(getChatCompletion).mockResolvedValue('AI response')
  })

  describe('POST /api/chat', () => {
    it('handles valid chat messages', async () => {
      vi.mocked(getChatCompletion).mockResolvedValue('AI response')
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' })
        .expect(200)
      
      const { messages } = response.body
      expect(messages).toBeDefined()
      expect(messages).toHaveLength(2)
      expect(messages[0]).toMatchObject({
        content: 'test message',
        role: 'user'
      })
      expect(messages[1]).toMatchObject({
        content: 'AI response',
        role: 'assistant'
      })
    })

    it('handles invalid messages', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' })
      
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('消息格式无效')
    })

    it('handles AI service errors', async () => {
      vi.mocked(getChatCompletion).mockRejectedValue(new Error('API Error'))
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' })
        .expect(200)
      
      const { messages } = response.body
      expect(messages[1].content).toBe('抱歉，AI服务暂时不可用，请检查API密钥是否正确设置。')
      expect(messages[1].role).toBe('assistant')
    })
  })

  describe('GET /api/messages', () => {
    it('retrieves messages for session', async () => {
      // Add some test messages first
      const testMessage = {
        id: 1,
        sessionId: 'test-session',
        role: 'user',
        content: 'test message',
        timestamp: new Date()
      }
      mockMessages.push(testMessage)
      vi.mocked(storage.getMessages).mockResolvedValueOnce([testMessage])
      
      const response = await request(app)
        .get('/api/messages')
        .expect(200)
      
      expect(Array.isArray(response.body.messages)).toBe(true)
      expect(response.body.messages).toHaveLength(1)
      expect(response.body.messages[0].content).toBe('test message')
    })

    it('handles storage errors', async () => {
      // Mock storage.getMessages to throw
      vi.mocked(storage.getMessages).mockRejectedValueOnce(new Error('Storage error'))
      
      const response = await request(app)
        .get('/api/messages')
        .expect(500)
      
      expect(response.body).toEqual({ message: '获取消息失败' })
    })
  })
})
