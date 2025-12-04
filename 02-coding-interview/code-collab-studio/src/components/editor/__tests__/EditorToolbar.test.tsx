import { render, screen } from '@testing-library/react';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { SessionProvider } from '@/contexts/SessionContext';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  createSession: (name: string, language: string, owner: any) => Promise<any>;
};

describe('EditorToolbar', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedApi.generateUser = vi.fn(() => ({ id: 'user-1', name: 'Test', color: '#fff' }));
    mockedApi.createSession = vi.fn(async () => ({
      id: 'session-1',
      name: 'Test Session',
      language: 'javascript',
      code: "console.log('test')",
      createdAt: new Date(),
      owner: { id: 'user-1', name: 'Test', color: '#fff' },
      participants: [],
    }));
  });

  it('renders toolbar with session name', () => {
    render(
      <BrowserRouter>
        <TooltipProvider>
          <SessionProvider>
            <EditorToolbar />
          </SessionProvider>
        </TooltipProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Untitled Session/i)).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(
      <BrowserRouter>
        <TooltipProvider>
          <SessionProvider>
            <EditorToolbar />
          </SessionProvider>
        </TooltipProvider>
      </BrowserRouter>
    );

    // Check for buttons by their visible text/icons
    expect(screen.getByText(/Copy/i)).toBeInTheDocument();
    expect(screen.getByText(/Share/i)).toBeInTheDocument();
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
    expect(screen.getByText(/Leave/i)).toBeInTheDocument();
  });
});
