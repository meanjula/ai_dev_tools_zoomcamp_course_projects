import { v4 as uuidv4 } from 'uuid';
import type { Session, User, ExecutionResult, SupportedLanguage } from '@/types/session';
import { DEFAULT_CODE } from '@/types/session';

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user colors
const USER_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
];

// Mock sessions storage
let sessions: Map<string, Session> = new Map();

// Generate random user
export const generateUser = (name?: string): User => ({
  id: uuidv4(),
  name: name || `User-${Math.random().toString(36).substring(2, 6)}`,
  color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
});

// Create a new session
export const createSession = async (
  name: string,
  language: SupportedLanguage,
  owner: User
): Promise<Session> => {
  await delay(300);
  
  const session: Session = {
    id: uuidv4(),
    name,
    language,
    code: DEFAULT_CODE[language],
    createdAt: new Date(),
    owner,
    participants: [owner],
  };
  
  sessions.set(session.id, session);
  return session;
};

// Join an existing session
export const joinSession = async (sessionId: string, user: User): Promise<Session | null> => {
  await delay(200);
  
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  // Add user if not already in session
  if (!session.participants.find(p => p.id === user.id)) {
    session.participants.push(user);
  }
  
  return session;
};

// Get session by ID
export const getSession = async (sessionId: string): Promise<Session | null> => {
  await delay(100);
  return sessions.get(sessionId) || null;
};

// Update session code
export const updateSessionCode = async (sessionId: string, code: string): Promise<boolean> => {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  session.code = code;
  return true;
};

// Update session language
export const updateSessionLanguage = async (
  sessionId: string, 
  language: SupportedLanguage
): Promise<boolean> => {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  session.language = language;
  session.code = DEFAULT_CODE[language];
  return true;
};

// Leave session
export const leaveSession = async (sessionId: string, userId: string): Promise<void> => {
  await delay(100);
  
  const session = sessions.get(sessionId);
  if (session) {
    session.participants = session.participants.filter(p => p.id !== userId);
  }
};

// Execute code (mock execution)
export const executeCode = async (
  code: string, 
  language: SupportedLanguage
): Promise<ExecutionResult> => {
  await delay(500);
  
  const startTime = performance.now();
  
  try {
    if (language === 'javascript' || language === 'typescript') {
      // Safe evaluation using Function constructor
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        error: (...args: unknown[]) => logs.push(`Error: ${args.map(String).join(' ')}`),
        warn: (...args: unknown[]) => logs.push(`Warning: ${args.map(String).join(' ')}`),
      };
      
      const fn = new Function('console', code);
      fn(mockConsole);
      
      return {
        output: logs.join('\n') || '(No output)',
        executionTime: performance.now() - startTime,
      };
    }
    
    // Mock output for other languages
    return {
      output: `[Mock execution for ${language}]\n\nCode received (${code.length} characters)\nNote: Full execution requires backend integration.`,
      executionTime: performance.now() - startTime,
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: performance.now() - startTime,
    };
  }
};

// Get mock collaborators for demo
export const getMockCollaborators = (): User[] => [
  { id: '1', name: 'Alice Chen', color: '#10b981', cursor: { line: 5, column: 12 } },
  { id: '2', name: 'Bob Smith', color: '#f59e0b', cursor: { line: 8, column: 3 } },
];

// List recent sessions
export const listSessions = async (): Promise<Session[]> => {
  await delay(200);
  return Array.from(sessions.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
};
