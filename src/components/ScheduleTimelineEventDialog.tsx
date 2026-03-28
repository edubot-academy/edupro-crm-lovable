import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ky } from '@/lib/i18n';
import { timelineApi } from '@/api/modules';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';
import { toIsoFromDateTimeLocal } from '@/lib/datetime';

type SchedulableType = 'call' | 'meeting';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: SchedulableType;
  leadId?: number;
  contactId?: number;
  dealId?: number;
  onSaved?: () => void;
};

const emptyForm = {
  type: 'call' as SchedulableType,
  message: '',
  scheduledAt: '',
};

export function ScheduleTimelineEventDialog({
  open,
  onOpenChange,
  defaultType,
  leadId,
  contactId,
  dealId,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm({
      type: defaultType,
      message: '',
      scheduledAt: '',
    });
  }, [defaultType, open]);

  const handleSave = async () => {
    const trimmedMessage = form.message.trim();
    const fallbackMessage = form.type === 'call' ? 'Чалуу пландалды' : 'Жолугушуу пландалды';
    const finalMessage = trimmedMessage || fallbackMessage;
    const scheduledAtIso = toIsoFromDateTimeLocal(form.scheduledAt);

    if (!scheduledAtIso) {
      toast({
        title: 'Пландалган убакытты тандаңыз',
        description: 'Чалуу же жолугушуу үчүн так убакыт керек.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await timelineApi.add({
        type: form.type,
        message: finalMessage,
        leadId,
        contactId,
        dealId,
        meta: { scheduledAt: scheduledAtIso },
      });
      toast({ title: form.type === 'call' ? 'Чалуу пландалды' : 'Жолугушуу пландалды' });
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Пландоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.type === 'call' ? 'Чалуу пландоо' : 'Жолугушуу пландоо'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Түрү</Label>
            <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as SchedulableType }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Чалуу</SelectItem>
                <SelectItem value="meeting">Жолугушуу</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Пландалган убакыт</Label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Кааласаңыз кыскача комментарий жазыңыз..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {ky.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !form.scheduledAt}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ky.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
