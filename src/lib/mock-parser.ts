import { addDays, format, parse, parseISO } from "date-fns";
import type {
  EventItem,
  PackingItem,
  ParsedNotice,
  ReferenceItem,
  TaskItem,
  UncertainItem,
} from "@/types";
import { createId } from "@/lib/utils";
import { SAMPLE_NOTICE_TEXT } from "@/lib/sample-notice";

function resolveTomorrow(baseDate: string) {
  return format(addDays(parseISO(baseDate), 1), "yyyy-MM-dd");
}

function resolveMonthDay(input: string, baseDate: string) {
  const parsed = parse(input, "M/d", parseISO(baseDate));
  return format(parsed, "yyyy-MM-dd");
}

function blankTask(task: Omit<TaskItem, "id" | "completedAt" | "completedByMemberId">): TaskItem {
  return {
    ...task,
    id: createId("task"),
    completedAt: null,
    completedByMemberId: null,
  };
}

function blankPacking(
  item: Omit<PackingItem, "id" | "completedAt" | "completedByMemberId">,
): PackingItem {
  return {
    ...item,
    id: createId("packing"),
    completedAt: null,
    completedByMemberId: null,
  };
}

function blankEvent(item: Omit<EventItem, "id">): EventItem {
  return {
    ...item,
    id: createId("event"),
  };
}

function blankReference(item: Omit<ReferenceItem, "id">): ReferenceItem {
  return {
    ...item,
    id: createId("reference"),
  };
}

function blankUncertain(item: Omit<UncertainItem, "id">): UncertainItem {
  return {
    ...item,
    id: createId("uncertain"),
  };
}

export function parseNoticeMock(input: string, baseDate: string): ParsedNotice {
  const text = input.trim() || SAMPLE_NOTICE_TEXT;
  const lower = text.toLowerCase();
  const tomorrow = resolveTomorrow(baseDate);
  const greatReaderMatch = text.match(/great reader list.*?(\d{1,2}\/\d{1,2})/i);
  const greatReaderDate = greatReaderMatch
    ? resolveMonthDay(greatReaderMatch[1], baseDate)
    : resolveMonthDay("4/28", baseDate);

  const events: EventItem[] = [];
  const tasks: TaskItem[] = [];
  const packingItems: PackingItem[] = [];
  const referenceItems: ReferenceItem[] = [];
  const uncertainItems: UncertainItem[] = [];

  if (lower.includes("rooftop picnic")) {
    events.push(
      blankEvent({
        title: "Rooftop picnic",
        date: tomorrow,
        kind: "activity",
        description: "Outdoor class picnic if the weather stays clear.",
      }),
    );
  }

  if (lower.includes("storybook")) {
    packingItems.push(
      blankPacking({
        title: "Bring favorite English storybook",
        date: tomorrow,
        category: "bring",
        note: "For sharing time during class.",
      }),
    );
  }

  if (lower.includes("pe uniform")) {
    packingItems.push(
      blankPacking({
        title: "Wear PE uniform and sneakers",
        date: tomorrow,
        category: "wear",
        note: "Comfortable shoes for the rooftop picnic.",
      }),
    );
  }

  if (lower.includes("snack lunchbox")) {
    packingItems.push(
      blankPacking({
        title: "Prepare a light snack lunchbox",
        date: tomorrow,
        category: "prepare",
        note: "Keep it easy to carry for picnic day.",
      }),
    );
  }

  if (lower.includes("sunscreen")) {
    tasks.push(
      blankTask({
        title: "Apply sunscreen before school",
        date: tomorrow,
        category: "general",
      }),
    );
  }

  if (lower.includes("unit 7")) {
    tasks.push(
      blankTask({
        title: "Submit homework Unit 7",
        date: tomorrow,
        category: "homework",
      }),
    );
  }

  if (lower.includes("great reader list")) {
    tasks.push(
      blankTask({
        title: "Turn in Great Reader list",
        date: greatReaderDate,
        category: "submission",
      }),
    );
    events.push(
      blankEvent({
        title: "Great Reader list due",
        date: greatReaderDate,
        kind: "submission",
        description: "Keep the list in the folder for handoff.",
      }),
    );
  }

  if (lower.includes("chocolate") || lower.includes("jelly") || lower.includes("candy")) {
    referenceItems.push(
      blankReference({
        title: "Snack restriction",
        date: tomorrow,
        category: "policy",
        content: "Do not send chocolate, jelly, or candy.",
      }),
    );
  }

  if (
    lower.includes("music") ||
    lower.includes("sr test") ||
    lower.includes("workbook") ||
    lower.includes("body map")
  ) {
    referenceItems.push(
      blankReference({
        title: "Today’s learning summary",
        date: baseDate,
        category: "learning",
        content:
          "Music, SR test, workbook practice, and body map project were covered today.",
      }),
    );
  }

  if (lower.includes("next week") && lower.includes("body map worksheet")) {
    uncertainItems.push(
      blankUncertain({
        title: "Return body map worksheet",
        date: null,
        category: "task",
        note: "The notice says sometime next week, but it does not give an exact day.",
      }),
    );
  }

  if (!events.length && !tasks.length && !packingItems.length && !referenceItems.length) {
    referenceItems.push(
      blankReference({
        title: "General school note",
        date: baseDate,
        category: "notice",
        content: text.split("\n")[0] ?? "Manual review recommended.",
      }),
    );
    uncertainItems.push(
      blankUncertain({
        title: "Review this notice manually",
        date: null,
        category: "reference",
        note: "The demo parser could not confidently split this note into actions.",
      }),
    );
  }

  return {
    title: lower.includes("rooftop picnic")
      ? "Rooftop Picnic & Homework Reminder"
      : "School Notice Review",
    summary:
      "Parsed in demo mode. Review the extracted items before saving anything to your family calendar.",
    events,
    tasks,
    packingItems,
    referenceItems,
    uncertainItems,
  };
}

export const SAMPLE_PARSED_NOTICE = parseNoticeMock(SAMPLE_NOTICE_TEXT, "2026-04-23");
