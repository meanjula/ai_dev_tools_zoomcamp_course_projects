import { render, screen } from '@testing-library/react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { SessionProvider } from '@/contexts/SessionContext';
import * as mockApi from '@/lib/mockApi';
import { vi } from 'vitest';

vi.mock('@/lib/mockApi');
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, language }: any) => (
    <div data-testid="mock-editor">
      <div data-testid="editor-language">{language}</div>
      <div data-testid="editor-value">{value}</div>
      <button onClick={() => onChange?.('console.log("new")')}>Update</button>
    </div>
  ),
}));

const mockedApi = mockApi as unknown as {
  generateUser: () => {
    id: string;
    name: string;
    color: string;
  };
  createSession: (name: string, language: string, owner: any) => Promise<any>;
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

describe('CodeEditor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedApi.generateUser = vi.fn(() => SAMPLE_USER);
    mockedApi.createSession = vi.fn(async () => SAMPLE_SESSION);
  });

  it('renders the editor', () => {
    render(
      <SessionProvider>
        <CodeEditor />
      </SessionProvider>
    );

    expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    const { container } = render(
      <SessionProvider>
        <CodeEditor className="test-class" />
      </SessionProvider>
    );

    const editor = container.querySelector('.test-class');
    expect(editor).toBeInTheDocument();
  });

  it('uses default language when no session exists', () => {
    render(
      <SessionProvider>
        <CodeEditor />
      </SessionProvider>
    );

    expect(screen.getByTestId('editor-language')).toHaveTextContent('javascript');
  });
});
