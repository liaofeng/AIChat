import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getChatCompletion } from './deepseek'
import { unified, type UUnifiedResponse } from 'unified-llm'

describe('getChatCompletion', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-key')
  })

  it('handles successful responses', async () => {
    vi.spyOn(unified, 'create').mockResolvedValue({ completion: '测试回复' } as UUnifiedResponse)
    
    const response = await getChatCompletion([
      { role: 'user', content: 'hello' }
    ])
    
    expect(response).toBe('测试回复')
  })

  it('handles API authentication errors', async () => {
    vi.spyOn(unified, 'create').mockRejectedValue({ status: 401 })
    
    const response = await getChatCompletion([])
    expect(response).toContain('API 密钥无效')
  })

  it('handles API rate limit errors', async () => {
    vi.spyOn(unified, 'create').mockRejectedValue({ status: 429 })
    
    const response = await getChatCompletion([])
    expect(response).toContain('API 使用配额已超限')
  })

  it('handles generic API errors', async () => {
    vi.spyOn(unified, 'create').mockRejectedValue(new Error('Unknown error'))
    
    const response = await getChatCompletion([])
    expect(response).toContain('AI 服务暂时出现问题')
  })

  it('sets correct parameters for API call', async () => {
    const createSpy = vi.spyOn(unified, 'create').mockResolvedValue({ completion: '测试回复' } as UUnifiedResponse)
    
    await getChatCompletion([
      { role: 'user', content: 'hello' }
    ])
    
    const params = createSpy.mock.calls[0][0]
    expect(params.model_provider).toBe('deepseek')
    expect(params.model_name).toBe('deepseek-chat')
    expect(params.api_key).toBe('test-key')
    expect(params.system_messages[0].content).toContain('助手')
  })
})
