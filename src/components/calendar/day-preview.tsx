"use client";

import { CalendarClock, ClipboardList, FileText, PackageOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLongDate } from "@/lib/date";
import { getCategoryLabel, useI18n } from "@/lib/i18n";
import type { EventItem, Notice, PackingItem, ReferenceItem, TaskItem, Workspace } from "@/types";

export function DayPreview({
  date,
  workspace,
  events,
  tasks,
  packingItems,
  notices,
  references,
  onToggleTask,
  onTogglePacking,
}: {
  date: string;
  workspace: Workspace;
  events: EventItem[];
  tasks: TaskItem[];
  packingItems: PackingItem[];
  notices: Notice[];
  references: ReferenceItem[];
  onToggleTask: (taskId: string) => void;
  onTogglePacking: (itemId: string) => void;
}) {
  const memberLookup = Object.fromEntries(
    workspace.members.map((member) => [member.id, member.name]),
  );
  const { locale, t } = useI18n();

  return (
    <Card className="lg:sticky lg:top-5">
      <CardHeader className="pb-4">
        <CardTitle>{t("selected_day")}</CardTitle>
        <CardDescription>{formatLongDate(date, locale)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-brand" />
            {t("events")}
          </div>
          {events.length ? (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-line bg-surface-strong px-3.5 py-3"
                >
                  <p className="font-semibold">{event.title}</p>
                  {event.description ? (
                    <p className="mt-1 text-sm leading-6 text-muted">{event.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{t("no_events")}</p>
          )}
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-brand" />
            {t("tasks")}
          </div>
          {tasks.length ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-start gap-3 rounded-md border border-line bg-surface px-3.5 py-3"
                >
                  <Checkbox
                    checked={Boolean(task.completedAt)}
                    onCheckedChange={() => onToggleTask(task.id)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {getCategoryLabel(locale, task.category)}
                    </p>
                    {task.completedByMemberId ? (
                      <p className="mt-1 text-xs text-muted">
                        {t("completed_by", {
                          name: memberLookup[task.completedByMemberId],
                        })}
                      </p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{t("no_tasks")}</p>
          )}
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <PackageOpen className="h-4 w-4 text-brand" />
            {t("packing_preparation")}
          </div>
          {packingItems.length ? (
            <div className="space-y-2">
              {packingItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-md border border-line bg-surface px-3.5 py-3"
                >
                  <Checkbox
                    checked={Boolean(item.completedAt)}
                    onCheckedChange={() => onTogglePacking(item.id)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {getCategoryLabel(locale, item.category)}
                    </p>
                    {item.note ? <p className="mt-1 text-sm text-muted">{item.note}</p> : null}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{t("no_packing")}</p>
          )}
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-brand" />
            {t("notices_references")}
          </div>
          {notices.length || references.length ? (
            <div className="space-y-2">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-md border border-line bg-surface-strong px-3.5 py-3"
                >
                  <p className="font-semibold">{notice.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{notice.summary}</p>
                </div>
              ))}
              {references.map((reference) => (
                <div
                  key={reference.id}
                  className="rounded-md border border-line bg-surface px-3.5 py-3"
                >
                  <p className="font-semibold">{reference.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{reference.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{t("no_notices")}</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
