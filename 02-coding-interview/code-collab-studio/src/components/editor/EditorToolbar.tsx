import { Button } from '@/components/ui/button';
import { LanguageSelector } from './LanguageSelector';
import { UserPresence } from './UserPresence';
import { useSession } from '@/contexts/SessionContext';
import { Copy, Share2, LogOut, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const EditorToolbar = () => {
  const { currentSession, leaveCurrentSession, code } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();

const copyToClipboard = async (text: string): Promise<boolean> => {
  // 1. Preferred modern API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fail silently and continue to fallback
    }
  }

  // 2. Fallback (required for Safari/iOS/WebViews)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);

    return ok;
  } catch {
    return false;
  }
}


  const handleShare = async () => {
    if (!currentSession?.id) {
      console.error('[EditorToolbar] No session ID found for sharing.');
      toast({ title: 'Error', description: 'Session ID not available.', variant: 'destructive' });
      return;
    }
    const shareUrl = `${window.location.origin}/session/${currentSession.id}`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      toast({
        title: 'Link copied!',
        description: 'Share this link with collaborators to join the session.',
      });
    } else {
      toast({ title: 'Copy failed', description: 'Could not copy link to clipboard. Try manually copying the URL.', variant: 'destructive' });
    }
  };

  const handleCopyCode = async () => {
    if (!code) {
      toast({
        title: 'No code to copy',
        description: 'The code editor is empty.',
      });
      return;
    }
    const success = await copyToClipboard(code);
    if (success) {
      toast({
        title: 'Code copied!',
        description: 'Code has been copied to clipboard.',
      });
    } else {
      toast({ title: 'Copy failed', description: 'Could not copy code to clipboard. Try manually selecting and copying.', variant: 'destructive' });
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
