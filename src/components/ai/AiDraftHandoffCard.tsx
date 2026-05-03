import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AiDraftHandoffCardProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
}

export function AiDraftHandoffCard({
  value,
  onChange,
  onClear,
  className,
}: AiDraftHandoffCardProps) {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(value);
      toast({
        title: 'Текст көчүрүлдү',
        description: 'Сунушталган жооп алмашуу буферине көчүрүлдү.',
      });
    } catch {
      toast({
        title: 'Көчүрүү мүмкүн болгон жок',
        description: 'Текстти кол менен белгилеп көчүрүп алыңыз.',
        variant: 'destructive',
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-orange-500" />
            AI сунуштаган жооп
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Адам тарабынан текшерилип, андан кийин гана колдонулушу керек.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Адегенде текшерүү керек
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[140px]"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Тазалоо
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={isCopying}>
            <Copy className="mr-2 h-4 w-4" />
            {isCopying ? 'Көчүрүлүүдө...' : 'Көчүрүү'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
