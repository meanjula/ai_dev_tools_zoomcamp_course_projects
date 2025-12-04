import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LANGUAGES } from '@/types/session';
import { vi } from 'vitest';

describe('Session Types', () => {
  it('LANGUAGES constant has all supported languages', () => {
    expect(LANGUAGES).toHaveLength(6);
    expect(LANGUAGES.map(l => l.value)).toEqual([
      'javascript',
      'typescript',
      'python',
      'html',
      'css',
      'json',
    ]);
  });

  it('each language has label and extension', () => {
    LANGUAGES.forEach(lang => {
      expect(lang.label).toBeDefined();
      expect(lang.label.length).toBeGreaterThan(0);
      expect(lang.extension).toBeDefined();
      expect(lang.extension).toMatch(/^\.\w+$/);
    });
  });

  it('JavaScript has correct properties', () => {
    const jsLang = LANGUAGES.find(l => l.value === 'javascript');
    expect(jsLang).toEqual({
      value: 'javascript',
      label: 'JavaScript',
      extension: '.js',
    });
  });

  it('Python has correct properties', () => {
    const pyLang = LANGUAGES.find(l => l.value === 'python');
    expect(pyLang).toEqual({
      value: 'python',
      label: 'Python',
      extension: '.py',
    });
  });
});
