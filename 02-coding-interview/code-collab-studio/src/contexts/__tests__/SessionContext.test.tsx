import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider, useSession } from '@/contexts/SessionContext';
import * as mockApi from '@/lib/mockApi';
import type { Session, User } from '@/types/session';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the API module
vi.mock('@/lib/mockApi');

const mockedApi = mockApi as unknown as {
  generateUser: (name?: string) => Promise<User>;
  createSession: (name: string, language: string, owner: User) => Promise<Session>;
  joinSession: (id: string, user: User) => Promise<Session | null>;
  updateSessionCode: (id: string, code: string, userId: string) => Promise<boolean>;
  updateSessionLanguage: (id: string, language: string) => Promise<boolean>;
  getSession: (id: string) => Promise<Session | null>;
  leaveSession: (id: string, userId: string) => Promise<void>;
};

const SAMPLE_USER: User = { id: 'user-1', name: 'Test User', color: '#ff0000' };
const SAMPLE_SESSION: Session = {
  id: 'session-1',
  name: 'Test Session',
  language: 'javascript',
  code: "console.log('hello')",
  createdAt: new Date(),
  owner: SAMPLE_USER,
  participants: [SAMPLE_USER],
};

function TestConsumer() {
  const {
    currentUser,
    currentSession,
    createNewSession,
    joinExistingSession,
    updateCode,
    updateLanguage,
    leaveCurrentSession,
    code,
  } = useSession();

  return (
    <div>
      <div data-testid="user-id">{currentUser?.id}</div>
      <div data-testid="session-id">{currentSession?.id || 'none'}</div>
      <div data-testid="code">{code}</div>
      <button onClick={() => createNewSession('Test Session', 'javascript')}>create</button>
      <button onClick={() => joinExistingSession('session-1')}>join</button>
      <button onClick={() => updateCode("console.log('updated')")}>updateCode</button>
      <button onClick={() => updateLanguage('python')}>updateLanguage</button>
      <button onClick={() => leaveCurrentSession()}>leave</button>
    </div>
  );
}

describe('SessionContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedApi.generateUser = vi.fn(async () => SAMPLE_USER);
    mockedApi.createSession = vi.fn(async () => SAMPLE_SESSION);
    mockedApi.joinSession = vi.fn(async () => SAMPLE_SESSION);
    mockedApi.updateSessionCode = vi.fn(async () => true);
    mockedApi.updateSessionLanguage = vi.fn(async () => true);
    mockedApi.getSession = vi.fn(async () => SAMPLE_SESSION);
    mockedApi.leaveSession = vi.fn(async () => undefined);
  });

  it('initializes user on mount', async () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('user-1'), { timeout: 2000 });
    expect(mockedApi.generateUser).toHaveBeenCalled();
  });

  it('creates a new session', async () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    // Wait for user to initialize
    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('user-1'), { timeout: 2000 });

    fireEvent.click(screen.getByText('create'));

    await waitFor(() => expect(screen.getByTestId('session-id').textContent).toBe('session-1'));
    expect(screen.getByTestId('code').textContent).toBe(SAMPLE_SESSION.code);
    expect(mockedApi.createSession).toHaveBeenCalledWith('Test Session', 'javascript', SAMPLE_USER);
  });

  it('joins an existing session', async () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('user-1'), { timeout: 2000 });

    fireEvent.click(screen.getByText('join'));

    await waitFor(() => expect(screen.getByTestId('session-id').textContent).toBe('session-1'));
    expect(mockedApi.joinSession).toHaveBeenCalledWith('session-1', SAMPLE_USER);
  });

  it('updates code and calls API', async () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('user-1'), { timeout: 2000 });

    // First create session so currentSession is set
    fireEvent.click(screen.getByText('create'));
    await waitFor(() => expect(screen.getByTestId('session-id').textContent).toBe('session-1'));

    fireEvent.click(screen.getByText('updateCode'));

    await waitFor(() => expect(mockedApi.updateSessionCode).toHaveBeenCalledWith('session-1', "console.log('updated')", 'user-1'));
    expect(screen.getByTestId('code').textContent).toBe("console.log('updated')");
  });

  it('changes language and refreshes session', async () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('user-1'), { timeout: 2000 });

    fireEvent.click(screen.getByText('create'));
    await waitFor(() => expect(screen.getByTestId('session-id').textContent).toBe('session-1'));

    fireEvent.click(screen.getByText('updateLanguage'));

    await waitFor(() => expect(mockedApi.updateSessionLanguage).toHaveBeenCalledWith('session-1', 'python'));
    expect(mockedApi.getSession).toHaveBeenCalledWith('session-1');
  });

  it('leaves session', async () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('user-1'), { timeout: 2000 });

    fireEvent.click(screen.getByText('create'));
    await waitFor(() => expect(screen.getByTestId('session-id').textContent).toBe('session-1'));

    fireEvent.click(screen.getByText('leave'));

    await waitFor(() => expect(screen.getByTestId('session-id').textContent).toBe('none'));
    expect(mockedApi.leaveSession).toHaveBeenCalledWith('session-1', SAMPLE_USER.id);
  });
});
