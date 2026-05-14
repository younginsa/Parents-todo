"use client";

import { format, isSameMonth, parseISO } from "date-fns";
import { CheckSquare, Square } from "lucide-react";
import type { EventItem, PackingItem, TaskItem } from "@/types";
import { BIRTHDAYS, DEMO_TODAY } from "@/lib/config";
import { getMonthDays, sameDay } from "@/lib/date";
import { getWeekdayLabels, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MonthGridProps {
  monthDate: string;
  selectedDate: string;
  events: EventItem[];
  tasks: TaskItem[];
  packingItems: PackingItem[];
  onSelectDate: (date: string) => void;
}

type DayEntry = {
  id: string;
  title: string;
  tone: "event" | "task" | "packing" | "birthday";
  completedAt?: string | null;
};

export function MonthGrid({
  monthDate,
  selectedDate,
  events,
  tasks,
  packingItems,
  onSelectDate,
}: MonthGridProps) {
  const days = getMonthDays(monthDate);
  const month = parseISO(monthDate);
  const { locale, t } = useI18n();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 px-1 pb-3 text-center text-caption">
        {getWeekdayLabels(locale).map((label, index) => (
          <div
            key={label}
            className={cn(
              index === 0
                ? "text-danger/70"
                : index === 6
                  ? "text-brand/70"
                  : "text-muted",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayBirthdays = BIRTHDAYS.filter(
            (b) => b.month === day.getMonth() + 1 && b.day === day.getDate(),
          );
          const dayEntries: DayEntry[] = [
            ...dayBirthdays.map((b) => ({
              id: `bday-${b.name}-${dayKey}`,
              title: `🎂 ${t("birthday_label", { name: b.name })}`,
              tone: "birthday" as const,
            })),
            ...events
              .filter((event) => sameDay(event.date, dayKey))
              .map((event) => ({
                id: event.id,
                title: event.title,
                tone: "event" as const,
              })),
            ...tasks
              .filter((task) => sameDay(task.date, dayKey))
              .map((task) => ({
                id: task.id,
                title: task.title,
                tone: "task" as const,
                completedAt: task.completedAt,
              })),
            ...packingItems
              .filter((item) => sameDay(item.date, dayKey))
              .map((item) => ({
                id: item.id,
                title: item.title,
                tone: "packing" as const,
              })),
          ].slice(0, 2);

          const eventCount = events.filter((event) => sameDay(event.date, dayKey)).length;
          const taskCount =
            tasks.filter((task) => sameDay(task.date, dayKey)).length +
            packingItems.filter((item) => sameDay(item.date, dayKey)).length;
          const importantCount =
            events.filter(
              (event) =>
                sameDay(event.date, dayKey) &&
                (event.kind === "important" || event.kind === "submission"),
            ).length +
            tasks.filter(
              (task) => sameDay(task.date, dayKey) && task.category === "submission",
            ).length;
          const isSelected = selectedDate === dayKey;
          const isToday = dayKey === DEMO_TODAY;
          const isOtherMonth = !isSameMonth(day, month);
          const hasBirthday = dayBirthdays.length > 0;
          const hasContent = eventCount > 0 || taskCount > 0 || hasBirthday;

          const dayOfWeek = day.getDay();
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;
          const weekendColor = isSunday
            ? "text-danger/70"
            : isSaturday
              ? "text-brand/70"
              : null;

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(dayKey)}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-start gap-1 rounded-md p-1 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-[3.5rem] sm:p-1.5 md:min-h-[6rem]",
                hasContent && !isOtherMonth && "bg-brand-soft",
                isSelected && "ring-2 ring-brand/40",
                !isSelected && "hover:bg-surface-strong",
              )}
            >
              {isToday ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-body font-bold text-white">
                  {hasBirthday && "🎂"}
                  {format(day, "d")}
                </span>
              ) : (
                <span
                  className={cn(
                    "px-1 text-body-sm",
                    isOtherMonth
                      ? "text-muted/45"
                      : weekendColor
                        ? cn(weekendColor, hasContent && "font-medium")
                        : hasContent
                          ? "font-medium text-foreground"
                          : "text-muted",
                  )}
                >
                  {hasBirthday && "🎂"}
                  {format(day, "d")}
                </span>
              )}

              {!isOtherMonth && (eventCount || taskCount || importantCount) ? (
                <div className="flex items-center gap-1 px-1">
                  {eventCount ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  ) : null}
                  {taskCount ? (
                    <span className="h-1.5 w-1.5 rounded-full border border-brand/50 bg-brand-soft" />
                  ) : null}
                  {importantCount ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  ) : null}
                </div>
              ) : null}

              {dayEntries.length && !isOtherMonth ? (
                <div className="mt-auto hidden w-full space-y-0.5 md:block">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center gap-1 truncate rounded-sm px-1 py-0.5 text-xs font-medium",
                        entry.tone === "event" && "bg-brand-soft text-brand",
                        entry.tone === "task" &&
                          (entry.completedAt
                            ? "bg-brand-soft text-muted"
                            : "bg-brand-soft text-brand"),
                        entry.tone === "packing" && "bg-surface-strong text-foreground",
                        entry.tone === "birthday" && "bg-brand-soft text-brand",
                      )}
                    >
                      {entry.tone === "task" ? (
                        entry.completedAt ? (
                          <CheckSquare className="h-3 w-3 shrink-0 text-brand" />
                        ) : (
                          <Square className="h-3 w-3 shrink-0 text-muted" />
                        )
                      ) : null}
                      <span className="truncate">{entry.title}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
