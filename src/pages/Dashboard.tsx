import { useState, useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import { PageHeader, PageLoading } from '@/components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ky } from '@/lib/i18n';
import { dashboardApi } from '@/api/modules';
import type { DashboardStats } from '@/types';
import {
  Users, UserPlus, TrendingUp, Target,
  CreditCard, Trophy, AlertTriangle, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(220,70%,50%)', 'hsl(167,65%,44%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(200,80%,50%)', 'hsl(280,60%,50%)'];

// Mock data — used as fallback when API is unavailable
const mockStats: DashboardStats = {
  totalLeads: 342,
  newLeads: 28,
  conversionRate: 23.5,
  trialToSaleConversion: 67.8,
  paymentPendingCount: 12,
  wonDeals: 156,
  openRetentionCases: 8,
  leadsBySource: [
    { source: 'Instagram', count: 89 },
    { source: 'Telegram', count: 72 },
    { source: 'WhatsApp', count: 56 },
    { source: 'Веб-сайт', count: 48 },
    { source: 'Телефон', count: 42 },
    { source: 'Сунуштоо', count: 35 },
  ],
  managerPerformance: [
    { manager: 'Айбек', leads: 45, deals: 12, conversion: 26.7 },
    { manager: 'Нургуль', leads: 38, deals: 14, conversion: 36.8 },
    { manager: 'Эрлан', leads: 52, deals: 11, conversion: 21.2 },
    { manager: 'Жылдыз', leads: 33, deals: 9, conversion: 27.3 },
  ],
  popularCourses: [
    { course: 'Python', enrollments: 45 },
    { course: 'JavaScript', enrollments: 38 },
    { course: 'UI/UX Design', enrollments: 29 },
    { course: 'Data Science', enrollments: 22 },
    { course: 'English B1', enrollments: 18 },
  ],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then(setStats)
      .catch(() => setStats(mockStats))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.dashboard.title} />

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
                  <Pie data={stats.leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={90} label={({ source, count }) => `${source}: ${count}`}>
                    {stats.leadsBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(220,70%,50%)" radius={[4, 4, 0, 0]} name="Лидтер" />
                  <Bar dataKey="deals" fill="hsl(167,65%,44%)" radius={[4, 4, 0, 0]} name="Келишимдер" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
