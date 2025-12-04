import { render, screen } from '@testing-library/react';
import { LanguageSelector } from '@/components/editor/LanguageSelector';
import { SessionProvider } from '@/contexts/SessionContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import * as mockApi from '@/lib/mockApi';
import { vi } from 'vitest';

vi.mock('@/lib/mockApi');

const mockedApi = mockApi as unknown as {
  generateUser: () => any;
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

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedApi.generateUser = vi.fn(() => SAMPLE_USER);
    mockedApi.createSession = vi.fn(async () => SAMPLE_SESSION);
  });

  it('renders language selector combobox', () => {
    render(
      <TooltipProvider>
        <SessionProvider>
          <LanguageSelector />
        </SessionProvider>
      </TooltipProvider>
    );

    // LanguageSelector renders a combobox (Select trigger)
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
  });
});
