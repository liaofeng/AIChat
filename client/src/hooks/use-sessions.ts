import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { ChatSession, SessionStore } from '@shared/schema';

const STORAGE_KEY = 'chat_sessions';
const MAX_SESSIONS = 10;

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { sessions, currentSessionId } = JSON.parse(stored) as SessionStore;
        setSessions(sessions);
        setCurrentSessionId(currentSessionId);
      } catch (error) {
        console.error('Failed to parse stored sessions:', error);
        createInitialSession();
      }
    } else {
      createInitialSession();
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    const store: SessionStore = {
      sessions,
      currentSessionId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [sessions, currentSessionId]);

  const createInitialSession = () => {
    const initialSession = {
      id: nanoid(),
      name: '新会话 1',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
  };

  const createSession = () => {
    if (sessions.length >= MAX_SESSIONS) {
      throw new Error('已达到最大会话数量限制');
    }
    const newSession = {
      id: nanoid(),
      name: `新会话 ${sessions.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]); // Add new session at the beginning
    return newSession;
  };

  const updateSession = (id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(session => 
      session.id === id 
        ? { ...session, ...updates, updatedAt: Date.now() }
        : session
    ));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        // Switch to the newest session if current session is deleted
        setCurrentSessionId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    updateSession,
    deleteSession
  };
}
