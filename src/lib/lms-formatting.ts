import type { LmsCourseType } from '@/types/lms';

export const lmsCourseTypeLabels: Record<LmsCourseType, string> = {
  video: 'Видео',
  offline: 'Оффлайн',
  online_live: 'Онлайн түз эфир',
};

export const leadInterestLevelLabels: Record<'low' | 'medium' | 'high', string> = {
  low: 'Төмөн',
  medium: 'Орто',
  high: 'Жогорку',
};

export function formatLmsCourseType(value?: LmsCourseType | null) {
  if (!value) return '—';
  return lmsCourseTypeLabels[value] ?? value;
}
