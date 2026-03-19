import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Play, Pause } from 'lucide-react';
import { useActivateEnrollment, usePauseEnrollment } from '@/hooks/use-lms';
import { useAuth } from '@/contexts/AuthContext';
import type { PaymentStatus } from '@/types';

export function ActivateEnrollmentDialog({ enrollmentId, leadId: initialLeadId }: { enrollmentId: string; leadId?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState(initialLeadId || '');
  const [paymentId, setPaymentId] = useState('');
  const [notes, setNotes] = useState('');
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);
  const mutation = useActivateEnrollment();

  const handleActivate = () => {
    if (!user || !leadId.trim()) return;
    const data = {
      crmLeadId: leadId.trim(),
      crmPaymentId: paymentId || null,
      paymentStatus: 'confirmed' as PaymentStatus,
      activatedByUserId: String(user.id),
      activatedByName: user.fullName,
      notes: notes || null,
    };
    const signature = JSON.stringify({ enrollmentId, data });
    if (idempotencyRef.current?.signature !== signature) {
      idempotencyRef.current = { signature, key: crypto.randomUUID() };
    }

    mutation.mutate({
      enrollmentId,
      data,
      idempotencyKey: idempotencyRef.current.key,
    }, {
      onSuccess: () => {
        idempotencyRef.current = null;
        setLeadId('');
        setPaymentId('');
        setNotes('');
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Play className="mr-1.5 h-3.5 w-3.5" />
          Активдештирүү
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Каттоону активдештирүү</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>CRM Lead ID *</Label>
            <Input value={leadId} onChange={(e) => setLeadId(e.target.value)} placeholder="Lead ID" />
          </div>
          <div className="space-y-2">
            <Label>Төлөм ID (милдеттүү эмес)</Label>
            <Input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="Төлөм ID" />
          </div>
          <div className="space-y-2">
            <Label>Эскертүү</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleActivate} disabled={mutation.isPending || !leadId.trim()} className="w-full">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Активдештирүү
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PauseEnrollmentDialog({ enrollmentId }: { enrollmentId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);
  const mutation = usePauseEnrollment();

  const handlePause = () => {
    if (!user || !reason.trim()) return;
    const data = {
      reason,
      pausedByUserId: String(user.id),
      pausedByName: user.fullName,
    };
    const signature = JSON.stringify({ enrollmentId, data });
    if (idempotencyRef.current?.signature !== signature) {
      idempotencyRef.current = { signature, key: crypto.randomUUID() };
    }

    mutation.mutate({
      enrollmentId,
      data,
      idempotencyKey: idempotencyRef.current.key,
    }, {
      onSuccess: () => {
        idempotencyRef.current = null;
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pause className="mr-1.5 h-3.5 w-3.5" />
          Тындыруу
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Каттоону тындыруу</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Себеп *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
          </div>
          <Button onClick={handlePause} disabled={mutation.isPending || !reason.trim()} variant="destructive" className="w-full">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Тындыруу
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
