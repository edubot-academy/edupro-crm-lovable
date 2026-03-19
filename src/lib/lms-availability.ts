import type { LmsCourse, LmsGroup } from '@/types';

export function formatLmsDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ky-KG');
}

export function getSeatsLeft(group?: Pick<LmsGroup, 'availableSeats' | 'capacity' | 'currentStudentCount'> | null) {
  if (!group) return null;
  if (group.availableSeats != null) return group.availableSeats;
  if (group.capacity != null && group.currentStudentCount != null) {
    return Math.max(group.capacity - group.currentStudentCount, 0);
  }
  return null;
}

export function getLmsGroupAvailability(group?: LmsGroup | null) {
  if (!group) return { code: 'unknown', label: 'Маалымат жок', tone: 'outline' as const };

  const seatsLeft = getSeatsLeft(group);

  if (group.status === 'cancelled') {
    return { code: 'cancelled', label: 'Жокко чыгарылды', tone: 'destructive' as const };
  }
  if (group.status === 'completed') {
    return { code: 'completed', label: 'Аяктады', tone: 'secondary' as const };
  }
  if (group.status === 'planned') {
    return { code: 'planned', label: 'Баштала элек', tone: 'secondary' as const };
  }
  if (seatsLeft === 0) {
    return { code: 'full', label: 'Толду', tone: 'destructive' as const };
  }
  if (typeof seatsLeft === 'number' && seatsLeft > 0 && seatsLeft <= 3) {
    return { code: 'few_left', label: 'Орун аз', tone: 'secondary' as const };
  }
  if (group.status === 'open' || group.status === 'active') {
    return { code: 'open', label: 'Ачык', tone: 'default' as const };
  }

  return { code: 'unknown', label: 'Маалымат жок', tone: 'outline' as const };
}

export function getCourseSalesSummary(course?: LmsCourse | null) {
  if (!course) return [];

  const summary: string[] = [];

  if (course.courseType === 'video') summary.push('Видео курс');
  if (course.courseType === 'offline') summary.push('Оффлайн');
  if (course.courseType === 'online_live') summary.push('Онлайн түз эфир');
  if (course.startDate) summary.push(`Башталышы: ${formatLmsDate(course.startDate)}`);
  if (course.schedule) summary.push(course.schedule);
  if (course.availableSeats != null) summary.push(`Бош орун: ${course.availableSeats}`);

  return summary;
}
