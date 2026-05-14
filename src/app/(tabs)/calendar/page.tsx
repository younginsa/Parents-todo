"use client";

import { addMonths, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DateFocusCard } from "@/components/calendar/date-focus-card";
import { MonthGrid } from "@/components/calendar/month-grid";
import { NoticeDetail } from "@/components/calendar/notice-detail";
import { ScreenShell } from "@/components/app/screen-shell";
import { WorkspaceHeader } from "@/components/app/workspace-header";
import { useAppState } from "@/components/providers/app-state-provider";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_TODAY } from "@/lib/config";
import { sameDay } from "@/lib/date";

export default function CalendarPage() {
  const { notices, events, tasks, packingItems, referenceItems, toggleTask, togglePackingItem } =
    useAppState();
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [monthDate, setMonthDate] = useState(
    format(parseISO(DEMO_TODAY), "yyyy-MM-01"),
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const savedNotices = notices.filter((notice) => notice.status === "saved");
  const savedEvents = events.filter((event) => !event.isDraft);
  const savedTasks = tasks.filter((task) => !task.isDraft);
  const savedPacking = packingItems.filter((item) => !item.isDraft);
  const savedReferences = referenceItems.filter((item) => !item.isDraft);

  const selectedEvents = savedEvents.filter((event) => sameDay(event.date, selectedDate));
  const selectedTasks = savedTasks.filter((task) => sameDay(task.date, selectedDate));
  const selectedPacking = savedPacking.filter((item) => sameDay(item.date, selectedDate));
  const selectedReferences = savedReferences.filter((item) => sameDay(item.date, selectedDate));
  const focusItems = [
    ...selectedPacking.map((item) => ({ ...item, kind: "packing" as const })),
    ...selectedTasks.map((item) => ({ ...item, kind: "task" as const })),
  ].slice(0, 4);
  const selectedNotice = (() => {
    const fromDateItems = [
      ...selectedEvents.map((item) => item.noticeId),
      ...selectedTasks.map((item) => item.noticeId),
      ...selectedPacking.map((item) => item.noticeId),
      ...selectedReferences.map((item) => item.noticeId),
    ].filter(Boolean) as string[];

    if (fromDateItems.length) {
      return (
        savedNotices.find((notice) => notice.id === fromDateItems[0]) ??
        null
      );
    }

    return (
      savedNotices
        .filter((notice) => notice.baseDate <= selectedDate)
        .sort((a, b) => b.baseDate.localeCompare(a.baseDate))[0] ?? null
    );
  })();

  const monthTitle = format(parseISO(monthDate), "MMMM yyyy");

  function goToMonth(offset: number) {
    setMonthDate(format(addMonths(parseISO(monthDate), offset), "yyyy-MM-01"));
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setMonthDate(format(parseISO(date), "yyyy-MM-01"));
    setDetailOpen(true);
  }

  return (
    <ScreenShell>
      <WorkspaceHeader
        title={
          <span className="inline-flex items-center gap-3">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              className="rounded-full p-1 text-muted transition hover:bg-surface-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span>{monthTitle}</span>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              className="rounded-full p-1 text-muted transition hover:bg-surface-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </span>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-5">
          <MonthGrid
            monthDate={monthDate}
            selectedDate={selectedDate}
            events={savedEvents}
            tasks={savedTasks}
            packingItems={savedPacking}
            onSelectDate={handleSelectDate}
          />
        </CardContent>
      </Card>

      <DateFocusCard
        selectedDate={selectedDate}
        mainEventTitle={selectedEvents[0]?.title ?? null}
        items={focusItems}
        onOpenDetail={selectedNotice ? () => setDetailOpen(true) : null}
        onToggleTask={toggleTask}
        onTogglePacking={togglePackingItem}
      />

      <NoticeDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        selectedDate={selectedDate}
        selectedNotice={selectedNotice}
        events={savedEvents}
        tasks={savedTasks}
        packingItems={savedPacking}
        references={savedReferences}
        onToggleTask={toggleTask}
        onTogglePacking={togglePackingItem}
      />
    </ScreenShell>
  );
}
