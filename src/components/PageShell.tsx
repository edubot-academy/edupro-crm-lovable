import { Loader2 } from 'lucide-react';
import { ky } from '@/lib/i18n';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">{actions}</div>}
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
