import { Button } from '@/components/ui/button';
import { LanguageSelector } from './LanguageSelector';
import { UserPresence } from './UserPresence';
import { useSession } from '@/contexts/SessionContext';
import { Copy, Share2, LogOut, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const EditorToolbar = () => {
  const { currentSession, leaveCurrentSession } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/session/${currentSession?.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied!',
      description: 'Share this link with collaborators to join the session.',
    });
  };

  const handleCopyCode = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.code);
      toast({
        title: 'Code copied!',
        description: 'Code has been copied to clipboard.',
      });
    }
  };

  const handleLeave = () => {
    leaveCurrentSession();
    navigate('/');
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          <span className="font-semibold text-sm">
            {currentSession?.name || 'Untitled Session'}
          </span>
        </div>
        <LanguageSelector />
      </div>

      <UserPresence />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyCode}>
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          toast({ title: 'Saved!', description: 'Session saved successfully.' });
        }}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button variant="destructive" size="sm" onClick={handleLeave}>
          <LogOut className="h-4 w-4 mr-1" />
          Leave
        </Button>
      </div>
    </div>
  );
};
