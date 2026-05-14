import type {
  EventItem,
  Notice,
  NoticeSourceType,
  NoticeStatus,
  PackingItem,
  ParsedNotice,
  ReferenceItem,
  TaskItem,
} from "@/types";
import { buildSourceLabel, createId } from "@/lib/utils";

interface MaterializeNoticeInput {
  parsed: ParsedNotice;
  rawText: string;
  baseDate: string;
  sourceType: NoticeSourceType;
  status: NoticeStatus;
  createdAt?: string;
}

interface MaterializedNoticeBundle {
  notice: Notice;
  events: EventItem[];
  tasks: TaskItem[];
  packingItems: PackingItem[];
  referenceItems: ReferenceItem[];
}

export function materializeNotice({
  parsed,
  rawText,
  baseDate,
  sourceType,
  status,
  createdAt = `${baseDate}T08:00:00.000Z`,
}: MaterializeNoticeInput): MaterializedNoticeBundle {
  const noticeId = createId("notice");
  const sourceLabel = buildSourceLabel(parsed.title, baseDate);

  return {
    notice: {
      id: noticeId,
      title: parsed.title,
      rawText,
      summary: parsed.summary,
      baseDate,
      createdAt,
      sourceType,
      status,
      draftData: parsed,
    },
    events: parsed.events.map((event) => ({
      ...event,
      id: createId("event"),
      noticeId,
      sourceLabel,
      isDraft: status === "draft",
    })),
    tasks: parsed.tasks.map((task) => ({
      ...task,
      id: createId("task"),
      noticeId,
      sourceLabel,
      isDraft: status === "draft",
    })),
    packingItems: parsed.packingItems.map((item) => ({
      ...item,
      id: createId("packing"),
      noticeId,
      sourceLabel,
      isDraft: status === "draft",
    })),
    referenceItems: parsed.referenceItems.map((item) => ({
      ...item,
      id: createId("reference"),
      noticeId,
      sourceLabel,
      isDraft: status === "draft",
    })),
  };
}
