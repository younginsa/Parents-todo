import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { DEMO_TODAY } from "@/lib/config";
import { getDateFnsLocale } from "@/lib/i18n";
import type { AppLocale } from "@/types";

export function toDateOnly(value: string | null | undefined) {
  if (!value) return null;
  return parseISO(value);
}

export function formatShortDate(
  value: string | null | undefined,
  locale: AppLocale = "ko",
) {
  if (!value) return "No date";
  return format(parseISO(value), locale === "ko" ? "M월 d일" : "MMM d", {
    locale: getDateFnsLocale(locale),
  });
}

export function formatLongDate(
  value: string | null | undefined,
  locale: AppLocale = "ko",
) {
  if (!value) return "No date";
  return format(parseISO(value), locale === "ko" ? "M월 d일 (EEE)" : "EEE, MMM d", {
    locale: getDateFnsLocale(locale),
  });
}

export function formatMonthYear(value: string, locale: AppLocale = "ko") {
  return format(parseISO(value), locale === "ko" ? "yyyy년 M월" : "MMMM yyyy", {
    locale: getDateFnsLocale(locale),
  });
}

export function getMonthDays(monthDate: string) {
  const month = parseISO(monthDate);
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const dates: Date[] = [];
  let cursor = start;

  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export function sameDay(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  return isSameDay(parseISO(a), parseISO(b));
}

export function getTaskTimeBucket(date: string | null) {
  if (!date) return "No Date";

  const delta = differenceInCalendarDays(parseISO(date), parseISO(DEMO_TODAY));

  if (delta <= 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta <= 7) return "This Week";
  return "Later";
}

function formatWeekRange(start: Date, end: Date, locale: AppLocale) {
  const dfLocale = getDateFnsLocale(locale);
  const sameMonth = start.getMonth() === end.getMonth();

  if (locale === "ko") {
    const startStr = format(start, "M월 d일", { locale: dfLocale });
    const endStr = sameMonth
      ? format(end, "d일", { locale: dfLocale })
      : format(end, "M월 d일", { locale: dfLocale });
    return `${startStr} ~ ${endStr}`;
  }

  const startStr = format(start, "MMM d", { locale: dfLocale });
  const endStr = sameMonth
    ? format(end, "d", { locale: dfLocale })
    : format(end, "MMM d", { locale: dfLocale });
  return `${startStr} ~ ${endStr}`;
}

export function formatBucketDateMeta(
  bucket: "Today" | "Tomorrow" | "This Week" | "Later" | "No Date",
  locale: AppLocale,
): string | null {
  const today = parseISO(DEMO_TODAY);

  if (bucket === "Today") return formatLongDate(DEMO_TODAY, locale);
  if (bucket === "Tomorrow") {
    return formatLongDate(format(addDays(today, 1), "yyyy-MM-dd"), locale);
  }
  if (bucket === "This Week") {
    return formatWeekRange(addDays(today, 2), addDays(today, 7), locale);
  }

  return null;
}
