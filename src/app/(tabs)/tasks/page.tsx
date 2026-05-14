"use client";

import { useState } from "react";
import { ScreenShell } from "@/components/app/screen-shell";
import { WorkspaceHeader } from "@/components/app/workspace-header";
import { useAppState } from "@/components/providers/app-state-provider";
import { TaskGroups, type ActionableItem } from "@/components/tasks/task-groups";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const {
    workspace,
    tasks,
    packingItems,
    toggleTask,
    togglePackingItem,
  } = useAppState();
  const { t } = useI18n();
  const [filter, setFilter] = useState<
    "all" | "incomplete" | "packing" | "homework" | "submission"
  >("all");

  const actionable: ActionableItem[] = [
    ...tasks
      .filter((task) => !task.isDraft)
      .map((task) => ({
        id: task.id,
        kind: "task" as const,
        title: task.title,
        category: task.category,
        date: task.date,
        sourceLabel: task.sourceLabel,
        completedAt: task.completedAt,
        completedByMemberId: task.completedByMemberId,
      })),
    ...packingItems
      .filter((item) => !item.isDraft)
      .map((item) => ({
        id: item.id,
        kind: "packing" as const,
        title: item.title,
        category: item.category,
        date: item.date,
        sourceLabel: item.sourceLabel,
        completedAt: item.completedAt,
        completedByMemberId: item.completedByMemberId,
      })),
  ].sort((a, b) => (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31"));

  const filtered = actionable.filter((item) => {
    if (filter === "all") return true;
    if (filter === "incomplete") return !item.completedAt;
    if (filter === "packing") return item.kind === "packing";
    if (filter === "homework") return item.kind === "task" && item.category === "homework";
    if (filter === "submission") return item.kind === "task" && item.category === "submission";
    return true;
  });

  const memberLookup = Object.fromEntries(
    workspace.members.map((member) => [member.id, member.name]),
  );

  const counts = {
    all: actionable.length,
    incomplete: actionable.filter((item) => !item.completedAt).length,
    packing: actionable.filter((item) => item.kind === "packing").length,
    homework: actionable.filter(
      (item) => item.kind === "task" && item.category === "homework",
    ).length,
    submission: actionable.filter(
      (item) => item.kind === "task" && item.category === "submission",
    ).length,
  };

  return (
    <ScreenShell>
      <div className="mx-auto w-full space-y-6 md:max-w-2xl lg:max-w-3xl">
        <WorkspaceHeader title={t("tasks_title")} />

        <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0">
          {(
            [
              { value: "all", label: `${t("all")} (${counts.all})` },
              { value: "incomplete", label: `${t("incomplete")} (${counts.incomplete})` },
              { value: "packing", label: `${t("packing")} (${counts.packing})` },
              { value: "homework", label: `${t("homework")} (${counts.homework})` },
              { value: "submission", label: `${t("submission")} (${counts.submission})` },
            ] as const
          ).map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "shrink-0 -mb-px border-b-2 px-3 py-2 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "border-brand font-medium text-foreground"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <TaskGroups
          items={filtered}
          memberLookup={memberLookup}
          onToggle={(item) => {
            if (item.kind === "packing") {
              togglePackingItem(item.id);
              return;
            }

            toggleTask(item.id);
          }}
        />
      </div>
    </ScreenShell>
  );
}
