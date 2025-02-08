import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { registerRoutes } from './routes'
import { MockStorage } from '../test/utils'
import * as deepseek from './deepseek'
import session from 'express-session'
import { storage } from './storage'

// Mock the storage module
vi.mock('./storage', () => ({
  storage: new MockStorage()
}))

describe('routes', () => {
  let app: express.Express

  beforeEach(() => {
    app = express()
    // Setup session middleware for testing
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }))
    app.use(express.json())
    registerRoutes(app)
    
    // Reset mocks
    vi.restoreAllMocks()
  })

  describe('POST /api/chat', () => {
    it('handles valid chat messages', async () => {
      vi.spyOn(deepseek, 'getChatCompletion').mockResolvedValue('AI response')
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' })
      
      expect(response.status).toBe(200)
      expect(response.body.messages).toHaveLength(2)
      expect(response.body.messages[0].content).toBe('test message')
      expect(response.body.messages[1].content).toBe('AI response')
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
      
      expect(response.status).toBe(200)
      expect(response.body.messages[1].content).toContain('API')
    })
  })

  describe('GET /api/messages', () => {
    it('retrieves messages for session', async () => {
      const response = await request(app)
        .get('/api/messages')
      
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.messages)).toBe(true)
    })

    it('handles storage errors', async () => {
      // Mock storage.getMessages to throw
      vi.spyOn(MockStorage.prototype, 'getMessages').mockRejectedValue(new Error('Storage error'))
      
      const response = await request(app)
        .get('/api/messages')
      
      expect(response.status).toBe(500)
      expect(response.body.message).toBe('获取消息失败')
    })
  })
})
