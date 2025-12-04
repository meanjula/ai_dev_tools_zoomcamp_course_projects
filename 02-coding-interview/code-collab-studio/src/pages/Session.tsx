import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { ExecutionPanel } from '@/components/editor/ExecutionPanel';
import { Loader2 } from 'lucide-react';

const Session = () => {
  const { id } = useParams<{ id: string }>();
  const { currentSession, joinExistingSession, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && !currentSession) {
      joinExistingSession(id).then((session) => {
        if (!session) {
          navigate('/');
        }
      });
    }
  }, [id, currentSession, joinExistingSession, navigate]);

  if (isLoading || !currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorToolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <CodeEditor className="flex-1 min-w-0" />
        <ExecutionPanel className="w-96 border-l border-border" />
      </div>
    </div>
  );
};

export default Session;
