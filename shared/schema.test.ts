import { describe, it, expect } from 'vitest'
import { chatSchema, insertMessageSchema } from './schema'

describe('chatSchema', () => {
  it('validates valid messages', () => {
    expect(() => chatSchema.parse({ message: 'test' })).not.toThrow()
  })

  it('rejects empty messages', () => {
    expect(() => chatSchema.parse({ message: '' })).toThrow()
  })

  it('rejects long messages', () => {
    expect(() => chatSchema.parse({ message: 'a'.repeat(2001) })).toThrow()
  })
})

describe('insertMessageSchema', () => {
  it('validates valid message data', () => {
    expect(() => insertMessageSchema.parse({
      sessionId: 'test-session',
      role: 'user',
      content: 'test message'
    })).not.toThrow()
  })

  it('rejects missing required fields', () => {
    expect(() => insertMessageSchema.parse({
      sessionId: 'test-session',
      role: 'user'
    })).toThrow()
  })

  it('rejects invalid role', () => {
    expect(() => insertMessageSchema.parse({
      sessionId: 'test-session',
      role: 'invalid' as any,
      content: 'test message'
    })).toThrow('Invalid enum value. Expected \'user\' | \'assistant\', received \'invalid\'')
  })
})
