import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

export interface PriorityScore {
  score: number;
  level: 'hot' | 'warm' | 'cold';
  factors: {
    factor: string;
    weight: number;
    contribution: number;
    value: unknown;
  }[];
  explanation: string;
  maxScore: number;
  tier: 'hot' | 'warm' | 'cold';
}

export interface RiskScore {
  risk: 'low' | 'medium' | 'high' | 'critical';
  reasons: {
    code: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  score: number;
}

interface PriorityIndicatorProps {
  priority?: PriorityScore;
  risk?: RiskScore;
  showDetails?: boolean;
  compact?: boolean;
}

const factorLabels: Record<string, string> = {
  recency: 'Акыркы байланыш',
  followup_gap: 'Кийинки байланыш',
  open_tasks: 'Ачык тапшырмалар',
  deal_stage: 'Келишим баскычы',
  trial_status: 'Сыноо сабак',
  payment_signal: 'Төлөм абалы',
};

const priorityConfig = {
  hot: {
    label: 'Жогорку приоритет',
    shortLabel: 'Жогорку',
    tone: 'border-red-200 bg-red-50 text-red-800',
    icon: TrendingUp,
  },
  warm: {
    label: 'Орточо приоритет',
    shortLabel: 'Орточо',
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: Clock,
  },
  cold: {
    label: 'Төмөн приоритет',
    shortLabel: 'Төмөн',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: Info,
  },
};

const riskConfig = {
  critical: {
    label: 'Критикалык тобокелдик',
    shortLabel: 'Критикалык',
    tone: 'border-red-300 bg-red-50 text-red-900',
    icon: AlertTriangle,
  },
  high: {
    label: 'Жогорку тобокелдик',
    shortLabel: 'Жогорку',
    tone: 'border-red-200 bg-red-50 text-red-800',
    icon: AlertTriangle,
  },
  medium: {
    label: 'Орточо тобокелдик',
    shortLabel: 'Орточо',
    tone: 'border-orange-200 bg-orange-50 text-orange-800',
    icon: AlertTriangle,
  },
  low: {
    label: 'Төмөн тобокелдик',
    shortLabel: 'Төмөн',
    tone: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: Info,
  },
};

function formatFactorValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Маалымат жок';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate) && value.includes('T')) {
      return new Date(parsedDate).toLocaleDateString();
    }
    return value;
  }
  return 'Такталган жок';
}

function PriorityBadge({ priority }: { priority: PriorityScore }) {
  const config = priorityConfig[priority.tier ?? priority.level];
  const Icon = config.icon;

  return (
    <Badge className={`gap-1 border ${config.tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function RiskBadge({ risk }: { risk: RiskScore }) {
  const config = riskConfig[risk.risk];
  const Icon = config.icon;

  return (
    <Badge className={`gap-1 border ${config.tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function PriorityDetails({ priority }: { priority: PriorityScore }) {
  const strongestFactors = [...priority.factors]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{priority.explanation}</p>
      <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Эң чоң таасир берген факторлор</p>
        {strongestFactors.map((factor) => (
          <div key={factor.factor} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-foreground">{factorLabels[factor.factor] || factor.factor}</p>
              <p className="text-xs text-muted-foreground">{formatFactorValue(factor.value)}</p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
              +{factor.contribution}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskDetails({ risk }: { risk: RiskScore }) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Негизги себептер</p>
      <div className="space-y-2">
        {risk.reasons.slice(0, 4).map((reason) => (
          <div key={`${reason.code}-${reason.description}`} className="rounded-lg bg-white px-3 py-2 text-sm text-foreground shadow-sm">
            {reason.description}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PriorityIndicator({ priority, risk, showDetails = true, compact = false }: PriorityIndicatorProps) {
  if (!priority && !risk) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {priority && <PriorityBadge priority={priority} />}
        {risk && <RiskBadge risk={risk} />}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {priority && (
        <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Приоритет</p>
              <PriorityBadge priority={priority} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-foreground">{Math.round(priority.score)}</p>
              <p className="text-xs text-muted-foreground">{priority.maxScore || 100} упайдан</p>
            </div>
          </div>
          {showDetails && <div className="mt-4"><PriorityDetails priority={priority} /></div>}
        </div>
      )}

      {risk && (
        <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Тобокелдик</p>
              <RiskBadge risk={risk} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-foreground">{Math.round(risk.score)}</p>
              <p className="text-xs text-muted-foreground">100 упайдан</p>
            </div>
          </div>
          {showDetails && <div className="mt-4"><RiskDetails risk={risk} /></div>}
        </div>
      )}
    </div>
  );
}

export function ListPriorityIndicator({ priority, risk }: { priority?: PriorityScore; risk?: RiskScore }) {
  return (
    <div className="flex items-center gap-1.5">
      {priority && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-full px-2 py-1 text-[11px] font-medium ${priorityConfig[priority.tier ?? priority.level].tone}`}>
                {priorityConfig[priority.tier ?? priority.level].shortLabel}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{priorityConfig[priority.tier ?? priority.level].label}</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.round(priority.score)}/{priority.maxScore || 100}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {risk && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`rounded-full px-2 py-1 text-[11px] font-medium ${riskConfig[risk.risk].tone}`}>
                {riskConfig[risk.risk].shortLabel}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{riskConfig[risk.risk].label}</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.round(risk.score)}/100</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
