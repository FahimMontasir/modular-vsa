type LocaleFormatters = {
  calendarDate: Intl.DateTimeFormat;
  fullDate: Intl.DateTimeFormat;
  relativeTime: Intl.RelativeTimeFormat;
  time: Intl.DateTimeFormat;
};

const localeFormatters = new Map<string, LocaleFormatters>();

export function formatNotificationDate(value: Date | string, now = new Date(), locale?: string) {
  const date = new Date(value);
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  const dayDifference = calendarDayNumber(now) - calendarDayNumber(date);

  if (date.getTime() > now.getTime()) return formatCalendarDate(date, locale);
  if (dayDifference === 1) return getLocaleFormatters(locale).relativeTime.format(-1, "day");
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
  if (elapsedSeconds < 3_600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3_600)}h ago`;

  return formatCalendarDate(date, locale);
}

function formatCalendarDate(date: Date, locale?: string) {
  const formatters = getLocaleFormatters(locale);
  const time = formatters.time.format(date);
  const calendarDate = formatters.calendarDate.format(date);
  return `${time} · ${calendarDate}`;
}

export function formatFullNotificationDate(value: Date | string, locale?: string) {
  return getLocaleFormatters(locale).fullDate.format(new Date(value));
}

function calendarDayNumber(value: Date) {
  return Math.floor(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86_400_000);
}

function getLocaleFormatters(locale?: string) {
  const key = locale ?? "default";
  const cached = localeFormatters.get(key);
  if (cached) return cached;
  const created = {
    // The formatter is cached per dynamic locale, which React Doctor documents as the exception.
    // oxlint-disable-next-line react-doctor/js-hoist-intl
    relativeTime: new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    // oxlint-disable-next-line react-doctor/js-hoist-intl
    time: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
    // oxlint-disable-next-line react-doctor/js-hoist-intl
    calendarDate: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    // oxlint-disable-next-line react-doctor/js-hoist-intl
    fullDate: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
  };
  localeFormatters.set(key, created);
  return created;
}
