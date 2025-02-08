import { renderHook, act } from '@testing-library/react';
import { useSessions } from '../hooks/use-sessions';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useSessions', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('should create initial session on mount', () => {
    const { result } = renderHook(() => useSessions());
    
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.currentSessionId).toBe(result.current.sessions[0].id);
    expect(result.current.sessions[0].name).toBe('新会话 1');
  });

  it('should create new session', () => {
    const { result } = renderHook(() => useSessions());

    act(() => {
      const newSession = result.current.createSession();
      result.current.setCurrentSessionId(newSession.id);
    });

    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.sessions[0].name).toBe('新会话 2');
  });

  it('should throw error when creating more than 10 sessions', () => {
    const { result } = renderHook(() => useSessions());

    // Create 9 more sessions (we already have 1)
    for (let i = 0; i < 9; i++) {
      act(() => {
        result.current.createSession();
      });
    }

    expect(result.current.sessions).toHaveLength(10);
    expect(() => act(() => result.current.createSession())).toThrow('已达到最大会话数量限制');
  });

  it('should delete session and switch to newest', () => {
    const { result } = renderHook(() => useSessions());

    // Create another session
    act(() => {
      const newSession = result.current.createSession();
      result.current.setCurrentSessionId(newSession.id);
    });

    const currentId = result.current.currentSessionId;
    act(() => {
      result.current.deleteSession(currentId!);
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.currentSessionId).toBe(result.current.sessions[0].id);
  });

  it('should persist sessions in localStorage', () => {
    const { result, rerender } = renderHook(() => useSessions());

    // Create a new session
    act(() => {
      const newSession = result.current.createSession();
      result.current.setCurrentSessionId(newSession.id);
    });

    // Get stored data
    const stored = JSON.parse(localStorage.getItem('chat_sessions')!);
    expect(stored.sessions).toHaveLength(2);
    expect(stored.currentSessionId).toBe(result.current.currentSessionId);

    // Clear hook state and rerender
    mockLocalStorage.clear();
    rerender();

    // Verify sessions are loaded from localStorage
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].name).toBe('新会话 1');
  });
});
