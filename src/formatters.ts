import type { Language } from './i18n';

export const formatters = Object.fromEntries((['en', 'es-ES'] as const).map(language => {
  const locale = language === 'en' ? 'en-US' : language;
  return [language, {
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }),
    period: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    shortDate: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  }];
})) as Record<Language, { number: Intl.NumberFormat; date: Intl.DateTimeFormat; period: Intl.DateTimeFormat; shortDate: Intl.DateTimeFormat }>;
