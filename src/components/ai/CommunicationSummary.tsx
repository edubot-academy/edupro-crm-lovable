import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface CommunicationSummary {
  summary: string;
  aiRequestId?: string | null;
  promptVersion?: string;
  model?: string | null;
}

interface CommunicationSummaryProps {
  summary?: CommunicationSummary;
  targetType: 'lead' | 'contact' | 'deal';
  targetId: number;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string;
  compact?: boolean;
}

function SummaryMeta() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="gap-1">
        <Sparkles className="h-3.5 w-3.5" />
        AI жыйынтык
      </Badge>
    </div>
  );
}

export function CommunicationSummary({
  summary,
  targetType,
  targetId,
  onRefresh,
  loading = false,
  error,
  compact = false,
}: CommunicationSummaryProps) {
  const { toast } = useToast();

  const handleRefresh = () => {
    if (!onRefresh) return;
    onRefresh();
    toast({ title: 'Жаңыртылды', description: 'Жыйынтык кайра даярдалып жатат.' });
  };

  if (!summary && !loading && !error) {
    return (
      <Card className="border-dashed border-border bg-muted/20">
        <CardContent className="pt-6">
          <div className="py-4 text-center text-muted-foreground">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Жыйынтык чыгарууга жетиштүү байланыш табылган жок</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="space-y-3 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>Кайра аракет кылуу</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-4 text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-8 w-8 animate-spin text-orange-500" />
            <p className="text-sm">AI жыйынтык даярдап жатат...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  if (compact) {
    return (
      <div className="rounded-xl border border-border/70 bg-background p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <SummaryMeta />
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-sm leading-6 text-foreground">{summary.summary}</p>
      </div>
    );
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">Байланыштын кыскача жыйынтыгы</CardTitle>
            <p className="text-sm text-muted-foreground">Акыркы сүйлөшүүлөрдүн кыскача мааниси жана кийинки иш үчүн контекст.</p>
            <SummaryMeta />
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Жаңыртуу
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <p className="text-sm leading-7 text-foreground">{summary.summary}</p>
        </div>
        <p className="text-xs text-muted-foreground">Бул блок маалыматтык мүнөздө. Аны расмий чечим катары эмес, жардамчы контекст катары колдонуңуз.</p>
      </CardContent>
    </Card>
  );
}

export function MinimalCommunicationSummary({ summary }: { summary?: CommunicationSummary }) {
  if (!summary) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-800">
      <Sparkles className="h-3.5 w-3.5" />
      AI жыйынтык
    </div>
  );
}
