import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        destructive: 'bg-destructive/10 text-destructive',
        info: 'bg-info/10 text-info',
        primary: 'bg-primary/10 text-primary',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ children, variant, className, dot }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {dot && (
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', {
          'bg-secondary-foreground': variant === 'default',
          'bg-success': variant === 'success',
          'bg-warning': variant === 'warning',
          'bg-destructive': variant === 'destructive',
          'bg-info': variant === 'info',
          'bg-primary': variant === 'primary',
          'bg-muted-foreground': variant === 'muted',
        })} />
      )}
      {children}
    </span>
  );
}

// Helper to map common statuses to variants
export function getLeadStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'new': return 'info';
    case 'contacted': return 'primary';
    case 'qualified': return 'success';
    case 'disqualified': return 'destructive';
    case 'interested': return 'primary';
    case 'trial_scheduled': return 'warning';
    case 'trial_completed': return 'warning';
    case 'consultation': return 'info';
    case 'trial': return 'warning';
    case 'offer_sent': return 'info';
    case 'negotiation': return 'warning';
    case 'payment_pending': return 'warning';
    case 'won': return 'success';
    case 'lost': return 'destructive';
    default: return 'default';
  }
}

export function getPaymentStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'submitted': return 'info';
    case 'confirmed': return 'success';
    case 'failed': return 'destructive';
    case 'refunded': return 'muted';
    case 'overdue': return 'warning';
    default: return 'default';
  }
}

export function getTaskStatusVariant(status: string): StatusBadgeProps['variant'] {
  switch (status) {
    case 'open': return 'warning';
    case 'in_progress': return 'info';
    case 'done': return 'success';
    case 'cancelled': return 'muted';
    default: return 'default';
  }
}

export function getRiskSeverityVariant(severity: string): StatusBadgeProps['variant'] {
  switch (severity) {
    case 'low': return 'info';
    case 'medium': return 'warning';
    case 'high': return 'destructive';
    case 'critical': return 'destructive';
    default: return 'default';
  }
}

export function getTaskPriorityVariant(priority: string): StatusBadgeProps['variant'] {
  switch (priority) {
    case 'low': return 'muted';
    case 'medium': return 'info';
    case 'high': return 'warning';
    case 'urgent': return 'destructive';
    default: return 'default';
  }
}
