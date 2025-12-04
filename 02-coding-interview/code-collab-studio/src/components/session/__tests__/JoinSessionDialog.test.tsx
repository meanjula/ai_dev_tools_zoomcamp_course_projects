import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinSessionDialog } from '@/components/session/JoinSessionDialog';
import { SessionProvider } from '@/contexts/SessionContext';
import { BrowserRouter } from 'react-router-dom';
import * as mockApi from '@/lib/mockApi';
import { vi } from 'vitest';

vi.mock('@/lib/mockApi');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockedApi = mockApi as unknown as {
  generateUser: () => any;
  joinSession: (id: string, user: any) => Promise<any>;
};

const SAMPLE_USER = { id: 'user-1', name: 'Test User', color: '#ff0000' };
const SAMPLE_SESSION = {
  id: 'session-1',
  name: 'Test Session',
  language: 'javascript',
  code: "console.log('hello')",
  createdAt: new Date(),
  owner: SAMPLE_USER,
  participants: [SAMPLE_USER],
};

describe('JoinSessionDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedApi.generateUser = vi.fn(() => SAMPLE_USER);
    mockedApi.joinSession = vi.fn(async () => SAMPLE_SESSION);
  });

  it('renders the join session button', () => {
    render(
      <BrowserRouter>
        <SessionProvider>
          <JoinSessionDialog />
        </SessionProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Join Session/i)).toBeInTheDocument();
  });

  it('button is clickable', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SessionProvider>
          <JoinSessionDialog />
        </SessionProvider>
      </BrowserRouter>
    );

    const button = screen.getByText(/Join Session/i);
    expect(button).not.toBeDisabled();
    await user.click(button);
    expect(button).toBeInTheDocument();
  });
});
