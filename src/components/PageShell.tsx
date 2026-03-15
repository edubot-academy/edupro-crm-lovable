import { Loader2 } from 'lucide-react';
import { ky } from '@/lib/i18n';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">{ky.common.loading}</p>
    </div>
  );
}

export function PageError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-muted-foreground">{ky.common.error}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-primary hover:underline">
          {ky.common.retry}
        </button>
      )}
    </div>
  );
}

export function PageEmpty({ message }: { message?: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-muted-foreground">{message || ky.common.noData}</p>
    </div>
  );
}
