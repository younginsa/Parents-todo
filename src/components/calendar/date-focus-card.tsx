"use client";

import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLongDate } from "@/lib/date";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PackingItem, TaskItem } from "@/types";

type FocusItem =
  | ({ kind: "task" } & TaskItem)
  | ({ kind: "packing" } & PackingItem);

export function DateFocusCard({
  selectedDate,
  mainEventTitle,
  items,
  onOpenDetail,
  onToggleTask,
  onTogglePacking,
}: {
  selectedDate: string;
  mainEventTitle?: string | null;
  items: FocusItem[];
  onOpenDetail: (() => void) | null;
  onToggleTask: (taskId: string) => void;
  onTogglePacking: (itemId: string) => void;
}) {
  const { locale, t } = useI18n();

  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted">
              {formatLongDate(selectedDate, locale)}
            </p>
            <CardTitle className="mt-1">{t("first_actions")}</CardTitle>
          </div>
          {onOpenDetail ? (
            <Button type="button" variant="ghost" size="sm" onClick={onOpenDetail}>
              {t("open_details")}
            </Button>
          ) : null}
        </div>

        {mainEventTitle ? (
          <div className="flex items-center gap-2 rounded-md border border-line bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">
            <CalendarClock className="h-4 w-4" />
            <span>{mainEventTitle}</span>
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => {
              const done = Boolean(item.completedAt);

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
                      item.kind === "task" ? onToggleTask(item.id) : onTogglePacking(item.id)
                    }
                    className="mt-[3px] h-5 w-5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-semibold", done && "text-muted")}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {format(parseISO(selectedDate), locale === "ko" ? "M월 d일" : "MMM d")}
                    </p>
                    {item.kind === "packing" && item.note ? (
                      <p className="mt-1 text-sm leading-6 text-muted">{item.note}</p>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-line bg-surface-strong px-4 py-5 text-sm text-muted">
            {t("no_priority_actions")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
