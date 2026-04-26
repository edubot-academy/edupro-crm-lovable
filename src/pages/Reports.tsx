import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { PageError, PageHeader, PageLoading } from '@/components/PageShell';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ky } from '@/lib/i18n';
import { reportsApi } from '@/api/modules';
import type { DashboardStats, DashboardStatsQueryParams, CrmDashboardStats, EducationDashboardStats } from '@/types';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { useLmsBridge } from '@/components/lms/LmsBridgeProvider';
import { useTenantConfig } from '@/components/core/TenantConfigProvider';
import { useFeatureFlags } from '@/components/core/FeatureFlagProvider';
import {
  Users, UserPlus, TrendingUp, Target, CreditCard, Trophy,
  AlertTriangle, Download, RefreshCw, GraduationCap,
  BarChart3, PieChart as PieChartIcon, Activity, DollarSign,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';

const COLORS = [
  'hsl(220, 70%, 50%)', 'hsl(167, 65%, 44%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)', 'hsl(200, 80%, 50%)', 'hsl(280, 60%, 50%)',
  'hsl(140, 60%, 45%)', 'hsl(30, 80%, 55%)',
];

const emptyCrmStats: CrmDashboardStats = {
  totalLeads: 0,
  newLeads: 0,
  conversionRate: 0,
  paymentPendingCount: 0,
  wonDeals: 0,
  openRetentionCases: 0,
  leadsBySource: [],
  managerPerformance: [],
};

const emptyEducationStats: EducationDashboardStats = {
  trialToSaleConversion: 0,
  popularCourses: [],
};

const emptyPaymentReports = {
  totalAmount: 0,
  totalCount: 0,
  byStatus: {
    confirmed: { count: 0, amount: 0 },
    submitted: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
  },
  byMethod: [],
  byCourse: [],
  byManager: [],
};

const emptyRevenueReports = {
  totalRevenue: 0,
  paymentCount: 0,
  averagePayment: 0,
  trend: [],
};

// CSV export helper
function exportCSV(stats: DashboardStats, isLmsEnabled: boolean) {
  const rows: string[] = [];
  rows.push('Метрика,Маани');
  rows.push(`Жалпы лидтер,${stats.totalLeads}`);
  rows.push(`Жаңы лидтер,${stats.newLeads}`);
  rows.push(`Конверсия %,${stats.conversionRate}`);
  if (isLmsEnabled) {
    rows.push(`Сыноодон сатуу %,${stats.trialToSaleConversion}`);
  }
  rows.push(`Төлөм күтүлүүдө,${stats.paymentPendingCount}`);
  rows.push(`Утулган келишимдер,${stats.wonDeals}`);
  rows.push(`Ачык тобокелдик,${stats.openRetentionCases}`);
  rows.push('');
  rows.push('Булак,Саны');
  stats.leadsBySource.forEach((s) => rows.push(`${s.source},${s.count}`));
  rows.push('');
  rows.push('Менеджер,Лидтер,Келишимдер,Конверсия %');
  stats.managerPerformance.forEach((m) => rows.push(`${m.manager},${m.leads},${m.deals},${m.conversion}`));
  if (isLmsEnabled) {
    rows.push('');
    rows.push('Курс,Каттоолор');
    stats.popularCourses.forEach((c) => rows.push(`${c.course},${c.enrollments}`));
  }

  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { isLmsBridgeEnabled } = useLmsBridge();
  const { tenantConfig } = useTenantConfig();
  const { isFeatureEnabled } = useFeatureFlags();
  const [searchParams, setSearchParams] = useSearchParams();
  const getSearchParam = (key: string, fallback = '') => searchParams.get(key) ?? fallback;
  const [stats, setStats] = useState<DashboardStats>({ ...emptyCrmStats, ...emptyEducationStats });
  const [paymentReports, setPaymentReports] = useState(emptyPaymentReports);
  const [revenueReports, setRevenueReports] = useState(emptyRevenueReports);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>(() => getSearchParam('date', 'all'));
  const [customFromDate, setCustomFromDate] = useState<string>(() => getSearchParam('from'));
  const [customToDate, setCustomToDate] = useState<string>(() => getSearchParam('to'));
  const [sourceFilter, setSourceFilter] = useState(() => getSearchParam('source', 'all'));
  const [managerFilter, setManagerFilter] = useState(() => getSearchParam('manager', 'all'));
  const [courseFilter, setCourseFilter] = useState(() => isLmsBridgeEnabled ? getSearchParam('course', 'all') : 'all');

  const fetchStats = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const params: DashboardStatsQueryParams = {};
    if (dateFilter === 'today') {
      const today = new Date();
      params.from = format(today, 'yyyy-MM-dd');
      params.to = format(today, 'yyyy-MM-dd');
    } else if (dateFilter === 'week') {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      params.from = format(startOfWeek, 'yyyy-MM-dd');
      params.to = format(today, 'yyyy-MM-dd');
    } else if (dateFilter === 'month') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      params.from = format(startOfMonth, 'yyyy-MM-dd');
      params.to = format(today, 'yyyy-MM-dd');
    } else if (dateFilter === 'custom') {
      if (customFromDate) params.from = customFromDate;
      if (customToDate) params.to = customToDate;
    }
    if (sourceFilter !== 'all') params.source = sourceFilter;
    if (managerFilter !== 'all') params.managerId = managerFilter;
    if (isLmsBridgeEnabled && courseFilter !== 'all') params.courseId = courseFilter;

    Promise.all([
      reportsApi.getStats(params),
      reportsApi.getPaymentReports(params as Record<string, string | number | undefined>),
      reportsApi.getRevenueReports(params as Record<string, string | number | undefined>),
    ])
      .then(([statsData, paymentData, revenueData]) => {
        setStats(statsData);
        setPaymentReports(paymentData);
        setRevenueReports(revenueData);
      })
      .catch(() => {
        setStats({ ...emptyCrmStats, ...emptyEducationStats });
        setPaymentReports(emptyPaymentReports);
        setRevenueReports(emptyRevenueReports);
        setError('Отчет маалыматтарын жүктөө мүмкүн болгон жок. Кийинчерээк кайра аракет кылыңыз.');
      })
      .finally(() => setIsLoading(false));
  }, [dateFilter, customFromDate, customToDate, sourceFilter, managerFilter, courseFilter, isLmsBridgeEnabled]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const nextDate = searchParams.get('date') ?? 'all';
    const nextFrom = searchParams.get('from') ?? '';
    const nextTo = searchParams.get('to') ?? '';
    const nextSource = searchParams.get('source') ?? 'all';
    const nextManager = searchParams.get('manager') ?? 'all';
    const nextCourse = isLmsBridgeEnabled ? (searchParams.get('course') ?? 'all') : 'all';

    if (nextDate !== dateFilter) setDateFilter(nextDate);
    if (nextFrom !== customFromDate) setCustomFromDate(nextFrom);
    if (nextTo !== customToDate) setCustomToDate(nextTo);
    if (nextSource !== sourceFilter) setSourceFilter(nextSource);
    if (nextManager !== managerFilter) setManagerFilter(nextManager);
    if (nextCourse !== courseFilter) setCourseFilter(nextCourse);
  }, [searchParams, isLmsBridgeEnabled]);

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (dateFilter !== 'all') next.set('date', dateFilter);
      else next.delete('date');

      if (dateFilter === 'custom' && customFromDate) next.set('from', customFromDate);
      else next.delete('from');

      if (dateFilter === 'custom' && customToDate) next.set('to', customToDate);
      else next.delete('to');

      if (sourceFilter !== 'all') next.set('source', sourceFilter);
      else next.delete('source');

      if (managerFilter !== 'all') next.set('manager', managerFilter);
      else next.delete('manager');

      if (isLmsBridgeEnabled && courseFilter !== 'all') next.set('course', courseFilter);
      else next.delete('course');

      return next.toString() === current.toString() ? current : next;
    }, { replace: true });
  }, [dateFilter, customFromDate, customToDate, sourceFilter, managerFilter, courseFilter, setSearchParams, isLmsBridgeEnabled]);

  // Filtered data for client-side filtering
  const filteredSources = sourceFilter === 'all'
    ? stats.leadsBySource
    : stats.leadsBySource.filter((s) => s.source === sourceFilter);

  const filteredManagers = managerFilter === 'all'
    ? stats.managerPerformance
    : stats.managerPerformance.filter((m) => m.manager === managerFilter);

  const filteredCourses = courseFilter === 'all'
    ? stats.popularCourses
    : stats.popularCourses.filter((c) => c.course === courseFilter);

  // Derived metrics
  const totalFromSources = filteredSources.reduce((s, x) => s + x.count, 0);
  const avgConversion = filteredManagers.length
    ? (filteredManagers.reduce((s, m) => s + m.conversion, 0) / filteredManagers.length).toFixed(1)
    : '0';
  const totalEnrollments = filteredCourses.reduce((s, c) => s + c.enrollments, 0);

  // Radial data for trial conversion
  const trialRadial = [
    { name: 'Конверсия', value: stats.trialToSaleConversion, fill: 'hsl(167, 65%, 44%)' },
  ];

  if (isLoading) return <PageLoading />;

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={ky.reports.title}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Жаңыртуу
              </Button>
            </div>
          }
        />
        <PageError message={error} onRetry={fetchStats} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title={ky.reports.title}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Жаңыртуу
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(stats, isLmsBridgeEnabled)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> CSV Экспорт
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
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
            <Separator orientation="vertical" className="h-8 hidden sm:block" />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-[150px]"><SelectValue placeholder="Булак" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бардык булактар</SelectItem>
                {stats.leadsBySource.map((s) => <SelectItem key={s.source} value={s.source}>{s.source}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-[150px]"><SelectValue placeholder="Менеджер" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бардык менеджерлер</SelectItem>
                {stats.managerPerformance.map((m) => <SelectItem key={m.manager} value={m.manager}>{m.manager}</SelectItem>)}
              </SelectContent>
            </Select>
            {isLmsBridgeEnabled && (
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="h-9 w-full text-xs sm:w-[150px]"><SelectValue placeholder="Курс" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бардык курстар</SelectItem>
                  {stats.popularCourses.map((c) => <SelectItem key={c.course} value={c.course}>{c.course}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {(dateFilter !== 'all' || customFromDate || customToDate || sourceFilter !== 'all' || managerFilter !== 'all' || (isLmsBridgeEnabled && courseFilter !== 'all')) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-9"
                onClick={() => {
                  setDateFilter('all');
                  setCustomFromDate('');
                  setCustomToDate('');
                  setSourceFilter('all');
                  setManagerFilter('all');
                  setCourseFilter('all');
                }}
              >
                Тазалоо
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`flex w-full min-w-max items-center justify-start gap-1 overflow-x-auto rounded-lg p-1 lg:inline-grid lg:w-auto ${isLmsBridgeEnabled ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} ${isFeatureEnabled('retention_enabled') ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <TabsTrigger value="overview" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Жалпы</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Сатуу</TabsTrigger>
          {isLmsBridgeEnabled && (
            <TabsTrigger value="courses" className="text-xs gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Курстар</TabsTrigger>
          )}
          <TabsTrigger value="payments" className="text-xs gap-1.5"><DollarSign className="h-3.5 w-3.5" />Төлөмдөр</TabsTrigger>
          {isFeatureEnabled('retention_enabled') && (
            <TabsTrigger value="retention" className="text-xs gap-1.5"><Activity className="h-3.5 w-3.5" />Тобокелдик</TabsTrigger>
          )}
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={ky.dashboard.totalLeads} value={stats.totalLeads} icon={Users} variant="primary" />
            <StatCard title={ky.dashboard.newLeads} value={stats.newLeads} icon={UserPlus} variant="info" />
            <StatCard title={ky.dashboard.conversionRate} value={`${stats.conversionRate}%`} icon={TrendingUp} variant="success" />
            <StatCard title={ky.dashboard.wonDeals} value={stats.wonDeals} icon={Trophy} variant="success" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLmsBridgeEnabled && (
              <StatCard title={ky.dashboard.trialConversion} value={`${stats.trialToSaleConversion}%`} icon={Target} variant="success" />
            )}
            <StatCard title={ky.dashboard.paymentPending} value={stats.paymentPendingCount} icon={CreditCard} variant="warning" />
            {isFeatureEnabled('retention_enabled') && (
              <StatCard title={ky.dashboard.openRetention} value={stats.openRetentionCases} icon={AlertTriangle} variant="destructive" />
            )}
          </div>

          {/* Leads by Source — Pie + Bar */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  {ky.dashboard.leadsBySource}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Жалпы: {totalFromSources} лид</p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={filteredSources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {filteredSources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v} лид`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{ky.dashboard.leadsBySource} — Деталдуу</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredSources}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(v: number) => `${v} лид`} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Лидтер">
                        {filteredSources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== SALES TAB ===== */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Жалпы лидтер" value={filteredManagers.reduce((s, m) => s + m.leads, 0)} icon={Users} variant="primary" />
            <StatCard title="Жалпы келишимдер" value={filteredManagers.reduce((s, m) => s + m.deals, 0)} icon={Trophy} variant="success" />
            <StatCard title="Орточо конверсия" value={`${avgConversion}%`} icon={TrendingUp} variant="info" />
          </div>

          {/* Manager Performance */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{ky.dashboard.managerPerformance}</CardTitle>
              <p className="text-xs text-muted-foreground">{filteredManagers.length} менеджер</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredManagers} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="manager" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} name="Лидтер" />
                    <Bar dataKey="deals" fill="hsl(167, 65%, 44%)" radius={[4, 4, 0, 0]} name="Келишимдер" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Conversion by Manager */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Конверсия пайызы (менеджер боюнча)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredManagers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="manager" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="conversion" radius={[0, 4, 4, 0]} name="Конверсия">
                      {filteredManagers.map((m, i) => (
                        <Cell key={i} fill={m.conversion >= 30 ? 'hsl(167, 65%, 44%)' : m.conversion >= 20 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Manager Table */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Менеджер жыйынтык таблицасы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Менеджер</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Лидтер</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Келишимдер</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Конверсия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredManagers.map((m) => (
                      <tr key={m.manager} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{m.manager}</td>
                        <td className="py-2.5 px-3 text-right">{m.leads}</td>
                        <td className="py-2.5 px-3 text-right">{m.deals}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={cn('font-semibold', m.conversion >= 30 ? 'text-success' : m.conversion >= 20 ? 'text-warning' : 'text-destructive')}>
                            {m.conversion}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== COURSES TAB ===== */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Жалпы каттоолор" value={totalEnrollments} icon={GraduationCap} variant="primary" />
            <StatCard title="Курстар саны" value={filteredCourses.length} icon={GraduationCap} variant="info" />
            <StatCard title="Сыноодон сатуу" value={`${stats.trialToSaleConversion}%`} icon={Target} variant="success" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Popular Courses Bar */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{ky.dashboard.popularCourses}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredCourses} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="course" width={110} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `${v} каттоо`} />
                      <Bar dataKey="enrollments" radius={[0, 4, 4, 0]} name="Каттоолор">
                        {filteredCourses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Trial Conversion Radial */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Сыноо сабак конверсиясы</CardTitle>
                <p className="text-xs text-muted-foreground">Сыноодон катталганга өтүү пайызы</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={trialRadial} barSize={20}>
                      <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="-mt-16 text-center">
                  <p className="text-3xl font-bold text-success">{stats.trialToSaleConversion}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Сыноодон → катталуу</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses Table */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Курстар боюнча деталдуу</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Курс</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Каттоолор</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Үлүш</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses
                      .sort((a, b) => b.enrollments - a.enrollments)
                      .map((c, i) => (
                        <tr key={c.course} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                          <td className="py-2.5 px-3 font-medium">{c.course}</td>
                          <td className="py-2.5 px-3 text-right">{c.enrollments}</td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            {totalEnrollments > 0 ? ((c.enrollments / totalEnrollments) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PAYMENTS TAB ===== */}
        <TabsContent value="payments" className="space-y-6">
          {/* Payment Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Жалпы төлөмдөр" value={paymentReports.totalCount} icon={CreditCard} variant="primary" />
            <StatCard title="Жалпы сумма" value={`${paymentReports.totalAmount.toLocaleString()} ${tenantConfig.currency}`} icon={DollarSign} variant="success" />
            <StatCard title="Ырасталган" value={paymentReports.byStatus.confirmed.count} icon={Trophy} variant="success" />
            <StatCard title="Күтүлүүдө" value={paymentReports.byStatus.submitted.count} icon={AlertTriangle} variant="warning" />
          </div>

          {/* Revenue Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Жалпы киреше" value={`${revenueReports.totalRevenue.toLocaleString()} ${tenantConfig.currency}`} icon={DollarSign} variant="success" />
            <StatCard title="Төлөмдөр саны" value={revenueReports.paymentCount} icon={CreditCard} variant="info" />
            <StatCard title="Орточо төлөм" value={`${revenueReports.averagePayment.toLocaleString()} ${tenantConfig.currency}`} icon={TrendingUp} variant="info" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend Chart */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Киреше динамикасы
                </CardTitle>
                <p className="text-xs text-muted-foreground">Күн боюнча тастыкталган төлөмдөр</p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueReports.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString()} ${tenantConfig.currency}`} />
                      <Line type="monotone" dataKey="amount" stroke="hsl(167, 65%, 44%)" strokeWidth={2} dot={false} name="Кише" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Distribution */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Төлөм абалдары
                </CardTitle>
                <p className="text-xs text-muted-foreground">Статус боюнча бөлүштүрүү</p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Ырасталган', value: paymentReports.byStatus.confirmed.count, fill: 'hsl(167, 65%, 44%)' },
                          { name: 'Күтүлүүдө', value: paymentReports.byStatus.submitted.count, fill: 'hsl(38, 92%, 50%)' },
                          { name: 'Жокко чыгарылган', value: paymentReports.byStatus.failed.count, fill: 'hsl(0, 72%, 51%)' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="hsl(167, 65%, 44%)" />
                        <Cell fill="hsl(38, 92%, 50%)" />
                        <Cell fill="hsl(0, 72%, 51%)" />
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v} төлөм`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods & Revenue by Course */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Payment Methods */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Төлөм методу боюнча</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentReports.byMethod}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="method" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number, name: string) => [name === 'amount' ? `${v.toLocaleString()} ${tenantConfig.currency}` : `${v} шт`, name === 'amount' ? 'Сумма' : 'Саны']} />
                      <Legend />
                      <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} name="Саны" />
                      <Bar dataKey="amount" fill="hsl(167, 65%, 44%)" radius={[4, 4, 0, 0]} name="Сумма" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Course */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Курс боюнча кише</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentReports.byCourse.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="course" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString()} ${tenantConfig.currency}`} />
                      <Bar dataKey="amount" fill="hsl(200, 80%, 50%)" radius={[0, 4, 4, 0]} name="Кише" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manager Performance Table */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Менеджер боюнча төлөмдөр</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Менеджер</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Төлөмдөр</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Жалпы сумма</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Орточо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentReports.byManager.map((m) => (
                      <tr key={m.manager} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{m.manager}</td>
                        <td className="py-2.5 px-3 text-right">{m.count}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{m.amount.toLocaleString()} {tenantConfig.currency}</td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">
                          {m.count > 0 ? (m.amount / m.count).toFixed(0) : 0} {tenantConfig.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RETENTION TAB ===== */}
        {isFeatureEnabled('retention_enabled') && (
          <TabsContent value="retention" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title={ky.dashboard.openRetention} value={stats.openRetentionCases} icon={AlertTriangle} variant="destructive" />
              <StatCard title={ky.dashboard.paymentPending} value={stats.paymentPendingCount} icon={CreditCard} variant="warning" />
              <StatCard title="Конверсия" value={`${stats.conversionRate}%`} icon={TrendingUp} variant="success" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Retention Overview */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Тобокелдик сводкасы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Ачык учурлар', value: stats.openRetentionCases, color: 'bg-destructive' },
                      { label: 'Төлөм күтүлүүдө', value: stats.paymentPendingCount, color: 'bg-warning' },
                      { label: 'Жаңы лидтер (иштетилбеген)', value: stats.newLeads, color: 'bg-info' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Төлөм аналитикасы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Ырасталган келишимдер', value: stats.wonDeals, pct: stats.totalLeads ? ((stats.wonDeals / stats.totalLeads) * 100).toFixed(1) : '0' },
                      { label: 'Күтүлүүдө', value: stats.paymentPendingCount, pct: stats.totalLeads ? ((stats.paymentPendingCount / stats.totalLeads) * 100).toFixed(1) : '0' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{item.label}</span>
                          <span className="text-sm font-medium">{item.value} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
