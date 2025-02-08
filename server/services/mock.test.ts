import { describe, it, expect, beforeEach } from 'vitest';
import { MockService } from './mock';

describe('MockService', () => {
  let mockService: MockService;

  beforeEach(() => {
    mockService = new MockService();
  });

  it('handles greeting messages', async () => {
    const [_, response] = await mockService.chat('你好', 'test-session');
    expect(response.content).toContain('你好');
  });

  it('handles questions', async () => {
    const [_, response] = await mockService.chat('这个功能怎么用？', 'test-session');
    expect(response.content).toContain('问题');
  });

  it('handles short messages', async () => {
    const [_, response] = await mockService.chat('测试', 'test-session');
    expect(response.content).toContain('详细');
  });

  it('handles task requests', async () => {
    const [_, response] = await mockService.chat('请帮我查看一下', 'test-session');
    expect(response.content).toContain('帮你');
  });

  it('throws error for empty messages', async () => {
    await expect(mockService.chat('', 'test-session')).rejects.toThrow();
  });

  it('maintains message separation between sessions', async () => {
    await mockService.chat('消息1', 'session1');
    await mockService.chat('消息2', 'session2');
    
    const session1Messages = await mockService.getMessages('session1');
    const session2Messages = await mockService.getMessages('session2');

    expect(session1Messages).toHaveLength(2);
    expect(session2Messages).toHaveLength(2);
    expect(session1Messages[0].content).toBe('消息1');
    expect(session2Messages[0].content).toBe('消息2');
  });
});
