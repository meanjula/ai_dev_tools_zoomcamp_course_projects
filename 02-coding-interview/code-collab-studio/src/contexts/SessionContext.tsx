import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  const [currentUser] = useState<User>(() => api.generateUser());
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');

  const createNewSession = useCallback(async (name: string, language: SupportedLanguage) => {
    setIsLoading(true);
    try {
      const session = await api.createSession(name, language, currentUser);
      setCurrentSession(session);
      setCode(session.code);
      return session;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const joinExistingSession = useCallback(async (sessionId: string) => {
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
    if (currentSession) {
      api.updateSessionCode(currentSession.id, newCode);
    }
  }, [currentSession]);

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
    if (currentSession) {
      api.leaveSession(currentSession.id, currentUser.id);
      setCurrentSession(null);
      setCode('');
    }
  }, [currentSession, currentUser.id]);

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
  }, [currentSession, currentUser.id]);

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
