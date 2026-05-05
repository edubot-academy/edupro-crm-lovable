import type { TimelineEvent, WhatsAppAccountStatus } from '@/types';

export function isWhatsAppTimelineEvent(event: TimelineEvent) {
  return event.type.startsWith('whatsapp_');
}

export function getWhatsAppEventDirection(event: TimelineEvent): 'inbound' | 'outbound' | 'status' {
  const rawDirection = typeof event.meta?.direction === 'string' ? event.meta.direction : null;
  if (rawDirection === 'inbound' || event.type.includes('received')) {
    return 'inbound';
  }
  if (rawDirection === 'outbound' || event.type.includes('sent')) {
    return 'outbound';
  }
  return 'status';
}

export function getWhatsAppEventLabel(event: TimelineEvent) {
  if (event.type.includes('received')) return 'Кирген билдирүү';
  if (event.type.includes('sent')) return 'Жөнөтүлгөн билдирүү';
  if (event.type.includes('delivered')) return 'Жеткирилди';
  if (event.type.includes('read')) return 'Окулду';
  if (event.type.includes('failed')) return 'Жеткирилген жок';
  return 'WhatsApp окуясы';
}

export function formatWhatsAppMessageType(value: unknown) {
  if (value === 'text') return 'Текст';
  if (value === 'image') return 'Сүрөт';
  if (value === 'audio') return 'Аудио';
  if (value === 'video') return 'Видео';
  if (value === 'document') return 'Документ';
  if (value === 'location') return 'Жайгашкан жер';
  if (value === 'contact') return 'Контакт';
  if (value === 'interactive') return 'Интерактив';
  if (value === 'button') return 'Баскыч';
  if (value === 'list') return 'Тизме';
  if (value === 'template') return 'Шаблон';
  if (value === 'unknown') return 'Белгисиз формат';
  return 'Башка формат';
}

export function formatWhatsAppStatus(value: WhatsAppAccountStatus | string | null | undefined) {
  if (value === 'connected') return 'Туташкан';
  if (value === 'pending') return 'Текшерүү күтүлүүдө';
  if (value === 'disabled') return 'Өчүрүлгөн';
  if (value === 'failed') return 'Ката бар';
  return 'Белгисиз';
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ky-KG', { dateStyle: 'short', timeStyle: 'short' });
}
