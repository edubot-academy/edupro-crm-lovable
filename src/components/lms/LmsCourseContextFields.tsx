import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLmsCourses, useLmsGroups } from '@/hooks/use-lms';
import { formatLmsDate, getLmsGroupAvailability, getSeatsLeft } from '@/lib/lms-availability';
import { formatLmsCourseType } from '@/lib/lms-formatting';
import { getFriendlyError } from '@/lib/error-messages';
import type { LmsCourseType } from '@/types/lms';

interface LmsCourseContextFieldsProps {
  value: {
    lmsCourseId: string;
    lmsGroupId: string;
    courseType: LmsCourseType | '';
    courseNameSnapshot: string;
    groupNameSnapshot: string;
  };
  onChange: (next: {
    lmsCourseId: string;
    lmsGroupId: string;
    courseType: LmsCourseType | '';
    courseNameSnapshot: string;
    groupNameSnapshot: string;
  }) => void;
  courseLabel?: string;
  groupLabel?: string;
  description?: string;
  coursePlaceholder?: string;
  groupPlaceholder?: string;
  allowEmptyCourse?: boolean;
  allowEmptyGroup?: boolean;
  emptyCourseLabel?: string;
  emptyGroupLabel?: string;
  disabled?: boolean;
}

export function LmsCourseContextFields({
  value,
  onChange,
  courseLabel = 'LMS курс',
  groupLabel = 'LMS топ',
  description,
  coursePlaceholder = 'Курс тандаңыз',
  groupPlaceholder = 'Топ тандаңыз',
  allowEmptyCourse = true,
  allowEmptyGroup = true,
  emptyCourseLabel = 'Тандалган эмес',
  emptyGroupLabel = 'Тандалган эмес',
  disabled = false,
}: LmsCourseContextFieldsProps) {
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useLmsCourses({ isActive: 'true' });
  const courses = coursesData?.items ?? [];
  const selectedCourse = courses.find((course) => course.id === value.lmsCourseId) ?? null;
  const requiresGroup = !!selectedCourse && selectedCourse.courseType !== 'video';
  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useLmsGroups(
    requiresGroup ? { courseId: value.lmsCourseId, limit: 100 } : undefined,
  );
  const groups = groupsData?.items ?? [];
  const selectedGroup = groups.find((group) => group.id === value.lmsGroupId) ?? null;
  const lmsLoadError = coursesError || groupsError;
  const lmsErrorMessage = lmsLoadError
    ? getFriendlyError(lmsLoadError, { fallbackTitle: 'LMS кызматын жүктөө мүмкүн болгон жок' })
    : null;

  const handleCourseChange = (nextCourseId: string) => {
    if (!nextCourseId) {
      onChange({
        lmsCourseId: '',
        lmsGroupId: '',
        courseType: '',
        courseNameSnapshot: '',
        groupNameSnapshot: '',
      });
      return;
    }

    const nextCourse = courses.find((course) => course.id === nextCourseId) ?? null;
    onChange({
      lmsCourseId: nextCourseId,
      lmsGroupId: '',
      courseType: nextCourse?.courseType ?? '',
      courseNameSnapshot: nextCourse?.name ?? '',
      groupNameSnapshot: '',
    });
  };

  const availability = selectedGroup ? getLmsGroupAvailability(selectedGroup) : null;

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Окуу багыты</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      {lmsErrorMessage ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-medium">{lmsErrorMessage.title}</p>
          {lmsErrorMessage.description ? (
            <p className="mt-1 text-xs text-amber-800">{lmsErrorMessage.description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{courseLabel}</Label>
          <Select
            value={value.lmsCourseId || '__none__'}
            onValueChange={(next) => handleCourseChange(next === '__none__' ? '' : next)}
            disabled={disabled || coursesLoading || Boolean(lmsLoadError)}
          >
            <SelectTrigger>
              <SelectValue placeholder={coursesLoading ? 'Жүктөлүүдө...' : coursePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {allowEmptyCourse ? <SelectItem value="__none__">{emptyCourseLabel}</SelectItem> : null}
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Курс түрү</Label>
          <div className="flex min-h-10 items-center rounded-md border bg-background px-3 text-sm">
            {selectedCourse?.courseType ? (
              <Badge variant="outline">{formatLmsCourseType(selectedCourse.courseType)}</Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {requiresGroup ? (
        <div className="space-y-2">
          <Label>{groupLabel}</Label>
          <Select
            value={value.lmsGroupId || '__none__'}
            onValueChange={(next) => onChange({
              ...value,
              lmsGroupId: next === '__none__' ? '' : next,
              groupNameSnapshot: next === '__none__'
                ? ''
                : groups.find((group) => group.id === next)?.name ?? '',
            })}
            disabled={disabled || groupsLoading || Boolean(lmsLoadError)}
          >
            <SelectTrigger>
              <SelectValue placeholder={groupsLoading ? 'Жүктөлүүдө...' : groupPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {allowEmptyGroup ? <SelectItem value="__none__">{emptyGroupLabel}</SelectItem> : null}
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} {group.teacherName ? `• ${group.teacherName}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedGroup ? (
            <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                {availability ? <span>{availability.label}</span> : null}
                {getSeatsLeft(selectedGroup) !== null ? <span>{getSeatsLeft(selectedGroup)} орун калды</span> : null}
                {selectedGroup.startDate ? <span>Старт: {formatLmsDate(selectedGroup.startDate)}</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
