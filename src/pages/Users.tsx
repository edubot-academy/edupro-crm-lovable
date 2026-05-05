import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Plus, Mail, Loader2, Copy, Send, Pencil, UserCheck, UserX } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendlyError } from '@/lib/error-messages';

const emptyCreateForm = {
  fullName: '',
  email: '',
  role: 'sales' as UserRole,
};

const emptyEditForm = {
  fullName: '',
  email: '',
  isActive: true,
};

export default function UsersPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get('page'));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [inviteInfo, setInviteInfo] = useState<{ email: string; inviteUrl?: string } | null>(null);
  const [isResendingInvite, setIsResendingInvite] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const creatableRoles = Object.entries(ky.userRole).filter(([role]) =>
    role !== 'superadmin'
  );

  const resetCreateForm = () => {
    setCreateForm(emptyCreateForm);
    setShowCreate(false);
  };

  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    usersApi.list({ search, page, limit: 20 })
      .then((res) => {
        setUsers(res.items ?? []);
        setTotalItems(res.total ?? 0);
        setTotalPages(Math.max(res.totalPages ?? 1, 1));
      })
      .catch(() => {
        setUsers([]);
        setTotalItems(0);
        setTotalPages(1);
      })
      .finally(() => setIsLoading(false));
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const nextSearch = searchParams.get('q') ?? '';
    const nextPageRaw = Number(searchParams.get('page'));
    const nextPage = Number.isFinite(nextPageRaw) && nextPageRaw > 0 ? Math.floor(nextPageRaw) : 1;

    if (nextSearch !== search) setSearch(nextSearch);
    if (nextPage !== page) setPage(nextPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (search) next.set('q', search);
      else next.delete('q');

      if (page > 1) next.set('page', String(page));
      else next.delete('page');

      return next.toString() === current.toString() ? current : next;
    }, { replace: true });
  }, [search, page, setSearchParams]);

  const handleCreate = async () => {
    if (!createForm.fullName || !createForm.email || !createForm.role) return;

    if (createForm.role === 'superadmin') {
      toast({ title: 'Бул ролду бул жерден кошууга болбойт', description: 'Бул роль уюм ичиндеги колдонуучулар үчүн жеткиликтүү эмес.', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const createdUser = await usersApi.create(createForm) as CreatedUserResponse;
      const inviteUrl = createdUser.inviteLink || (createdUser.inviteToken ? `${window.location.origin}/accept-invite?token=${createdUser.inviteToken}` : undefined);
      toast({ title: 'Колдонуучу ийгиликтүү кошулду' });
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      setInviteInfo({ email: createForm.email, inviteUrl });
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

  const openEditDialog = (target: SystemUser) => {
    setEditTarget(target);
    setEditForm({
      fullName: target.fullName,
      email: target.email,
      isActive: target.isActive !== false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setIsSavingEdit(true);
    try {
      await usersApi.update(editTarget.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        isActive: editForm.isActive,
      });
      toast({ title: 'Колдонуучу ийгиликтүү жаңыртылды' });
      setEditTarget(null);
      fetchUsers();
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Колдонуучуну жаңыртуу ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const columns: Column<SystemUser>[] = [
    { key: 'fullName', header: ky.common.name, render: (u) => <span className="font-medium">{u.fullName}</span> },
    { key: 'email', header: ky.common.email },
    { key: 'role', header: ky.users.role, render: (u) => <StatusBadge variant="primary">{ky.userRole[u.role]}</StatusBadge> },
    {
      key: 'isActive',
      header: 'Статус',
      render: (u) => (
        <StatusBadge variant={u.isActive === false ? 'warning' : 'success'}>
          {u.isActive === false ? 'Өчүк' : 'Активдүү'}
        </StatusBadge>
      ),
    },
    {
      key: 'id',
      header: ky.common.actions,
      render: (u) => (
        <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const renderMobileCard = (row: SystemUser) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{row.fullName}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{row.email}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant="primary">{ky.userRole[row.role]}</StatusBadge>
          <StatusBadge variant={row.isActive === false ? 'warning' : 'success'}>
            {row.isActive === false ? 'Өчүк' : 'Активдүү'}
          </StatusBadge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.users.title} actions={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{ky.users.newUser}</Button>} />
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Колдонуучу издөө..."
        renderMobileCard={renderMobileCard}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        totalItemsLabel="колдонуучу"
      />

      <Dialog open={showCreate} onOpenChange={(open) => {
        if (!open) {
          resetCreateForm();
          return;
        }
        setShowCreate(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ky.users.newUser}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{ky.common.name} *</Label>
              <Input value={createForm.fullName} onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))} placeholder={ky.common.fullNamePlaceholder} />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.email} *</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))} placeholder={ky.common.emailPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label>{ky.users.role}</Label>
              <Select value={createForm.role} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, role: value as UserRole }))}>
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
            <Button variant="outline" onClick={resetCreateForm}>{ky.common.cancel}</Button>
            <Button onClick={handleCreate} disabled={isCreating || !createForm.fullName || !createForm.email}>
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
                Колдонуучу каттоону чакыруу шилтемеси аркылуу аякташы керек.
              </p>
            </div>
            {inviteInfo?.inviteUrl ? (
              <div className="space-y-2">
                <Label>Колдонуучуга жөнөтүлө турган шилтеме</Label>
                <Textarea value={inviteInfo.inviteUrl} readOnly rows={3} />
              </div>
            ) : (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
                Чакыруу шилтемеси келген жок. Чакырууну кайра жөнөтүп көрүңүз.
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

      <Dialog open={!!editTarget} onOpenChange={(open) => {
        if (!open) {
          setEditTarget(null);
          setEditForm(emptyEditForm);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Колдонуучуну түзөтүү</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{ky.common.name}</Label>
              <Input value={editForm.fullName} onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{ky.common.email}</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={editForm.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, isActive: value === 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="inline-flex items-center gap-2"><UserCheck className="h-4 w-4" />Активдүү</span>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <span className="inline-flex items-center gap-2"><UserX className="h-4 w-4" />Өчүк</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
              Роль бул экрандан өзгөртүлбөйт. Учурдагы роль: {editTarget ? ky.userRole[editTarget.role] : '—'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>{ky.common.cancel}</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit || !editForm.fullName.trim() || !editForm.email.trim()}>
              {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ky.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
