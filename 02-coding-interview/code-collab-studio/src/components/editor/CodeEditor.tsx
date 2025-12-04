import Editor from '@monaco-editor/react';
import { useSession } from '@/contexts/SessionContext';

interface CodeEditorProps {
  className?: string;
}

export const CodeEditor = ({ className }: CodeEditorProps) => {
  const { code, updateCode, currentSession } = useSession();

  const getMonacoLanguage = (lang: string) => {
    const mapping: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
    };
    return mapping[lang] || 'javascript';
  };

  return (
    <div className={className}>
      <Editor
        height="100%"
        language={getMonacoLanguage(currentSession?.language || 'javascript')}
        value={code}
        onChange={(value) => updateCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'Space Mono', monospace",
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16 },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
    </div>
  );
};
