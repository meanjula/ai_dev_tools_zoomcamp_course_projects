import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const JoinSessionDialog = () => {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const { joinExistingSession, isLoading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!sessionId.trim()) return;
    
    // Extract session ID from URL if full URL is pasted
    let id = sessionId.trim();
    if (id.includes('/session/')) {
      id = id.split('/session/')[1];
    }
    
    const session = await joinExistingSession(id);
    
    if (session) {
      setOpen(false);
      setSessionId('');
      navigate(`/session/${session.id}`);
    } else {
      toast({
        title: 'Session not found',
        description: 'The session ID you entered does not exist. Please check and try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6">
          <Users className="h-5 w-5" />
          Join Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Session</DialogTitle>
          <DialogDescription>
            Enter a session ID or paste a session link to join an existing session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sessionId">Session ID or Link</Label>
            <Input
              id="sessionId"
              placeholder="Enter session ID or paste link"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!sessionId.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Join Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
