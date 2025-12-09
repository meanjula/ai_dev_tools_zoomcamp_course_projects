import { v4 as uuidv4 } from 'uuid';
import type { Session, User, ExecutionResult, SupportedLanguage } from '@/types/session';
import { DEFAULT_CODE } from '@/types/session';

// Backend API URL from environment or default to host backend URL.
// When running the static frontend served from Docker without an nginx proxy,
// using the host backend URL makes the browser requests reach the backend
// at `http://localhost:3000/api`. You can override this at build time with
// `VITE_API_URL`.
const API_URL = import.meta.env.VITE_API_URL;

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  // Helpful debug when API_URL was missing at build time
  if (!import.meta.env.VITE_API_URL) {
    console.warn('[mockApi] VITE_API_URL is not set; using', API_URL, 'for', endpoint);
  }
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Generate random user
export const generateUser = async (name?: string): Promise<User> => {
  const userName = name || `User-${Math.random().toString(36).substring(2, 6)}`;
  return apiCall('/users', {
    method: 'POST',
    body: JSON.stringify({ name: userName }),
  });
};

// Create a new session
export const createSession = async (
  name: string,
  language: SupportedLanguage,
  user: User
): Promise<Session> => {
  const session: Session = await apiCall('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      name,
      language,
      userId: user.id,
    }),
  });
  
  console.log('[api] Created session:', { id: session.id, name: session.name });
  return session;
};

// Join an existing session
export const joinSession = async (sessionId: string, user: User): Promise<Session | null> => {
  try {
    return await apiCall(`/sessions/${sessionId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId: user.id }),
    });
  } catch {
    return null;
  }
};

// Get session by ID
export const getSession = async (sessionId: string): Promise<Session | null> => {
  try {
    return await apiCall(`/sessions/${sessionId}`);
  } catch {
    return null;
  }
};

// Update session code
export const updateSessionCode = async (
  sessionId: string,
  code: string,
  userId: string
): Promise<boolean> => {
  try {
    await apiCall(`/sessions/${sessionId}/code`, {
      method: 'PUT',
      body: JSON.stringify({ code, userId }),
    });
    return true;
  } catch (error) {
    console.error('Error updating code:', error);
    return false;
  }
};

// Update session language
export const updateSessionLanguage = async (
  sessionId: string,
  language: SupportedLanguage
): Promise<boolean> => {
  try {
    await apiCall(`/sessions/${sessionId}/language`, {
      method: 'PUT',
      body: JSON.stringify({ language }),
    });
    return true;
  } catch (error) {
    console.error('Error updating language:', error);
    return false;
  }
};

// Leave session
export const leaveSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    await apiCall(`/sessions/${sessionId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  } catch (error) {
    console.error('Error leaving session:', error);
  }
};

// Execute code
export const executeCode = async (
  code: string,
  language: SupportedLanguage
): Promise<ExecutionResult> => {
  const startTime = performance.now();
  
  try {
    const result: ExecutionResult = await apiCall('/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
    
    return {
      output: result.output || '',
      error: result.error,
      executionTime: performance.now() - startTime,
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Execution failed',
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
  try {
    const result: { sessions: Session[] } = await apiCall('/sessions?limit=50&offset=0');
    return result.sessions || [];
  } catch {
    return [];
  }
};
