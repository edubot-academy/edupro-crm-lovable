import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Clock, AlertTriangle, Calendar, Info, MessageSquare, Phone, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface NextBestAction {
  action:
    | 'call'
    | 'whatsapp'
    | 'schedule_trial'
    | 'send_reminder'
    | 'follow_up'
    | 'escalate'
    | 'reschedule_trial'
    | 'confirm_payment_intent'
    | 'complete_enrollment'
    | 'payment_reminder'
    | 're_engage'
    | 'send_offer'
    | 'complete_open_task';
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  aiGenerated: boolean;
  suggestedAt: string;
  prerequisites?: string[];
}

interface NextBestActionCardProps {
  action?: NextBestAction;
  targetType: 'lead' | 'contact' | 'deal';
  targetId: number;
  onActionExecute?: (action: NextBestAction) => void;
  loading?: boolean;
  error?: string;
}

const actionConfig = {
  call: {
    label: 'Чалуу',
    description: 'Түз байланышып, кийинки кадамды тактаңыз.',
    buttonLabel: 'Чалууну баштоо',
    icon: Phone,
    accent: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  whatsapp: {
    label: 'WhatsApp билдирүүсү',
    description: 'Кыска билдирүү менен кардарга кайра кайрылыңыз.',
    buttonLabel: 'WhatsApp ачуу',
    icon: MessageSquare,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  schedule_trial: {
    label: 'Сыноо сабакты белгилөө',
    description: 'Кардарга ылайыктуу убакыт сунуштап, сабакты бекитиңиз.',
    buttonLabel: 'Сабакты белгилөө',
    icon: Calendar,
    accent: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  send_reminder: {
    label: 'Эскертме жөнөтүү',
    description: 'Убагында жооп алуу үчүн кыска эскертме жөнөтүңүз.',
    buttonLabel: 'Эскертмени ачуу',
    icon: Send,
    accent: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  follow_up: {
    label: 'Кайра байланышуу',
    description: 'Маекти жандандырып, кардардын абалын тактаңыз.',
    buttonLabel: 'Байланышууну баштоо',
    icon: Clock,
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  escalate: {
    label: 'Жетекчиге өткөрүү',
    description: 'Бул иште жетекчинин катышуусу керек.',
    buttonLabel: 'Өткөрүү',
    icon: AlertTriangle,
    accent: 'bg-red-50 text-red-700 border-red-200',
  },
  reschedule_trial: {
    label: 'Сабакты кайра белгилөө',
    description: 'Өткөрүлбөй калган сабак үчүн жаңы убакыт тандаңыз.',
    buttonLabel: 'Жаңы убакыт тандоо',
    icon: Calendar,
    accent: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  confirm_payment_intent: {
    label: 'Төлөм ниетин тактоо',
    description: 'Кардардын катталууга даяр экенин текшериңиз.',
    buttonLabel: 'Төлөмдү тактоо',
    icon: MessageSquare,
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  complete_enrollment: {
    label: 'Каттоону аяктоо',
    description: 'Төлөмдөн кийин каттоо процессин бүтүрүңүз.',
    buttonLabel: 'Каттоону бүтүрүү',
    icon: Send,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  payment_reminder: {
    label: 'Төлөм эскертмеси',
    description: 'Кардарга төлөм боюнча жумшак эскертүү жөнөтүңүз.',
    buttonLabel: 'Эскертмени ачуу',
    icon: Send,
    accent: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  re_engage: {
    label: 'Кардарды кайра жандандыруу',
    description: 'Маекти кайра баштап, кызыгуусун текшериңиз.',
    buttonLabel: 'Кайра байланышуу',
    icon: MessageSquare,
    accent: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  send_offer: {
    label: 'Сунуш жөнөтүү',
    description: 'Так сунуш же шарттарды бөлүшүңүз.',
    buttonLabel: 'Сунушту ачуу',
    icon: Send,
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  complete_open_task: {
    label: 'Ачык тапшырманы бүтүрүү',
    description: 'Алгач кезектеги ачык тапшырманы жаап чыгыңыз.',
    buttonLabel: 'Тапшырманы ачуу',
    icon: Clock,
    accent: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

const fallbackActionConfig = actionConfig.follow_up;

const urgencyStyles = {
  high: {
    label: 'Шашылыш',
    tone: 'border-red-200 bg-red-50 text-red-700',
  },
  medium: {
    label: 'Орточо',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  low: {
    label: 'Пландуу',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

function ActionButton({ action, onExecute, loading }: {
  action: NextBestAction;
  onExecute: (action: NextBestAction) => void;
  loading?: boolean;
}) {
  const config = actionConfig[action.action] ?? fallbackActionConfig;
  const Icon = config.icon;
  const { toast } = useToast();

  const handleExecute = () => {
    if (action.action === 'call') {
      toast({ title: 'Чалуу', description: 'Телефон аракетине өтүңүз.' });
    } else if (action.action === 'whatsapp') {
      toast({ title: 'WhatsApp', description: 'Билдирүү терезесин ачып улантыңыз.' });
    }

    onExecute(action);
  };

  return (
    <Button onClick={handleExecute} disabled={loading} className="w-full sm:w-auto">
      <Icon className="mr-2 h-4 w-4" />
      {config.buttonLabel}
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function NextBestActionCard({
  action,
  targetType,
  targetId,
  onActionExecute,
  loading = false,
  error,
}: NextBestActionCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!action) {
    return (
      <Card className="border-dashed border-border bg-muted/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Info className="h-4 w-4" />
            <span className="text-sm">Азыр сунушталган кийинки аракет жок</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = actionConfig[action.action] ?? fallbackActionConfig;
  const urgencyStyle = urgencyStyles[action.priority];
  const Icon = config.icon;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl border p-3 ${config.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <Badge className={`border ${urgencyStyle.tone}`}>{urgencyStyle.label}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {action.aiGenerated ? 'AI сунушу' : 'Эреже сунушу'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Кийинки кадам</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Эмне үчүн бул сунушталды</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{action.reasoning}</p>
        </div>

        {action.prerequisites && action.prerequisites.length > 0 && (
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)} className="px-0 text-xs text-muted-foreground hover:text-foreground">
              {showDetails ? 'Кошумча маалыматты жашыруу' : 'Кошумча маалыматты көрсөтүү'}
            </Button>
            {showDetails && (
              <div className="rounded-xl border border-border/70 bg-background p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Аткарууга чейин текшериле турган нерселер</p>
                <ul className="space-y-2 text-sm text-foreground">
                  {action.prerequisites.map((prerequisite, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{prerequisite}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Сунуш жардамчы мүнөзүндө. Акыркы чечим кызматкерде калат.</p>
          <ActionButton action={action} onExecute={onActionExecute || (() => {})} loading={loading} />
        </div>
      </CardContent>
    </Card>
  );
}

export function CompactNextBestAction({ action }: { action?: NextBestAction }) {
  if (!action) return null;

  const config = actionConfig[action.action] ?? fallbackActionConfig;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${config.accent}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
