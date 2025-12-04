import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { executeCode } from '@/lib/mockApi';
import type { ExecutionResult, SupportedLanguage } from '@/types/session';
import { Play, Loader2, Terminal, Clock, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionPanelProps {
  className?: string;
}

export const ExecutionPanel = ({ className }: ExecutionPanelProps) => {
  const { code, currentSession } = useSession();
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const execResult = await executeCode(
        code, 
        (currentSession?.language || 'javascript') as SupportedLanguage
      );
      setResult(execResult);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className={cn('flex flex-col bg-card border-border', className)}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Output</span>
        </div>
        <Button
          onClick={handleRun}
          disabled={isRunning}
          size="sm"
          className="gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Code
        </Button>
      </div>
      
      <div className="flex-1 p-4 overflow-auto font-mono text-sm">
        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {result.error ? (
                <XCircle className="h-3 w-3 text-destructive" />
              ) : (
                <CheckCircle className="h-3 w-3 text-primary" />
              )}
              <Clock className="h-3 w-3" />
              <span>{result.executionTime.toFixed(2)}ms</span>
            </div>
            
            {result.error ? (
              <pre className="text-destructive whitespace-pre-wrap bg-destructive/10 p-3 rounded-md">
                {result.error}
              </pre>
            ) : (
              <pre className="whitespace-pre-wrap text-foreground bg-secondary/30 p-3 rounded-md">
                {result.output}
              </pre>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Click "Run Code" to execute</p>
          </div>
        )}
      </div>
    </Card>
  );
};
