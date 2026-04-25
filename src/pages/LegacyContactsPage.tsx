import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ky } from '@/lib/i18n';
import { formatDate } from '@/lib/formatting';
import { legacyContactsApi, leadsApi } from '@/api/modules';
import type { Contact } from '@/types';
import { Loader2, Mail, Phone, Database, ArrowRightLeft, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';

type LegacyContactRow = Omit<Contact, 'source'> & {
  source?: string;
  status?: string;
  assignedToName?: string | null;
  courseName?: string | null;
  courseType?: string | null;
  contactAttempts?: number | null;
  lastAttemptAt?: string | null;
};

const sourceLabels: Record<string, string> = {
  WEBSITE: 'Веб-сайт',
  MANUAL: 'Кол менен',
  SOCIAL: 'Соц тармак',
  ADS: 'Жарнама',
  REFERRAL: 'Сунуштоо',
  CALL: 'Чалуу',
  IMPORT: 'Импорт',
  OTHER: 'Башка',
};

const statusLabels: Record<string, string> = {
  NEW: 'Жаңы',
  CONTACTED: 'Байланышылды',
  RESPONDED: 'Жооп берди',
  QUALIFIED: 'Тандалды',
  UNQUALIFIED: 'Туура келбеди',
  FOLLOW_UP: 'Кайра байланыш',
  NO_RESPONSE: 'Жооп жок',
  PENDING_PAYMENT: 'Төлөм күтүлүүдө',
  ENROLLED: 'Катталды',
  DEFERRED: 'Кийинчерээк',
  LOST: 'Жоголду',
  DUPLICATE: 'Дубликат',
  TEST: 'Тест',
  ARCHIVED: 'Архив',
};

const courseTypeLabels: Record<string, string> = {
  video: 'Видео',
  offline: 'Оффлайн',
  online_live: 'Онлайн',
};

export default function LegacyContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<LegacyContactRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [courseTypeFilter, setCourseTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importingId, setImportingId] = useState<number | null>(null);

  const fetchContacts = useCallback(() => {
    setIsLoading(true);
    legacyContactsApi.list({
      search,
      status: statusFilter === 'all' ? undefined : statusFilter,
      source: sourceFilter === 'all' ? undefined : sourceFilter,
      courseType: courseTypeFilter === 'all' ? undefined : courseTypeFilter,
      page,
      limit: 20,
    })
      .then((res) => {
        setContacts(res.items as LegacyContactRow[]);
        setTotalPages(Math.max(res.totalPages || 1, 1));
      })
      .catch(() => {
        setContacts([]);
        setTotalPages(1);
      })
      .finally(() => setIsLoading(false));
  }, [courseTypeFilter, page, search, sourceFilter, statusFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter, courseTypeFilter]);

  const handleImport = async (contact: Pick<LegacyContactRow, 'id'>) => {
    setImportingId(contact.id);
    try {
      // importFromContact endpoint was removed in P1-3 - this feature is no longer available
      toast({ title: 'Бул функция жокко чыгарылды', description: 'Эски байланыштарды лидге өткөрүү мүмкүнчүлүгү алынды', variant: 'destructive' });
    } catch (error) {
      const friendly = getFriendlyError(error, { fallbackTitle: 'Эски байланышты лидге өткөрүү ишке ашкан жок' });
      toast({ title: friendly.title, description: friendly.description, variant: 'destructive' });
    } finally {
      setImportingId(null);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSource = sourceFilter === 'all' || contact.source === sourceFilter;
    const matchesCourseType = courseTypeFilter === 'all' || (contact.courseType || '') === courseTypeFilter;
    return matchesSource && matchesCourseType;
  });
  const mobileStatuses = Object.entries(statusLabels).filter(([value]) => (
    statusFilter === 'all' || value === statusFilter
  ));
  const groupedContacts = Object.fromEntries(
    mobileStatuses.map(([status]) => [status, filteredContacts.filter((contact) => contact.status === status)])
  );
  const visiblePageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter((pageNumber) => {
    if (totalPages <= 7) return true;
    return (
      pageNumber === 1
      || pageNumber === totalPages
      || Math.abs(pageNumber - page) <= 1
    );
  });

  const columns: Column<LegacyContactRow>[] = [
    { key: 'fullName', header: ky.common.name, render: (c) => <span className="font-medium">{c.fullName}</span> },
    { key: 'phone', header: ky.common.phone },
    { key: 'source', header: 'Булак', render: (c) => <span className="text-sm">{sourceLabels[c.source || ''] || c.source || '—'}</span> },
    { key: 'status', header: ky.common.status, render: (c) => <span className="text-sm">{statusLabels[c.status || ''] || c.status || '—'}</span> },
    { key: 'assignedToName', header: 'Жооптуу', render: (c) => <span className="text-sm">{c.assignedToName || 'Дайындалган эмес'}</span>, className: 'hidden lg:table-cell' },
    { key: 'courseName', header: 'Курс', render: (c) => <span className="text-sm">{c.courseName || '—'}</span>, className: 'hidden xl:table-cell' },
    { key: 'courseType', header: 'Курс түрү', render: (c) => <span className="text-sm">{courseTypeLabels[c.courseType || ''] || c.courseType || '—'}</span>, className: 'hidden xl:table-cell' },
    { key: 'contactAttempts', header: 'Аракет', render: (c) => <span className="text-sm">{c.contactAttempts ?? 0}</span>, className: 'hidden lg:table-cell' },
    { key: 'lastAttemptAt', header: 'Акыркы аракет', render: (c) => <span className="text-sm text-muted-foreground">{c.lastAttemptAt ? formatDate(c.lastAttemptAt) : '—'}</span>, className: 'hidden xl:table-cell' },
    { key: 'createdAt', header: 'Түзүлгөн күнү', render: (c) => <span className="text-sm text-muted-foreground">{c.createdAt ? formatDate(c.createdAt) : '—'}</span>, className: 'hidden lg:table-cell' },
    {
      key: 'actions', header: '', render: (c) => (
        <Button variant="outline" size="sm" className="gap-2" disabled={importingId === c.id} onClick={(e) => { e.stopPropagation(); void handleImport(c); }}>
          {importingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
          Лидге өткөрүү
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.legacyContacts.title} />
      <Card className="border-border/60 bg-muted/30">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">Бул бөлүм күнүмдүк CRM workflow үчүн эмес.</p>
            <p className="text-sm text-muted-foreground">
              Бул жерде эски contact жазууларын көрөсүз, тарыхый маалыматты текшересиз жана керектүүсүн жаңы lead workflow'га өткөрөсүз.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">Superadmin migration tool</div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Баары</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Булак" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бардык булак</SelectItem>
            {Object.entries(sourceLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={courseTypeFilter} onValueChange={setCourseTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Курс түрү" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бардык түрү</SelectItem>
            {Object.entries(courseTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:hidden space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Эски байланыш издөө..."
        />

        {isLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {ky.common.noData}
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory">
            <div className="flex gap-4">
              {mobileStatuses.map(([status, label]) => {
                const items = groupedContacts[status] ?? [];
                return (
                  <div key={status} className="flex h-[calc(100vh-16rem)] w-[calc(100vw-2rem)] shrink-0 snap-center flex-col rounded-3xl border bg-muted/30 p-3">
                    <div className="mb-3 shrink-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <div className="inline-flex rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {items.length}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed bg-background/70 px-3 py-6 text-center text-xs text-muted-foreground">
                          Бул этапта жазуу жок
                        </div>
                      ) : (
                        items.map((contact) => (
                          <div
                            key={contact.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/legacy-contacts/${contact.id}`)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(`/legacy-contacts/${contact.id}`);
                              }
                            }}
                            className="rounded-2xl border bg-background p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="truncate font-semibold text-foreground">{contact.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sourceLabels[contact.source || ''] || contact.source || '—'}
                                </p>
                              </div>
                              <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </div>

                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4 shrink-0" />
                                <span className="truncate">{contact.phone || '—'}</span>
                              </div>
                              {contact.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{contact.email}</span>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">Жооптуу: {contact.assignedToName || 'Дайындалган эмес'}</div>
                              <div className="text-xs text-muted-foreground">Аракет саны: {contact.contactAttempts ?? 0}</div>
                              <div className="text-xs text-muted-foreground">
                                Түзүлгөн күнү: {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('ky-KG') : '—'}
                              </div>
                              {contact.courseName && (
                                <div className="text-xs text-muted-foreground">
                                  Курс: {contact.courseName}
                                  {contact.courseType ? ` • ${courseTypeLabels[contact.courseType] || contact.courseType}` : ''}
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 w-full gap-2"
                              disabled={importingId === contact.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleImport(contact);
                              }}
                            >
                              {importingId === contact.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                              Лидге өткөрүү
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Бет {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1}>
                Артка
              </Button>
              <div className="flex items-center gap-1">
                {visiblePageNumbers.map((pageNumber, index) => {
                  const previousPage = visiblePageNumbers[index - 1];
                  const needsGap = previousPage && pageNumber - previousPage > 1;

                  return (
                    <div key={pageNumber} className="flex items-center gap-1">
                      {needsGap && <span className="px-1 text-xs text-muted-foreground">...</span>}
                      <Button
                        variant={pageNumber === page ? 'default' : 'outline'}
                        size="sm"
                        className="min-w-9"
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page >= totalPages}>
                Алга
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredContacts}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Эски байланыш издөө..."
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(c) => navigate(`/legacy-contacts/${c.id}`)}
        />
      </div>
    </div>
  );
}
