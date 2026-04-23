import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/StatCard';
import { PageHeader, PageLoading } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ky } from '@/lib/i18n';
import { dashboardApi } from '@/api/modules';
import type { DashboardStats } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import {
  Users, UserPlus, TrendingUp, Target,
  CreditCard, Trophy, AlertTriangle, BookOpen, RefreshCw, Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['hsl(220,70%,50%)', 'hsl(167,65%,44%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(200,80%,50%)', 'hsl(280,60%,50%)'];

const emptyStats: DashboardStats = {
  totalLeads: 0,
  newLeads: 0,
  conversionRate: 0,
  trialToSaleConversion: 0,
  paymentPendingCount: 0,
  wonDeals: 0,
  openRetentionCases: 0,
  leadsBySource: [],
  managerPerformance: [],
  popularCourses: [],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const params: Record<string, string | undefined> = {};

    if (dateFilter === 'today') {
      const today = new Date();
      params.from = today.toISOString().split('T')[0];
      params.to = today.toISOString().split('T')[0];
    } else if (dateFilter === 'week') {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      params.from = startOfWeek.toISOString().split('T')[0];
      params.to = today.toISOString().split('T')[0];
    } else if (dateFilter === 'month') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      params.from = startOfMonth.toISOString().split('T')[0];
      params.to = today.toISOString().split('T')[0];
    } else if (dateFilter === 'custom') {
      if (customFromDate) params.from = customFromDate;
      if (customToDate) params.to = customToDate;
    }

    dashboardApi.getStats(params)
      .then((data) => {
        setStats(data);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        setError('Маалыматтарды жүктөөдө ката кетти');
        setStats(emptyStats);
        toast({
          variant: 'destructive',
          title: 'Ката',
          description: 'Башкы бет маалыматтарын жүктөө мүмкүн болбоду',
        });
      })
      .finally(() => setIsLoading(false));
  }, [dateFilter, customFromDate, customToDate, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatTimeSince = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Жаңы жаңылган';
    if (diffMins < 60) return `${diffMins} мүнөт мурда`;
    if (diffHours < 24) return `${diffHours} саат мурда`;
    return `${diffDays} күн мурда`;
  };

  const priorityItems = [
    {
      key: 'new-leads',
      title: 'Жаңы лиддер',
      value: stats.newLeads,
      description: 'Бүгүн биринчи байланыш же квалификация күтүп жаткан жаңы суроо-талаптар.',
      actionLabel: 'Лиддерди ачуу',
      onClick: () => navigate('/leads'),
      tone: 'border-info/40 bg-info/5',
    },
    {
      key: 'payments',
      title: ky.dashboard.paymentPending,
      value: stats.paymentPendingCount,
      description: 'Ырастоону же көзөмөлдү талап кылган төлөмдөр.',
      actionLabel: 'Төлөмдөргө өтүү',
      onClick: () => navigate('/payments'),
      tone: 'border-warning/40 bg-warning/5',
    },
    {
      key: 'retention',
      title: ky.dashboard.openRetention,
      value: stats.openRetentionCases,
      description: 'Сактап калуу аракетин талап кылган студент учурлары.',
      actionLabel: 'Тобокелдиктерди ачуу',
      onClick: () => navigate('/retention'),
      tone: 'border-destructive/40 bg-destructive/5',
    },
    {
      key: 'won',
      title: ky.dashboard.wonDeals,
      value: stats.wonDeals,
      description: 'Тандалган мезгилдеги ийгиликтүү жабылган келишимдер.',
      actionLabel: 'Келишимдерге өтүү',
      onClick: () => navigate('/deals'),
      tone: 'border-success/40 bg-success/5',
    },
  ];
  const topManager = [...stats.managerPerformance].sort((a, b) => b.conversion - a.conversion)[0];
  const topCourse = [...stats.popularCourses].sort((a, b) => b.enrollments - a.enrollments)[0];

  if (isLoading) return <PageLoading />;

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={ky.dashboard.title}
          actions={
            <Button onClick={fetchStats} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Жаңыртуу
            </Button>
          }
        />
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Маалыматтарды жүктөө мүмкүн болбоду</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={fetchStats} variant="outline">
              Кайра аракет кылуу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={ky.dashboard.title}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                {formatTimeSince(lastUpdated)}
              </span>
            )}
            <Button onClick={fetchStats} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Жаңыртуу
            </Button>
          </div>
        }
      />

      <DateRangeFilter
        value={dateFilter}
        onValueChange={setDateFilter}
        fromDate={customFromDate}
        toDate={customToDate}
        onFromDateChange={setCustomFromDate}
        onToDateChange={setCustomToDate}
        onClearCustom={() => {
          setCustomFromDate('');
          setCustomToDate('');
        }}
      />

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="rounded-full bg-secondary px-3 py-1">Жалпы лид: {stats.totalLeads}</span>
        <span className="rounded-full bg-secondary px-3 py-1">Конверсия: {stats.conversionRate}%</span>
        {topManager && (
          <span className="rounded-full bg-secondary px-3 py-1">Мыкты менеджер: {topManager.manager}</span>
        )}
        {topCourse && (
          <span className="rounded-full bg-secondary px-3 py-1">Алдыңкы курс: {topCourse.course}</span>
        )}
      </div>

      {/* Action-oriented priority cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {priorityItems.map((item) => (
          <Card key={item.key} className={`shadow-card ${item.tone}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold tracking-tight">{item.value}</div>
              <p className="min-h-[40px] text-sm text-muted-foreground">{item.description}</p>
              <Button variant="outline" size="sm" onClick={item.onClick}>
                {item.actionLabel}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Тез аракеттер</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/leads?create=1')}>
              <Plus className="mr-2 h-4 w-4" />
              {ky.leads.newLead}
            </Button>
            <Button variant="outline" onClick={() => navigate('/contacts?create=1')}>
              <Plus className="mr-2 h-4 w-4" />
              {ky.contacts.newContact}
            </Button>
            <Button variant="outline" onClick={() => navigate('/deals?create=1')}>
              <Plus className="mr-2 h-4 w-4" />
              {ky.deals.newDeal}
            </Button>
            <Button variant="outline" onClick={() => navigate('/tasks?create=1')}>
              <Plus className="mr-2 h-4 w-4" />
              {ky.tasks.newTask}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={ky.dashboard.totalLeads} value={stats.totalLeads} icon={Users} variant="primary" />
        <StatCard title={ky.dashboard.newLeads} value={stats.newLeads} icon={UserPlus} variant="info" />
        <StatCard title={ky.dashboard.conversionRate} value={`${stats.conversionRate}%`} icon={TrendingUp} variant="success" />
        <StatCard title={ky.dashboard.trialConversion} value={`${stats.trialToSaleConversion}%`} icon={Target} variant="success" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title={ky.dashboard.paymentPending} value={stats.paymentPendingCount} icon={CreditCard} variant="warning" />
        <StatCard title={ky.dashboard.wonDeals} value={stats.wonDeals} icon={Trophy} variant="success" />
        <StatCard title={ky.dashboard.openRetention} value={stats.openRetentionCases} icon={AlertTriangle} variant="destructive" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads by source */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{ky.dashboard.leadsBySource}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={90}>
                    {stats.leadsBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {stats.leadsBySource.map((item, index) => (
                <div key={item.source} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span>{item.source}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular courses */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {ky.dashboard.popularCourses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.popularCourses} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="course" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="hsl(220,70%,50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {topCourse && (
              <p className="mt-4 text-sm text-muted-foreground">
                Азыркы лидер: <span className="font-medium text-foreground">{topCourse.course}</span> ({topCourse.enrollments})
              </p>
            )}
          </CardContent>
        </Card>

        {/* Manager performance */}
        <Card className="shadow-card border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{ky.dashboard.managerPerformance}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.managerPerformance}>
                  <XAxis dataKey="manager" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'conversion') return `${value}%`;
                      return value;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="leads" fill="hsl(220,70%,50%)" radius={[4, 4, 0, 0]} name="Лидтер" />
                  <Bar yAxisId="left" dataKey="deals" fill="hsl(167,65%,44%)" radius={[4, 4, 0, 0]} name="Келишимдер" />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="hsl(38,92%,50%)" strokeWidth={2} name="Конверсия %" dot={{ r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {topManager && (
              <p className="mt-4 text-sm text-muted-foreground">
                Эң жогорку конверсия: <span className="font-medium text-foreground">{topManager.manager}</span> ({topManager.conversion}%)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
