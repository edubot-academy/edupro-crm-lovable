import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageShell';
import { DataTable, type Column } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ky } from '@/lib/i18n';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import type { LmsCourse, LmsGroup } from '@/types';
import type { LmsCourseType, LmsGroupStatus } from '@/types/lms';
import { formatLmsDate, getCourseSalesSummary, getLmsGroupAvailability, getSeatsLeft } from '@/lib/lms-availability';
import { BookOpen, CalendarDays, Clock3, Users } from 'lucide-react';

const courseTypeLabels: Record<LmsCourseType, string> = {
  video: 'Видео',
  offline: 'Оффлайн',
  online_live: 'Онлайн түз эфир',
};

const groupStatusOptions: Array<{ value: 'all' | LmsGroupStatus; label: string }> = [
  { value: 'all', label: ky.courses.allStatuses },
  { value: 'planned', label: 'Баштала элек' },
  { value: 'open', label: 'Ачык' },
  { value: 'active', label: 'Активдүү' },
  { value: 'completed', label: 'Аяктады' },
  { value: 'cancelled', label: 'Жокко чыгарылды' },
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [courseType, setCourseType] = useState<'all' | LmsCourseType>('all');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [groupStatus, setGroupStatus] = useState<'all' | LmsGroupStatus>('all');
  const [onlyWithSeats, setOnlyWithSeats] = useState(false);

  const coursesQuery = useLmsCourses({
    isActive: 'true',
    search: search || undefined,
    courseType: courseType === 'all' ? undefined : courseType,
    limit: 100,
  });

  const courses = coursesQuery.data?.items ?? [];
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId],
  );

  const groupsQuery = useLmsGroups(
    selectedCourse
      ? {
          courseId: selectedCourse.id,
          status: groupStatus === 'all' ? undefined : groupStatus,
          limit: 100,
        }
      : undefined,
  );

  const groups = useMemo(() => {
    const items = groupsQuery.data?.items ?? [];
    return items.filter((group) => !onlyWithSeats || (getSeatsLeft(group) ?? 0) > 0);
  }, [groupsQuery.data, onlyWithSeats]);

  const openDealPrefill = (course: LmsCourse, group?: LmsGroup | null) => {
    const params = new URLSearchParams({
      create: '1',
      courseId: course.id,
    });
    if (course.courseType) params.set('courseType', course.courseType);
    if (group?.id) params.set('groupId', group.id);
    navigate(`/deals?${params.toString()}`);
  };

  const openEnrollmentPrefill = (course: LmsCourse, group?: LmsGroup | null) => {
    const params = new URLSearchParams({
      courseId: course.id,
    });
    if (course.courseType) params.set('courseType', course.courseType);
    if (group?.id) params.set('groupId', group.id);
    navigate(`/enrollments?${params.toString()}`);
  };

  const columns: Column<LmsCourse>[] = [
    {
      key: 'name',
      header: ky.deals.course,
      render: (course) => <span className="font-medium">{course.name}</span>,
    },
    {
      key: 'courseType',
      header: ky.courses.courseType,
      render: (course) => (
        <Badge variant="outline">
          {course.courseType ? courseTypeLabels[course.courseType] : '—'}
        </Badge>
      ),
    },
    {
      key: 'teacherName',
      header: ky.courses.teacher,
      render: (course) => course.teacherName || '—',
    },
    {
      key: 'startDate',
      header: ky.courses.startDate,
      render: (course) => formatLmsDate(course.startDate) || '—',
    },
    {
      key: 'availability',
      header: ky.courses.availability,
      render: (course) => (
        <span className="text-sm text-muted-foreground">
          {course.availableSeats != null ? `${course.availableSeats} орун бош` : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (course) => (
        <div className="flex flex-wrap gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDealPrefill(course); }}>
            Келишим ачуу
          </Button>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); openEnrollmentPrefill(course); }}>
            Каттоого өтүү
          </Button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (course: LmsCourse) => (
    <Card className="shadow-card border-border/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{course.name}</p>
            <p className="text-sm text-muted-foreground">
              {course.courseType ? courseTypeLabels[course.courseType] : '—'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedCourseId(course.id)}>
              {ky.common.view}
            </Button>
            <Button size="sm" onClick={() => openEnrollmentPrefill(course)}>
              Каттоо
            </Button>
          </div>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{course.teacherName || 'Мугалим дайындала элек'}</p>
          <p>{getCourseSalesSummary(course).slice(1).join(' • ') || 'Маалымат жок'}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={ky.courses.title} description={ky.courses.description} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Select value={courseType} onValueChange={(value) => setCourseType(value as 'all' | LmsCourseType)}>
              <SelectTrigger>
                <SelectValue placeholder={ky.courses.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ky.courses.allTypes}</SelectItem>
                <SelectItem value="video">Видео</SelectItem>
                <SelectItem value="offline">Оффлайн</SelectItem>
                <SelectItem value="online_live">Онлайн түз эфир</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCourse?.id || '__none__'} onValueChange={(value) => setSelectedCourseId(value === '__none__' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder={ky.courses.selectCourse} />
              </SelectTrigger>
              <SelectContent>
                {!courses.length && <SelectItem value="__none__">{ky.courses.noCourses}</SelectItem>}
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={courses}
            isLoading={coursesQuery.isLoading}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Курс издөө..."
            onRowClick={(course) => setSelectedCourseId(course.id)}
            renderMobileCard={renderMobileCard}
          />
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">{selectedCourse?.name || ky.courses.liveInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedCourse ? (
              <p className="text-sm text-muted-foreground">{ky.courses.selectCourse}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.courseType && (
                    <Badge variant="outline">{courseTypeLabels[selectedCourse.courseType]}</Badge>
                  )}
                  {selectedCourse.status && <Badge variant="secondary">{selectedCourse.status}</Badge>}
                  <Button size="sm" variant="outline" onClick={() => openDealPrefill(selectedCourse)}>
                    Келишим ачуу
                  </Button>
                  <Button size="sm" onClick={() => openEnrollmentPrefill(selectedCourse)}>
                    Каттоого өтүү
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4" />{ky.courses.startDate}</div>
                    <p className="text-muted-foreground">{formatLmsDate(selectedCourse.startDate) || 'Такталган эмес'}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2 font-medium"><Clock3 className="h-4 w-4" />{ky.courses.schedule}</div>
                    <p className="text-muted-foreground">{selectedCourse.schedule || 'Такталган эмес'}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2 font-medium"><Users className="h-4 w-4" />{ky.courses.seats}</div>
                    <p className="text-muted-foreground">
                      {selectedCourse.capacity != null ? `${selectedCourse.currentStudentCount ?? 0}/${selectedCourse.capacity}` : 'Чектелген эмес'}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2 font-medium"><BookOpen className="h-4 w-4" />{ky.courses.teacher}</div>
                    <p className="text-muted-foreground">{selectedCourse.teacherName || 'Дайындала элек'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select value={groupStatus} onValueChange={(value) => setGroupStatus(value as 'all' | LmsGroupStatus)}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder={ky.courses.allStatuses} />
                    </SelectTrigger>
                    <SelectContent>
                      {groupStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant={onlyWithSeats ? 'default' : 'outline'}
                    onClick={() => setOnlyWithSeats((current) => !current)}
                  >
                    {ky.courses.withSeats}
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">{ky.courses.groups}</p>
                  {groupsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{ky.common.loading}</p>
                  ) : groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{ky.courses.noGroups}</p>
                  ) : (
                    groups.map((group: LmsGroup) => {
                      const availability = getLmsGroupAvailability(group);
                      return (
                        <div key={group.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{group.name}</p>
                              <p className="text-xs text-muted-foreground">{group.teacherName || 'Мугалим дайындала элек'}</p>
                            </div>
                            <Badge variant={availability.tone}>{availability.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {group.startDate ? `Башталышы: ${formatLmsDate(group.startDate)}` : 'Башталышы: такталган эмес'}
                            {group.schedule ? ` • ${group.schedule}` : ''}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {group.capacity != null ? `Орун: ${group.currentStudentCount ?? 0}/${group.capacity}` : 'Орун чеги жок'}
                            {getSeatsLeft(group) != null ? ` • Бош орун: ${getSeatsLeft(group)}` : ''}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button size="sm" variant="outline" onClick={() => openDealPrefill(selectedCourse, group)}>
                              Келишим ачуу
                            </Button>
                            <Button size="sm" onClick={() => openEnrollmentPrefill(selectedCourse, group)}>
                              Каттоого өтүү
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
