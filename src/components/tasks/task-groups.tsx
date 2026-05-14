"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  formatBucketDateMeta,
  formatShortDate,
  getTaskTimeBucket,
} from "@/lib/date";
import { getBucketLabel, getCategoryLabel, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ActionableItem {
  id: string;
  kind: "task" | "packing";
  title: string;
  category: string;
  date: string | null;
  sourceLabel?: string;
  completedAt: string | null;
  completedByMemberId: string | null;
}

const ORDER = ["Today", "Tomorrow", "This Week", "Later", "No Date"] as const;
type BucketLabel = (typeof ORDER)[number];

const ALWAYS_SHOWN: ReadonlyArray<BucketLabel> = ["Today", "Tomorrow", "This Week"];

type Run =
  | { type: "group"; source: string; tasks: ActionableItem[] }
  | { type: "single"; task: ActionableItem };

function buildRuns(tasks: ActionableItem[]): Run[] {
  const sourceCounts = new Map<string, number>();
  for (const task of tasks) {
    if (task.sourceLabel) {
      sourceCounts.set(
        task.sourceLabel,
        (sourceCounts.get(task.sourceLabel) ?? 0) + 1,
      );
    }
  }

  const runs: Run[] = [];
  let i = 0;
  while (i < tasks.length) {
    const current = tasks[i];
    const source = current.sourceLabel;
    const isGroupedSource =
      Boolean(source) && (sourceCounts.get(source!) ?? 0) >= 2;

    if (isGroupedSource && source) {
      let j = i + 1;
      while (j < tasks.length && tasks[j].sourceLabel === source) {
        j++;
      }
      runs.push({ type: "group", source, tasks: tasks.slice(i, j) });
      i = j;
    } else {
      runs.push({ type: "single", task: current });
      i++;
    }
  }
  return runs;
}

function getChipClass(item: ActionableItem) {
  const chipCategory = item.kind === "packing" ? "packing" : item.category;
  switch (chipCategory) {
    case "submission":
      return "bg-brand-soft text-brand";
    case "packing":
      return "bg-surface-strong text-muted";
    case "homework":
      return "bg-foreground/8 text-foreground/70";
    case "general":
    default:
      return "bg-surface-strong/60 text-muted";
  }
}

export function TaskGroups({
  items,
  memberLookup,
  onToggle,
}: {
  items: ActionableItem[];
  memberLookup: Record<string, string>;
  onToggle: (item: ActionableItem) => void;
}) {
  const { locale, t } = useI18n();

  function getEmptyMessage(label: BucketLabel) {
    switch (label) {
      case "Today":
        return t("empty_today_message");
      case "Tomorrow":
        return t("empty_tomorrow_message");
      case "This Week":
        return t("empty_this_week_message");
      default:
        return null;
    }
  }

  function renderTaskRow(
    task: ActionableItem,
    options: { showInlineSource: boolean },
  ) {
    const done = Boolean(task.completedAt);

    const metaParts: string[] = [];
    if (task.date) {
      metaParts.push(formatShortDate(task.date, locale));
    }
    if (task.completedByMemberId && memberLookup[task.completedByMemberId]) {
      metaParts.push(
        t("completed_by", { name: memberLookup[task.completedByMemberId] }),
      );
    }
    if (options.showInlineSource && task.sourceLabel) {
      metaParts.push(task.sourceLabel);
    }
    const metaLine = metaParts.join(" · ");

    return (
      <label
        key={task.id}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-md px-2 py-3 transition",
          done ? "bg-brand-soft/40" : "hover:bg-surface-strong/40",
        )}
      >
        <Checkbox
          checked={done}
          onCheckedChange={() => onToggle(task)}
          className="mt-[3px] h-5 w-5 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[16px] font-medium leading-snug text-foreground",
              done && "text-muted",
            )}
          >
            {task.title}
          </p>
          {metaLine ? (
            <p className="mt-0.5 text-[13px] font-normal text-muted">
              {metaLine}
            </p>
          ) : null}
        </div>

        <span
          className={cn(
            "mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium",
            getChipClass(task),
          )}
        >
          {task.kind === "packing"
            ? t("packing")
            : getCategoryLabel(locale, task.category)}
        </span>
      </label>
    );
  }

  return (
    <div className="space-y-12">
      {ORDER.map((label) => {
        const grouped = items.filter(
          (item) => getTaskTimeBucket(item.date) === label,
        );
        const isAlwaysShown = ALWAYS_SHOWN.includes(label);

        if (!isAlwaysShown && grouped.length === 0) return null;

        const runs = buildRuns(grouped);
        const dateMeta = formatBucketDateMeta(label, locale);
        const emptyMessage = getEmptyMessage(label);

        return (
          <section key={label}>
            <div className="mb-4 flex items-baseline gap-2 border-b border-line/40 pb-2">
              <h2 className="text-[18px] font-medium text-muted">
                {getBucketLabel(locale, label)}
              </h2>
              {dateMeta ? (
                <span className="text-[13px] text-muted">
                  · {dateMeta}
                </span>
              ) : null}
            </div>

            <div className="space-y-6">
              {grouped.length === 0 && emptyMessage ? (
                <p className="py-4 text-[14px] text-muted">{emptyMessage}</p>
              ) : null}

              {runs.map((run, runIndex) => {
                if (run.type === "single") {
                  return renderTaskRow(run.task, {
                    showInlineSource: true,
                  });
                }
                return (
                  <div key={`run-${runIndex}`}>
                    <p className="text-[13px] font-semibold text-muted">
                      {run.source}
                    </p>
                    <div className="mt-2 space-y-1">
                      {run.tasks.map((task) =>
                        renderTaskRow(task, { showInlineSource: false }),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
