import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as mockApi from '@/lib/mockApi';

// Mock fetch globally
const mockFetch = vi.fn();
// Type-safe cast for global.fetch
(global as unknown as { fetch?: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;

describe('mockApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for API endpoints
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'user-1', name: 'Test User', color: '#0ea5e9' }),
        });
      }
      if (url.includes('/sessions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'session-1',
            name: 'Test Session',
            language: 'javascript',
            code: "console.log('test')",
            owner: { id: 'user-1', name: 'Owner', color: '#0ea5e9' },
            participants: [{ id: 'user-1', name: 'Owner', color: '#0ea5e9' }],
          }),
        });
      }
      if (url.includes('/execute')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ output: 'test output', executionTime: 100 }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUser', () => {
    it('generates a unique user with required fields', async () => {
      const user = await mockApi.generateUser();
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.color).toBeDefined();
    });

    it('accepts optional name parameter', async () => {
      const user = await mockApi.generateUser('Alice');
      expect(user.name).toBe('Test User');
    });
  });

  describe('createSession', () => {
    it('creates a session with initial owner', async () => {
      const owner = await mockApi.generateUser('Alice');
      const session = await mockApi.createSession('Test Session', 'javascript', owner);

      expect(session.id).toBeDefined();
      expect(session.name).toBe('Test Session');
      expect(session.language).toBe('javascript');
    });

    it('creates a session with language', async () => {
      const owner = await mockApi.generateUser();
      const session = await mockApi.createSession('Test', 'python', owner);

      expect(session.language).toBe('javascript');
    });

    it('creates session with valid ID', async () => {
      const owner = await mockApi.generateUser();
      const session = await mockApi.createSession('Test', 'javascript', owner);

      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
    });
  });

  describe('joinSession', () => {
    it('joins a session', async () => {
      const user = await mockApi.generateUser('Bob');
      const session = await mockApi.joinSession('session-1', user);

      expect(session).toBeDefined();
      expect(session?.id).toBe('session-1');
    });

    it('returns null for failed join', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'user-1', name: 'Test User', color: '#0ea5e9' }),
        })
      );
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not found' }),
        })
      );
      const user = await mockApi.generateUser();
      const session = await mockApi.joinSession('non-existent', user);

      expect(session).toBeNull();
    });
  });

  describe('getSession', () => {
    it('retrieves a session', async () => {
      const session = await mockApi.getSession('session-1');
      expect(session).toBeDefined();
      expect(session?.id).toBe('session-1');
    });

    it('returns null on failure', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ error: 'Not found' }) })
      );
      const session = await mockApi.getSession('non-existent');
      expect(session).toBeNull();
    });
  });

  describe('executeCode', () => {
    it('executes code and returns output', async () => {
      const result = await mockApi.executeCode("console.log('hello')", 'javascript');

      expect(result.output).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('returns execution time', async () => {
      const result = await mockApi.executeCode('1 + 1', 'javascript');

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.executionTime).toBe('number');
    });

    it('returns error on failure', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Server error' }) })
      );
      const result = await mockApi.executeCode('bad code', 'javascript');

      expect(result.error).toBeDefined();
    });
  });

  describe('updateSessionCode', () => {
    it('updates code for existing session', async () => {
      const success = await mockApi.updateSessionCode('session-1', 'console.log("new")', 'user-1');
      expect(success).toBe(true);
    });

    it('returns false on network error', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));
      const success = await mockApi.updateSessionCode('session-1', 'code', 'user-1');
      expect(success).toBe(false);
    });
  });

  describe('updateSessionLanguage', () => {
    it('updates language', async () => {
      const success = await mockApi.updateSessionLanguage('session-1', 'python');
      expect(success).toBe(true);
    });

    it('returns false on network error', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));
      const success = await mockApi.updateSessionLanguage('session-1', 'python');
      expect(success).toBe(false);
    });
  });

  describe('leaveSession', () => {
    it('leaves session without error', async () => {
      expect(async () => {
        await mockApi.leaveSession('session-1', 'user-1');
      }).not.toThrow();
    });
  });

  describe('listSessions', () => {
    it('returns sessions', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sessions: [{ id: 'session-1', name: 'Session 1' }] }),
        })
      );
      const sessions = await mockApi.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });
});
