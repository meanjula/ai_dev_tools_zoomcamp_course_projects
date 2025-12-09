/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Session, User, SupportedLanguage } from '@/types/session';
import * as api from '@/lib/mockApi';

interface SessionContextType {
  currentUser: User;
  currentSession: Session | null;
  isLoading: boolean;
  createNewSession: (name: string, language: SupportedLanguage) => Promise<Session>;
  joinExistingSession: (sessionId: string) => Promise<Session | null>;
  updateCode: (code: string) => void;
  updateLanguage: (language: SupportedLanguage) => Promise<void>;
  leaveCurrentSession: () => void;
  code: string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');

  // Initialize user from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const user = await api.generateUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('[SessionContext] generateUser failed, falling back to local user', err);
        // Fallback local user so the UI remains usable when backend is unavailable
        setCurrentUser({ id: uuidv4(), name: 'Local User', color: '#0ea5e9' } as unknown as User);
      }
    })();
  }, []);

  const createNewSession = useCallback(async (name: string, language: SupportedLanguage) => {
    if (!currentUser) return null as unknown as Session;
    setIsLoading(true);
    try {
      const session = await api.createSession(name, language, currentUser);
      console.log('[SessionContext] createNewSession result:', { id: session.id, name: session.name });
      setCurrentSession(session);
      setCode(session.code);
      return session;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const joinExistingSession = useCallback(async (sessionId: string) => {
    if (!currentUser) return null;
    setIsLoading(true);
    try {
      const session = await api.joinSession(sessionId, currentUser);
      if (session) {
        setCurrentSession(session);
        setCode(session.code);
      }
      return session;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    if (currentSession && currentUser) {
      api.updateSessionCode(currentSession.id, newCode, currentUser.id);
    }
  }, [currentSession, currentUser]);

  const updateLanguage = useCallback(async (language: SupportedLanguage) => {
    if (currentSession) {
      await api.updateSessionLanguage(currentSession.id, language);
      const updatedSession = await api.getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);
        setCode(updatedSession.code);
      }
    }
  }, [currentSession]);

  const leaveCurrentSession = useCallback(() => {
    if (currentSession && currentUser) {
      api.leaveSession(currentSession.id, currentUser.id);
      setCurrentSession(null);
      setCode('');
    }
  }, [currentSession, currentUser]);

  // Simulate real-time updates from other users
  useEffect(() => {
    if (!currentSession) return;
    
    const interval = setInterval(() => {
      // Mock cursor position updates for demo
      setCurrentSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map(p => {
            if (p.id === currentUser.id) return p;
            return {
              ...p,
              cursor: {
                line: Math.floor(Math.random() * 10) + 1,
                column: Math.floor(Math.random() * 20) + 1,
              }
            };
          })
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentSession, currentUser]);

  if (!currentUser) {
    return (
      <SessionContext.Provider value={{
        currentUser: {} as User,
        currentSession: null,
        isLoading: true,
        createNewSession: async () => null as unknown as Session,
        joinExistingSession: async () => null,
        updateCode: () => {},
        updateLanguage: async () => {},
        leaveCurrentSession: () => {},
        code: '',
      }}>
        {children}
      </SessionContext.Provider>
    );
  }

  return (
    <SessionContext.Provider value={{
      currentUser,
      currentSession,
      isLoading,
      createNewSession,
      joinExistingSession,
      updateCode,
      updateLanguage,
      leaveCurrentSession,
      code,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
