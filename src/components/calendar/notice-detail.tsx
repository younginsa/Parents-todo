"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Package,
  Square,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DEMO_TODAY } from "@/lib/config";
import { formatLongDate, formatShortDate, sameDay } from "@/lib/date";
import { getCategoryLabel, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { EventItem, Notice, PackingItem, ReferenceItem, TaskItem } from "@/types";

type ActionItem =
  | ({ kind: "task" } & TaskItem)
  | ({ kind: "packing" } & PackingItem);

type Priority = "urgent" | "upcoming" | "due";

const PRIORITY_CHIP_CLASS: Record<Priority, string> = {
  urgent: "bg-danger-soft text-danger",
  upcoming: "bg-brand-soft text-brand",
  due: "bg-foreground/10 text-foreground/80",
};

const PRIORITY_LABEL_KEY = {
  urgent: "priority_urgent",
  upcoming: "priority_upcoming",
  due: "priority_due",
} as const;

function computePriorityMap(dates: string[]): Map<string, Priority> {
  const today = parseISO(DEMO_TODAY);
  const futureOrToday = dates
    .filter(
      (d) => differenceInCalendarDays(parseISO(d), today) >= 0,
    )
    .sort((a, b) => a.localeCompare(b));
  const urgentDate = futureOrToday[0];
  const urgentDelta = urgentDate
    ? differenceInCalendarDays(parseISO(urgentDate), today)
    : null;

  const result = new Map<string, Priority>();

  for (const d of dates) {
    if (d === urgentDate) {
      result.set(d, "urgent");
      continue;
    }

    const delta = differenceInCalendarDays(parseISO(d), today);
    if (delta < 0) {
      result.set(d, "due");
      continue;
    }

    if (urgentDelta !== null && delta - urgentDelta <= 3) {
      result.set(d, "upcoming");
    } else {
      result.set(d, "due");
    }
  }

  return result;
}

function groupByDate<T extends { date: string | null }>(items: T[]) {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    if (!item.date) return;
    groups.set(item.date, [...(groups.get(item.date) ?? []), item]);
  });

  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function NoticeDetail({
  open,
  onClose,
  selectedDate,
  selectedNotice,
  events,
  tasks,
  packingItems,
  references,
  onToggleTask,
  onTogglePacking,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedNotice: Notice | null;
  events: EventItem[];
  tasks: TaskItem[];
  packingItems: PackingItem[];
  references: ReferenceItem[];
  onToggleTask: (taskId: string) => void;
  onTogglePacking: (itemId: string) => void;
}) {
  const { locale, t } = useI18n();
  const [originalOpen, setOriginalOpen] = useState(false);

  useEffect(() => {
    if (!open) setOriginalOpen(false);
  }, [open]);

  const noticeScoped = useMemo(() => {
    if (!selectedNotice) {
      return {
        events: [] as EventItem[],
        tasks: [] as TaskItem[],
        packingItems: [] as PackingItem[],
        references: [] as ReferenceItem[],
      };
    }

    return {
      events: events.filter((item) => item.noticeId === selectedNotice.id),
      tasks: tasks.filter((item) => item.noticeId === selectedNotice.id),
      packingItems: packingItems.filter(
        (item) => item.noticeId === selectedNotice.id,
      ),
      references: references.filter(
        (item) => item.noticeId === selectedNotice.id,
      ),
    };
  }, [events, packingItems, references, selectedNotice, tasks]);

  const prioritizedItems = useMemo<ActionItem[]>(() => {
    return [
      ...noticeScoped.packingItems.map((item) => ({
        ...item,
        kind: "packing" as const,
      })),
      ...noticeScoped.tasks.map((item) => ({ ...item, kind: "task" as const })),
    ]
      .sort((a, b) => (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31"))
      .slice(0, 5);
  }, [noticeScoped]);

  const policyReferences = noticeScoped.references.filter(
    (item) => item.category === "policy" || item.category === "notice",
  );
  const learningReferences = noticeScoped.references.filter(
    (item) => item.category === "learning",
  );

  const selectedDayEvents = noticeScoped.events.filter((item) =>
    sameDay(item.date, selectedDate),
  );
  const selectedDayTasks = noticeScoped.tasks.filter((item) =>
    sameDay(item.date, selectedDate),
  );
  const selectedDayPacking = noticeScoped.packingItems.filter((item) =>
    sameDay(item.date, selectedDate),
  );

  const timelineGroups = groupByDate([
    ...noticeScoped.events,
    ...noticeScoped.tasks,
    ...noticeScoped.packingItems,
  ]);

  const wearItems = noticeScoped.packingItems.filter(
    (item) => item.category === "wear",
  );
  const prepareItems = noticeScoped.packingItems.filter(
    (item) => item.category !== "wear",
  );

  const dateTitle = formatLongDate(selectedDate, locale);

  return (
    <>
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-modal flex flex-col bg-surface outline-none",
            "inset-0 rounded-none",
            "md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-[calc(100vw-2rem)] md:max-w-[960px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:shadow-lg",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-4">
            <Dialog.Title className="text-[22px] font-semibold leading-tight text-foreground">
              {dateTitle}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {selectedNotice ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOriginalOpen(true)}
                >
                  {t("view_original")}
                </Button>
              ) : null}
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t("close")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {!selectedNotice ? (
              <p className="text-[14px] text-muted">{t("no_source_notice")}</p>
            ) : (
              <>
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h2 className="text-[18px] font-semibold text-foreground">
                      {t("quick_summary")}
                    </h2>

                    <div className="space-y-3">
                      {selectedDayEvents.length ? (
                        <div className="flex items-start gap-3">
                          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-muted">
                              {t("events")}
                            </p>
                            <ul className="mt-1 space-y-1">
                              {selectedDayEvents.map((item) => (
                                <li
                                  key={item.id}
                                  className="text-[14px] font-medium text-foreground"
                                >
                                  {item.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}

                      {selectedDayTasks.length ? (
                        <div className="flex items-start gap-3">
                          <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-muted">
                              {t("tasks")}
                            </p>
                            <ul className="mt-1 space-y-1">
                              {selectedDayTasks.map((item) => {
                                const done = Boolean(item.completedAt);
                                return (
                                  <li
                                    key={item.id}
                                    className={cn(
                                      "flex items-center gap-2 text-[14px] font-medium text-foreground",
                                      done && "text-muted",
                                    )}
                                  >
                                    {done ? (
                                      <CheckSquare className="h-3.5 w-3.5 shrink-0 text-brand" />
                                    ) : (
                                      <Square className="h-3.5 w-3.5 shrink-0 text-muted" />
                                    )}
                                    <span className="min-w-0 flex-1">
                                      {item.title}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      ) : null}

                      {selectedDayPacking.length ? (
                        <div className="flex items-start gap-3">
                          <Package className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-muted">
                              {t("packing")}
                            </p>
                            <ul className="mt-1 space-y-1">
                              {selectedDayPacking.map((item) => (
                                <li
                                  key={item.id}
                                  className="text-[14px] font-medium text-foreground"
                                >
                                  {item.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-muted">
                            {t("source_label")}
                          </p>
                          <p className="mt-1 text-[14px] font-medium text-foreground">
                            {selectedNotice.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-md border border-line p-5">
                    <div>
                      <h2 className="text-[18px] font-semibold text-foreground">
                        {t("first_actions")}
                      </h2>
                    </div>

                    <div className="space-y-2">
                      {prioritizedItems.map((item) => {
                        const done = Boolean(item.completedAt);
                        const description =
                          "note" in item && item.note ? item.note : null;

                        return (
                          <label
                            key={item.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md border border-line/60 px-2 py-3 transition",
                              done
                                ? "bg-brand-soft/40"
                                : "bg-surface-strong/40 hover:bg-surface-strong/60",
                            )}
                          >
                            <Checkbox
                              checked={done}
                              onCheckedChange={() =>
                                item.kind === "task"
                                  ? onToggleTask(item.id)
                                  : onTogglePacking(item.id)
                              }
                              className="mt-[3px] h-5 w-5 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "text-[14px] font-medium text-foreground",
                                  done && "text-muted",
                                )}
                              >
                                {item.title}
                              </p>
                              {description ? (
                                <p className="mt-1 text-[13px] text-muted">
                                  {description}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-[18px] font-semibold text-foreground">
                      {t("timeline_title")}
                    </h2>

                    <div className="space-y-4">
                      {(() => {
                        const priorityMap = computePriorityMap(
                          timelineGroups.map(([date]) => date),
                        );
                        const SHORT_DESCRIPTION_THRESHOLD = 30;

                        return timelineGroups.map(([date]) => {
                          const dateEvents = noticeScoped.events.filter(
                            (item) => sameDay(item.date, date),
                          );
                          const dateTasks = noticeScoped.tasks.filter((item) =>
                            sameDay(item.date, date),
                          );
                          const datePacking = noticeScoped.packingItems.filter(
                            (item) => sameDay(item.date, date),
                          );

                          const rows = [
                            ...dateTasks.map((item) => ({
                              id: item.id,
                              title: item.title,
                              description: null as string | null,
                            })),
                            ...dateEvents.map((item) => ({
                              id: item.id,
                              title: item.title,
                              description: item.description ?? null,
                            })),
                            ...datePacking.map((item) => ({
                              id: item.id,
                              title: item.title,
                              description: item.note ?? null,
                            })),
                          ];

                          const priority = priorityMap.get(date) ?? "due";

                          return (
                            <div
                              key={date}
                              className="overflow-hidden rounded-md border border-line"
                            >
                              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                                <h3 className="text-[15px] font-semibold text-foreground">
                                  {formatShortDate(date, locale)}
                                </h3>
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                                    PRIORITY_CHIP_CLASS[priority],
                                  )}
                                >
                                  {t(PRIORITY_LABEL_KEY[priority])}
                                </span>
                              </div>

                              <div className="px-5 py-4">
                                <ul className="ml-4 list-disc space-y-2.5 marker:text-muted">
                                  {rows.map((row) => {
                                    const hasDescription = Boolean(row.description);
                                    const isShort =
                                      hasDescription &&
                                      row.description!.length <
                                        SHORT_DESCRIPTION_THRESHOLD;

                                    return (
                                      <li
                                        key={row.id}
                                        className="text-[14px] text-foreground"
                                      >
                                        <span className="font-semibold">
                                          {row.title}
                                        </span>
                                        {hasDescription && isShort ? (
                                          <span className="text-muted">
                                            {" "}· {row.description}
                                          </span>
                                        ) : null}
                                        {hasDescription && !isShort ? (
                                          <p className="mt-0.5 text-[13px] text-muted">
                                            {row.description}
                                          </p>
                                        ) : null}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <section className="rounded-md border border-line p-5">
                      <h2 className="text-[18px] font-semibold text-foreground">
                        {t("packing_detail_title")}
                      </h2>

                      <div className="mt-4 space-y-4">
                        {wearItems.length ? (
                          <div>
                            <h3 className="text-[15px] font-semibold text-foreground">
                              {getCategoryLabel(locale, "wear")}
                            </h3>
                            <ul className="mt-2 ml-4 list-disc space-y-1.5 text-[14px] text-foreground/80">
                              {wearItems.map((item) => (
                                <li key={item.id}>{item.title}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {prepareItems.length ? (
                          <div>
                            <h3 className="text-[15px] font-semibold text-foreground">
                              {getCategoryLabel(locale, "prepare")}
                            </h3>
                            <ul className="mt-2 ml-4 list-disc space-y-1.5 text-[14px] text-foreground/80">
                              {prepareItems.map((item) => (
                                <li key={item.id}>
                                  {item.title}
                                  {item.note ? (
                                    <span className="text-muted">
                                      {" "}· {item.note}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </section>

                    <section className="rounded-md border border-line p-5">
                      <h2 className="text-[18px] font-semibold text-foreground">
                        {t("policy_title")}
                      </h2>

                      <div className="mt-4">
                        {policyReferences.length ? (
                          <ul className="ml-4 list-disc space-y-1.5 text-[14px] text-foreground/80">
                            {policyReferences.map((item) => (
                              <li key={item.id}>{item.content}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[13px] text-muted">
                            {t("no_notices")}
                          </p>
                        )}
                      </div>
                    </section>
                  </div>

                  {learningReferences.length ? (
                    <section className="space-y-4">
                      <h2 className="text-[18px] font-semibold text-foreground">
                        {t("learning_title")}
                      </h2>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {learningReferences.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-md border border-line p-4"
                          >
                            <h3 className="text-[15px] font-semibold text-foreground">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-[13px] leading-relaxed text-muted">
                              {item.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>

                <footer className="mt-8 border-t border-line pt-4 text-center">
                  <p className="text-[12px] text-muted">
                    {t("notice_modal_footer", { date: DEMO_TODAY })}
                  </p>
                </footer>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {selectedNotice ? (
      <Dialog.Root open={originalOpen} onOpenChange={setOriginalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-popover bg-foreground/55" />
          <Dialog.Content
            aria-describedby={undefined}
            className={cn(
              "fixed z-popover flex flex-col bg-surface outline-none",
              "inset-0 rounded-none",
              "md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[85vh] md:w-[calc(100vw-2rem)] md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:border-line md:shadow-lg",
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="font-display text-xl font-bold">
                  {t("original_notice")}
                </Dialog.Title>
                <p className="truncate text-sm text-muted">
                  {selectedNotice.title}
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t("close")}
                  className="ml-3 shrink-0 rounded-full p-2 text-muted transition hover:bg-surface-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div className="rounded-md border border-line bg-surface-strong px-4 py-3 text-sm text-muted">
                {selectedNotice.summary}
              </div>
              <pre className="whitespace-pre-wrap rounded-md border border-line bg-white px-4 py-4 text-sm leading-7 text-foreground">
                {selectedNotice.rawText}
              </pre>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    ) : null}
    </>
  );
}
