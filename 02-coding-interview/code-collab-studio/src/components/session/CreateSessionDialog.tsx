import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGES, type SupportedLanguage } from '@/types/session';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
export const CreateSessionDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const {
    createNewSession,
    isLoading
  } = useSession();
  const navigate = useNavigate();
  const handleCreate = async () => {
    if (!name.trim()) return;
    const session = await createNewSession(name.trim(), language);
    setOpen(false);
    setName('');
    navigate(`/session/${session.id}`);
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 text-lg py-6 px-[25px]">Create Session<Plus className="h-5 w-5" />
          ​
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Start a new collaborative coding session. Share the link to invite others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Session Name</Label>
            <Input id="name" placeholder="My awesome project" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={v => setLanguage(v as SupportedLanguage)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};