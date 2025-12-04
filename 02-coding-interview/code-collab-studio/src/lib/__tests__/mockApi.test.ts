import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as mockApi from '@/lib/mockApi';
import { DEFAULT_CODE } from '@/types/session';
import type { SupportedLanguage } from '@/types/session';

describe('mockApi', () => {
  describe('generateUser', () => {
    it('generates a unique user with required fields', () => {
      const user = mockApi.generateUser();
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.color).toBeDefined();
      expect(user.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('accepts optional name parameter', () => {
      const user = mockApi.generateUser('Alice');
      expect(user.name).toBe('Alice');
    });
  });

  describe('createSession', () => {
    it('creates a session with initial owner', async () => {
      const owner = mockApi.generateUser('Alice');
      const session = await mockApi.createSession('Test Session', 'javascript', owner);

      expect(session.id).toBeDefined();
      expect(session.name).toBe('Test Session');
      expect(session.language).toBe('javascript');
      expect(session.owner).toEqual(owner);
      expect(session.participants).toContain(owner);
    });

    it('sets code to default template for language', async () => {
      const owner = mockApi.generateUser();
      const session = await mockApi.createSession('Test', 'python', owner);

      expect(session.code).toBe(DEFAULT_CODE.python);
    });

    it('includes creation timestamp', async () => {
      const owner = mockApi.generateUser();
      const session = await mockApi.createSession('Test', 'javascript', owner);

      expect(session.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('joinSession', () => {
    it('adds user to session participants', async () => {
      const owner = mockApi.generateUser('Alice');
      const user2 = mockApi.generateUser('Bob');

      const session = await mockApi.createSession('Test', 'javascript', owner);
      const updatedSession = await mockApi.joinSession(session.id, user2);

      expect(updatedSession?.participants).toContain(user2);
    });

    it('returns null for non-existent session', async () => {
      const user = mockApi.generateUser();
      const session = await mockApi.joinSession('non-existent-id', user);

      expect(session).toBeNull();
    });

    it('does not duplicate user when joining twice', async () => {
      const owner = mockApi.generateUser('Alice');
      const session1 = await mockApi.createSession('Test', 'javascript', owner);

      const joined1 = await mockApi.joinSession(session1.id, owner);
      const initialCount = joined1?.participants.length || 0;

      const joined2 = await mockApi.joinSession(session1.id, owner);
      const finalCount = joined2?.participants.length || 0;

      expect(finalCount).toBe(initialCount);
    });
  });

  describe('executeCode', () => {
    it('executes JavaScript code and returns output', async () => {
      const result = await mockApi.executeCode("console.log('hello')", 'javascript');

      expect(result.output).toContain('hello');
      expect(result.error).toBeUndefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('captures console.log output', async () => {
      const result = await mockApi.executeCode('console.log("test123")', 'javascript');

      expect(result.output).toContain('test123');
    });

    it('captures console.error as output', async () => {
      const result = await mockApi.executeCode('console.error("error msg")', 'javascript');

      expect(result.output).toContain('Error:');
      expect(result.output).toContain('error msg');
    });

    it('returns error for invalid JavaScript', async () => {
      const result = await mockApi.executeCode('console.log(', 'javascript');

      expect(result.error).toBeDefined();
      expect(result.output).toBe('');
    });

    it('returns execution time', async () => {
      const result = await mockApi.executeCode('1 + 1', 'javascript');

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.executionTime).toBe('number');
    });

    it('handles non-JavaScript languages with mock output', async () => {
      const result = await mockApi.executeCode('print("hello")', 'python');

      expect(result.output).toContain('[Mock execution for python]');
      expect(result.error).toBeUndefined();
    });
  });

  describe('updateSessionCode', () => {
    it('updates code for existing session', async () => {
      const owner = mockApi.generateUser();
      const session = await mockApi.createSession('Test', 'javascript', owner);

      const success = await mockApi.updateSessionCode(session.id, 'console.log("new")');

      expect(success).toBe(true);

      const updated = await mockApi.getSession(session.id);
      expect(updated?.code).toBe('console.log("new")');
    });

    it('returns false for non-existent session', async () => {
      const success = await mockApi.updateSessionCode('non-existent', 'code');

      expect(success).toBe(false);
    });
  });

  describe('updateSessionLanguage', () => {
    it('updates language and resets code to template', async () => {
      const owner = mockApi.generateUser();
      const session = await mockApi.createSession('Test', 'javascript', owner);

      await mockApi.updateSessionLanguage(session.id, 'python');

      const updated = await mockApi.getSession(session.id);
      expect(updated?.language).toBe('python');
      expect(updated?.code).toBe(DEFAULT_CODE.python);
    });

    it('returns false for non-existent session', async () => {
      const success = await mockApi.updateSessionLanguage('non-existent', 'python');

      expect(success).toBe(false);
    });
  });

  describe('leaveSession', () => {
    it('removes user from session participants', async () => {
      const owner = mockApi.generateUser('Alice');
      const user2 = mockApi.generateUser('Bob');

      const session = await mockApi.createSession('Test', 'javascript', owner);
      await mockApi.joinSession(session.id, user2);

      await mockApi.leaveSession(session.id, user2.id);

      const updated = await mockApi.getSession(session.id);
      expect(updated?.participants.find(p => p.id === user2.id)).toBeUndefined();
    });

    it('handles leaving non-existent session gracefully', async () => {
      expect(async () => {
        await mockApi.leaveSession('non-existent', 'user-id');
      }).not.toThrow();
    });
  });

  describe('listSessions', () => {
    it('returns all created sessions', async () => {
      const owner1 = mockApi.generateUser('Alice');
      const owner2 = mockApi.generateUser('Bob');

      await mockApi.createSession('Session 1', 'javascript', owner1);
      await mockApi.createSession('Session 2', 'python', owner2);

      const sessions = await mockApi.listSessions();

      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('sorts sessions by creation date descending', async () => {
      const owner = mockApi.generateUser();

      const session1 = await mockApi.createSession('Session 1', 'javascript', owner);
      await new Promise(resolve => setTimeout(resolve, 10));
      const session2 = await mockApi.createSession('Session 2', 'python', owner);

      const sessions = await mockApi.listSessions();
      const recentSession = sessions[0];

      expect(recentSession.id).toBe(session2.id);
    });
  });
});
