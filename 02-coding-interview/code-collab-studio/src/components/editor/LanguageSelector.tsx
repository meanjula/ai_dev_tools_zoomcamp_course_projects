import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGES, type SupportedLanguage } from '@/types/session';
import { useSession } from '@/contexts/SessionContext';
import { Code2 } from 'lucide-react';

export const LanguageSelector = () => {
  const { currentSession, updateLanguage } = useSession();

  const handleLanguageChange = async (value: string) => {
    await updateLanguage(value as SupportedLanguage);
  };

  return (
    <Select
      value={currentSession?.language || 'javascript'}
      onValueChange={handleLanguageChange}
    >
      <SelectTrigger className="w-[180px] bg-card border-border">
        <Code2 className="mr-2 h-4 w-4 text-primary" />
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            <span className="flex items-center gap-2">
              {lang.label}
              <span className="text-muted-foreground text-xs">{lang.extension}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
