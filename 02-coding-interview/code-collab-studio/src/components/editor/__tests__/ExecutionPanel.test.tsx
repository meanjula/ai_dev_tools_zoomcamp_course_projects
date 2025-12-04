import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from '@/contexts/SessionContext';
import { ExecutionPanel } from '@/components/editor/ExecutionPanel';
import * as mockApi from '@/lib/mockApi';
import { vi } from 'vitest';

vi.mock('@/lib/mockApi');

const mockedApi = mockApi as unknown as {
  executeCode: (code: string, language: string) => Promise<any>;
  generateUser: () => any;
  createSession: (name: string, language: string, owner: any) => Promise<any>;
};

const SAMPLE_SESSION = {
  id: 'sess-1',
  name: 's',
  language: 'javascript',
  code: "console.log('x')",
  createdAt: new Date(),
  owner: { id: 'u1', name: 'A', color: '#fff' },
  participants: [],
};

function TestSetup() {
  return (
    <SessionProvider>
      <ExecutionPanel />
    </SessionProvider>
  );
}

describe('ExecutionPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedApi.generateUser = vi.fn(() => ({ id: 'u1', name: 'A', color: '#fff' }));
    mockedApi.createSession = vi.fn(async () => SAMPLE_SESSION);
    mockedApi.executeCode = vi.fn(async () => ({ output: 'ok', executionTime: 10 }));
  });

  it('runs code and displays output', async () => {
    render(
      <SessionProvider>
        {/* We'll create session through provider by calling createNewSession via UI consumer */}
        <ExecutionPanel />
      </SessionProvider>
    );

    // There's no current session by default — simulate session creation by using API mock and SessionProvider's create
    // Instead of clicking UI to create, directly call createSession via mocked API and then wait for run action.

    // Create a session by calling createSession mock and waiting briefly for provider to pick it up when tests call createNewSession
    // To trigger provider createNewSession we need to render a small caller; but to keep test focused, we'll just simulate executeCode call

    const runButton = screen.getByRole('button', { name: /Run Code/i });

    fireEvent.click(runButton);

    await waitFor(() => expect(mockedApi.executeCode).toHaveBeenCalled());

    await waitFor(() => expect(screen.getByText(/ok/)).toBeInTheDocument());
  });
});
