import type { ApiError } from '@/types';

type FriendlyErrorOptions = {
  fallbackTitle: string;
};

type FriendlyErrorResult = {
  title: string;
  description?: string;
};

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

function normalizeMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'object' && message !== null) {
    return JSON.stringify(message);
  }
  return String(message || '');
}

function stringifyDetails(details: unknown): string | undefined {
  if (!details) return undefined;

  if (typeof details === 'string') {
    return details;
  }

  if (Array.isArray(details)) {
    const values = details
      .map((item) => stringifyDetails(item))
      .filter(Boolean);
    return values.length ? values.join(', ') : undefined;
  }

  if (typeof details === 'object') {
    const values = Object.entries(details as Record<string, unknown>)
      .map(([key, value]) => {
        const nested = stringifyDetails(value);
        return nested ? `${key}: ${nested}` : undefined;
      })
      .filter(Boolean);
    return values.length ? values.join(', ') : undefined;
  }

  return undefined;
}

function withRequestId(description: string | undefined, requestId?: string): string | undefined {
  if (!requestId) return description;
  return description ? `${description} [Request ID: ${requestId}]` : `Request ID: ${requestId}`;
}

export function getFriendlyError(error: unknown, options: FriendlyErrorOptions): FriendlyErrorResult {
  if (!isApiError(error)) {
    return { title: options.fallbackTitle };
  }

  const rawMessage = normalizeMessage(error.message).trim();
  const details = stringifyDetails(error.details);
  const combined = `${rawMessage} ${details || ''}`.toLowerCase();

  if (error.status === 401) {
    return {
      title: 'Сеанс аяктады',
      description: 'Кайра кирип, аракетти дагы бир жолу кайталаңыз.',
    };
  }

  if (error.status === 403) {
    return {
      title: 'Бул аракетке уруксат жок',
      description: withRequestId('Эгер керек болсо администраторго кайрылыңыз.', error.requestId),
    };
  }

  if (error.status === 404) {
    return {
      title: 'Керектүү маалымат табылган жок',
      description: withRequestId(rawMessage || details, error.requestId),
    };
  }

  if (combined.includes('group id') || combined.includes('groupid') || combined.includes('lmsgroupid') || combined.includes('group is required') || combined.includes('cohort')) {
    return {
      title: 'Топ тандоо керек',
      description: withRequestId('Бул операция үчүн LMS тобу керек. Алгач курс үчүн ылайыктуу топту тандаңыз же deal ичиндеги топту толуктаңыз.', error.requestId),
    };
  }

  if (combined.includes('course id') || combined.includes('courseid') || combined.includes('lmscourseid') || combined.includes('course is required')) {
    return {
      title: 'Курс тандоо керек',
      description: withRequestId('Аракетти улантуу үчүн курсту тандаңыз.', error.requestId),
    };
  }

  if (combined.includes('deal id') || combined.includes('dealid')) {
    return {
      title: 'Келишимди тандаңыз',
      description: withRequestId('Бул аракет deal менен байланыштуу. Алгач келишимди тандаңыз.', error.requestId),
    };
  }

  if (combined.includes('contact id') || combined.includes('contactid')) {
    return {
      title: 'Байланышты тандаңыз',
      description: withRequestId('Бул аракет үчүн байланыш карточкасы керек.', error.requestId),
    };
  }

  if (combined.includes('lead id') || combined.includes('leadid')) {
    return {
      title: 'Лидди тандаңыз',
      description: withRequestId('Бул аракет үчүн CRM лид керек.', error.requestId),
    };
  }

  if (combined.includes('scheduledat') || combined.includes('scheduled at') || combined.includes('schedule time') || combined.includes('invalid schedule')) {
    return {
      title: 'Пландалган убакыт туура эмес',
      description: withRequestId('Чалуу же жолугушуу үчүн так дата менен убакытты кайра тандаңыз.', error.requestId),
    };
  }

  if (combined.includes('already exists') || combined.includes('duplicate') || error.status === 409) {
    return {
      title: 'Мындай жазуу буга чейин бар',
      description: withRequestId(rawMessage || details, error.requestId),
    };
  }

  if (combined.includes('validation') || error.status === 400 || error.status === 422) {
    return {
      title: 'Айрым талаалар туура эмес толтурулган',
      description: withRequestId(rawMessage || details || 'Формадагы милдеттүү талааларды текшериңиз.', error.requestId),
    };
  }

  const description = withRequestId(
    rawMessage && rawMessage !== 'Request failed'
      ? rawMessage
      : details,
    error.requestId,
  );

  return {
    title: options.fallbackTitle,
    description,
  };
}
