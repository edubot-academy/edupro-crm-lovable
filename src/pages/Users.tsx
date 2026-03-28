import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ky } from '@/lib/i18n';
import type { CreatedUserResponse, SystemUser, UserRole } from '@/types';
import { usersApi } from '@/api/modules';
import { Plus, Trash2, Mail, Loader2, Copy, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendlyError } from '@/lib/error-messages';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const mockUsers: SystemUser[] = [
  { id: 1, fullName: 'Айбек Сатыбалдиев', email: 'aibek@edubot.kg', role: 'admin' },
  { id: 2, fullName: 'Нургуль Эсенова', email: 'nurgul@edubot.kg', role: 'sales' },
  { id: 3, fullName: 'Эрлан Токтосунов', email: 'erlan@edubot.kg', role: 'sales' },
  { id: 4, fullName: 'Жылдыз Асанова', email: 'jyldyz@edubot.kg', role: 'assistant' },
  { id: 5, fullName: 'Мурат Алиев', email: 'murat@edubot.kg', role: 'manager' },
];

const emptyForm = {
  fullName: '',
  email: '',
  role: 'sales' as UserRole,
};

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [inviteInfo, setInviteInfo] = useState<{ email: string; inviteUrl?: string } | null>(null);
  const [isResendingInvite, setIsResendingInvite] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const creatableRoles = Object.entries(ky.userRole).filter(([role]) => user?.role === 'superadmin' || role !== 'superadmin');

  const fetchUsers = () => {
    setIsLoading(true);
    usersApi.list({ search })
      .then((res) => setUsers(res.items ?? []))
      .catch(() => setUsers(mockUsers))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const handleCreate = async () => {
    if (!form.fullName || !form.email || !form.role) return;
    setIsCreating(true);
    try {
      const createdUser = await usersApi.create(form) as CreatedUserResponse;
      const inviteUrl = createdUser.inviteUrl || (createdUser.inviteToken ? `${window.location.origin}/accept-invite?token=${createdUser.inviteToken}` : undefined);
      toast({ title: 'Колдонуучу ийгиликтүү кошулду' });
      setShowCreate(false);
      setForm(emptyForm);
      setInviteInfo({ email: createdUser.email || form.email, inviteUrl });
      fetchUsers();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Колдонуучуну сактоо ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteInfo?.inviteUrl) return;
    await navigator.clipboard.writeText(inviteInfo.inviteUrl);
    toast({ title: 'Чакыруу шилтемеси көчүрүлдү' });
  };

  const handleResendInvite = async () => {
    if (!inviteInfo?.email) return;
    setIsResendingInvite(true);
    try {
      await authApi.resendInvite(inviteInfo.email);
      toast({ title: 'Чакыруу кайра жөнөтүлдү' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Чакырууну кайра жөнөтүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsResendingInvite(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await usersApi.softDelete({ ids: [deleteTarget.id] });
      toast({ title: ky.users.deleteSuccess });
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: ky.users.deleteError });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<SystemUser>[] = [
    { key: 'fullName', header: ky.common.name, render: (u) => <span className="font-medium">{u.fullName}</span> },
    { key: 'email', header: ky.common.email },
    { key: 'role', header: ky.users.role, render: (u) => <StatusBadge variant="primary">{ky.userRole[u.role]}</StatusBadge> },
    {
      key: 'id', header: ky.common.actions, render: (u) => (
        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u)} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const renderMobileCard = (user: SystemUser) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.fullName}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(user); }} className="h-8 w-8 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <StatusBadge variant="primary">{ky.userRole[user.role]}</StatusBadge>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.users.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.users.newUser}</Button>} />
      <DataTable columns={columns} data={users} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Колдонуучу издөө..." renderMobileCard={renderMobileCard} />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ky.users.newUser}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{ky.common.name} *</Label>
              <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} placeholder="Толук аты" />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.email} *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{ky.users.role}</Label>
              <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {creatableRoles.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !form.fullName || !form.email}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!inviteInfo} onOpenChange={(open) => !open && setInviteInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Чакыруу даяр</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              <p className="font-medium">{inviteInfo?.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Колдонуучу аккаунтту `accept invite` аркылуу бүтүрүшү керек.
              </p>
            </div>
            {inviteInfo?.inviteUrl ? (
              <div className="space-y-2">
                <Label>Shareable invite link</Label>
                <Textarea value={inviteInfo.inviteUrl} readOnly rows={3} />
              </div>
            ) : (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
                Create жоопто invite link келген жок. Email аркылуу чакырууну кайра жөнөтө аласың.
              </div>
            )}
          </div>
          <DialogFooter>
            {inviteInfo?.inviteUrl && (
              <Button variant="outline" onClick={handleCopyInvite}>
                <Copy className="mr-2 h-4 w-4" />
                Көчүрүү
              </Button>
            )}
            <Button onClick={handleResendInvite} disabled={isResendingInvite}>
              {isResendingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isResendingInvite && <Send className="mr-2 h-4 w-4" />}
              Кайра жөнөтүү
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ky.users.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.fullName} — {ky.users.deleteConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{ky.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {ky.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
