import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ky } from '@/lib/i18n';
import type { SystemUser } from '@/types';
import { usersApi } from '@/api/modules';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = () => {
    setIsLoading(true);
    usersApi.list({ search })
      .then((res) => setUsers(res.items ?? []))
      .catch(() => setUsers(mockUsers))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await usersApi.softDelete({ ids: [deleteTarget.id] });
      toast({ title: ky.users.deleteSuccess });
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast({ title: ky.users.deleteError, variant: 'destructive' });
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.users.title} actions={<Button><Plus className="mr-2 h-4 w-4" />{ky.users.newUser}</Button>} />
      <DataTable columns={columns} data={users} isLoading={isLoading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Колдонуучу издөө..." />

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
