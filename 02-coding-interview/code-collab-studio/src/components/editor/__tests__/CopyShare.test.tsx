import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SessionProvider, useSession } from '@/contexts/SessionContext';
import type { SupportedLanguage, Session } from '@/types/session';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Copy/Share - Session ID Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let callCount = 0;
    
    // Setup mock fetch to return appropriate responses based on endpoint
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      callCount++;
      const method = options?.method || 'GET';
      
      // Mock user creation
      if (url.includes('/users') && method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: `user-${callCount}`,
            name: 'Test User',
            color: '#0ea5e9',
            created_at: new Date().toISOString(),
          }),
        });
      }
      
      // Mock session creation
      if (url.includes('/sessions') && method === 'POST') {
        const body = JSON.parse(options?.body as string);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: `session-${callCount}`,
            name: body.name || 'Test Session',
            language: body.language || 'javascript',
            code: "console.log('Hello');",
            owner: { id: `user-${callCount - 1}`, name: 'Test User', color: '#0ea5e9' },
            participants: [{ id: `user-${callCount - 1}`, name: 'Test User', color: '#0ea5e9' }],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      }
      
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('should return a session with a valid ID after creation', async () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    // Wait for user initialization
    await waitFor(() => {
      expect(result.current.currentUser).toBeDefined();
    }, { timeout: 1000 });

    let sessionResult: Session | null = null;
    await act(async () => {
      sessionResult = await result.current.createNewSession(
        'Test Session',
        'javascript' as SupportedLanguage
      );
    });

    expect(sessionResult).toBeDefined();
    expect(sessionResult?.id).toBeDefined();
    expect(typeof sessionResult?.id).toBe('string');
    expect((sessionResult?.id ?? '').length).toBeGreaterThan(0);
    expect(sessionResult?.name).toBe('Test Session');
  });

  it('should have currentSession populated with ID after creation', async () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    // Wait for user initialization
    await waitFor(() => {
      expect(result.current.currentUser).toBeDefined();
    }, { timeout: 1000 });

    await act(async () => {
      await result.current.createNewSession(
        'Session with ID',
        'javascript' as SupportedLanguage
      );
    });

    expect(result.current.currentSession).toBeDefined();
    expect(result.current.currentSession?.id).toBeDefined();
    expect(typeof result.current.currentSession?.id).toBe('string');
  });

  it('should generate different IDs for different sessions', async () => {
    const { result: result1 } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    const { result: result2 } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    // Wait for users to initialize
    await waitFor(() => {
      expect(result1.current.currentUser).toBeDefined();
      expect(result2.current.currentUser).toBeDefined();
    }, { timeout: 1000 });

    let session1: Session | null = null;
    let session2: Session | null = null;

    await act(async () => {
      session1 = await result1.current.createNewSession(
        'Session 1',
        'javascript' as SupportedLanguage
      );
    });

    await act(async () => {
      session2 = await result2.current.createNewSession(
        'Session 2',
        'python' as SupportedLanguage
      );
    });

    expect(session1?.id).toBeDefined();
    expect(session2?.id).toBeDefined();
    expect(session1?.id).not.toBe(session2?.id);
  });

  it('should be able to construct a valid share URL', async () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    // Wait for user initialization
    await waitFor(() => {
      expect(result.current.currentUser).toBeDefined();
    }, { timeout: 1000 });

    await act(async () => {
      await result.current.createNewSession(
        'Shareable Session',
        'javascript' as SupportedLanguage
      );
    });

    const sessionId = result.current.currentSession?.id;
    expect(sessionId).toBeDefined();

    // Simulate URL construction like in EditorToolbar
    const shareUrl = `http://localhost/session/${sessionId}`;
    expect(shareUrl).toMatch(/^http:\/\/localhost\/session\/session-\d+$/);
  });
});
