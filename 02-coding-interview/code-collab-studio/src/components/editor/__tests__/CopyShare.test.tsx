import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SessionProvider, useSession } from '@/contexts/SessionContext';
import type { SupportedLanguage } from '@/types/session';

describe('Copy/Share - Session ID Persistence', () => {
  it('should return a session with a valid ID after creation', async () => {
    let sessionResult: any = null;
    
    const { result } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    await act(async () => {
      sessionResult = await result.current.createNewSession('Test Session', 'javascript' as SupportedLanguage);
    });

    expect(sessionResult).toBeDefined();
    expect(sessionResult.id).toBeDefined();
    expect(typeof sessionResult.id).toBe('string');
    expect(sessionResult.id.length).toBeGreaterThan(0);
    expect(sessionResult.name).toBe('Test Session');
  });

  it('should have currentSession populated with ID after creation', async () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    await act(async () => {
      await result.current.createNewSession('Session with ID', 'javascript' as SupportedLanguage);
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

    let session1: any;
    let session2: any;

    await act(async () => {
      session1 = await result1.current.createNewSession('Session 1', 'javascript' as SupportedLanguage);
    });

    await act(async () => {
      session2 = await result2.current.createNewSession('Session 2', 'python' as SupportedLanguage);
    });

    expect(session1.id).not.toBe(session2.id);
  });

  it('should be able to construct a valid share URL', async () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });

    await act(async () => {
      await result.current.createNewSession('Shareable Session', 'javascript' as SupportedLanguage);
    });

    const sessionId = result.current.currentSession?.id;
    expect(sessionId).toBeDefined();

    // Simulate URL construction like in EditorToolbar
    const shareUrl = `http://localhost/session/${sessionId}`;
    expect(shareUrl).toMatch(/^http:\/\/localhost\/session\/[a-f0-9-]+$/);
  });
});
