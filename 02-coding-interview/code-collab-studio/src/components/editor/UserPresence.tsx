import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getMockCollaborators } from '@/lib/mockApi';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { User } from '@/types/session';

export const UserPresence = () => {
  const { currentUser, currentSession } = useSession();
  const [collaborators, setCollaborators] = useState<User[]>([]);

  useEffect(() => {
    // Simulate collaborators joining
    const mockUsers = getMockCollaborators();
    const timer = setTimeout(() => {
      setCollaborators(mockUsers);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const allUsers = currentUser ? [currentUser, ...collaborators] : collaborators;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{allUsers.length} online</span>
      </div>
      
      <div className="flex -space-x-2">
        {allUsers.map((user, index) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar 
                className="h-8 w-8 border-2 border-background cursor-pointer transition-transform hover:scale-110 hover:z-10"
                style={{ 
                  backgroundColor: user.color,
                  zIndex: allUsers.length - index 
                }}
              >
                <AvatarFallback 
                  className="text-xs font-medium"
                  style={{ 
                    backgroundColor: user.color,
                    color: 'white'
                  }}
                >
                  {user.name && user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{user.name}</p>
              {user.id === currentUser.id && (
                <p className="text-xs text-muted-foreground">(You)</p>
              )}
              {user.cursor && (
                <p className="text-xs text-muted-foreground">
                  Line {user.cursor.line}, Col {user.cursor.column}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
