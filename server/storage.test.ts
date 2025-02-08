import { describe, it, expect, beforeEach } from 'vitest'
import { MemStorage } from './storage'
import type { Message } from '@shared/schema'

describe('MemStorage', () => {
  let storage: MemStorage

  beforeEach(() => {
    storage = new MemStorage()
  })

  it('creates and retrieves messages', async () => {
    const message = await storage.createMessage({
      sessionId: 'test',
      role: 'user',
      content: 'hello'
    })

    const messages = await storage.getMessages('test')
    expect(messages).toHaveLength(1)
    expect(messages[0]).toEqual(message)
  })

  it('filters messages by sessionId', async () => {
    await storage.createMessage({
      sessionId: 'session1',
      role: 'user',
      content: 'hello from session 1'
    })
    
    await storage.createMessage({
      sessionId: 'session2',
      role: 'user',
      content: 'hello from session 2'
    })

    const session1Messages = await storage.getMessages('session1')
    const session2Messages = await storage.getMessages('session2')
    
    expect(session1Messages).toHaveLength(1)
    expect(session2Messages).toHaveLength(1)
    expect(session1Messages[0].content).toBe('hello from session 1')
    expect(session2Messages[0].content).toBe('hello from session 2')
  })

  it('generates incremental ids', async () => {
    const message1 = await storage.createMessage({
      sessionId: 'test',
      role: 'user',
      content: 'first'
    })

    const message2 = await storage.createMessage({
      sessionId: 'test',
      role: 'assistant',
      content: 'second'
    })

    expect(message2.id).toBe(message1.id + 1)
  })
})
