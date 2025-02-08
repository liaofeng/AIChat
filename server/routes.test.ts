import { vi } from 'vitest'
import type { Message } from '@shared/schema'

const mockMessages: Message[] = []
const mockStorage = {
  getMessages: vi.fn().mockImplementation((sessionId: string) => 
    Promise.resolve(mockMessages.filter(msg => msg.sessionId === sessionId))
  ),
  createMessage: vi.fn().mockImplementation((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      id: mockMessages.length + 1,
      timestamp: new Date(),
      ...msg
    }
    mockMessages.push(newMessage)
    return Promise.resolve(newMessage)
  })
}

vi.mock('./storage', () => ({
  storage: mockStorage
}))

import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { registerRoutes } from './routes'
import * as deepseek from './deepseek'
import session from 'express-session'

describe('routes', () => {
  let app: express.Express
  let mockStorage: any

  beforeEach(() => {
    app = express()
    // Setup session middleware for testing
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true,
      name: 'test-session'
    }))
    app.use(express.json())
    app.use((req, res, next) => {
      req.session.id = 'test-session'
      next()
    })
    registerRoutes(app)
    
    // Reset mocks and storage
    vi.clearAllMocks()
    mockMessages.length = 0 // Clear the messages array
    mockStorage.getMessages.mockClear()
    mockStorage.createMessage.mockClear()
  })

  describe('POST /api/chat', () => {
    it('handles valid chat messages', async () => {
      vi.spyOn(deepseek, 'getChatCompletion').mockResolvedValue('AI response')
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' })
        .expect(200)
      
      expect(response.body.messages).toBeDefined()
      expect(response.body.messages).toHaveLength(2)
      expect(response.body.messages[0]).toMatchObject({
        content: 'test message',
        role: 'user'
      })
      expect(response.body.messages[1]).toMatchObject({
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
      vi.spyOn(deepseek, 'getChatCompletion').mockRejectedValue(new Error('API Error'))
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' })
        .expect(200)
      
      expect(response.body.messages[1].content).toContain('API')
      expect(response.body.messages[1].role).toBe('assistant')
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
      mockStorage.getMessages.mockResolvedValueOnce([testMessage])
      
      const response = await request(app)
        .get('/api/messages')
        .expect(200)
      
      expect(Array.isArray(response.body.messages)).toBe(true)
      expect(response.body.messages).toHaveLength(1)
      expect(response.body.messages[0].content).toBe('test message')
    })

    it('handles storage errors', async () => {
      // Mock storage.getMessages to throw
      mockStorage.getMessages.mockRejectedValueOnce(new Error('Storage error'))
      
      const response = await request(app)
        .get('/api/messages')
        .expect(500)
      
      expect(response.body.message).toBe('获取消息失败')
    })
  })
})
