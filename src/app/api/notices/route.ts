import { z } from "zod";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { ok, fail, handleAuthError } from "@/lib/api";
import { createId, buildSourceLabel } from "@/lib/utils";
import type {
  EventItem,
  PackingItem,
  ParsedNotice,
  ReferenceItem,
  TaskItem,
} from "@/types";
import type { StoredNoticeBundle } from "@/lib/state-loader";

const eventSchema = z.object({
  title: z.string(),
  date: z.string().nullable(),
  kind: z.enum(["activity", "important", "submission"]),
  description: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string(),
  date: z.string().nullable(),
  category: z.enum(["general", "packing", "homework", "submission"]),
});

const packingSchema = z.object({
  title: z.string(),
  date: z.string().nullable(),
  category: z.enum(["bring", "wear", "prepare", "health"]),
  note: z.string().optional(),
});

const referenceSchema = z.object({
  title: z.string(),
  date: z.string().nullable(),
  category: z.enum(["notice", "policy", "learning"]),
  content: z.string(),
});

const uncertainSchema = z.object({
  title: z.string(),
  date: z.string().nullable(),
  category: z.enum(["event", "task", "packing", "reference"]),
  note: z.string(),
});

const parsedNoticeSchema = z.object({
  title: z.string(),
  summary: z.string(),
  events: z.array(eventSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  packingItems: z.array(packingSchema).default([]),
  referenceItems: z.array(referenceSchema).default([]),
  uncertainItems: z.array(uncertainSchema).default([]),
});

const bodySchema = z.object({
  parsed: parsedNoticeSchema,
  rawText: z.string().default(""),
  baseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceType: z.enum(["text", "image"]),
  status: z.enum(["saved", "draft"]).default("saved"),
});

export async function POST(request: Request) {
  try {
    const ctx = await ensureWorkspaceForUser();
    const json = await request.json();
    const body = bodySchema.parse(json);

    const sourceLabel = buildSourceLabel(body.parsed.title, body.baseDate);
    const isDraft = body.status === "draft";

    const events: EventItem[] = body.parsed.events.map((event) => ({
      ...event,
      id: createId("event"),
      sourceLabel,
      isDraft,
    }));

    const tasks: TaskItem[] = body.parsed.tasks.map((task) => ({
      ...task,
      id: createId("task"),
      sourceLabel,
      isDraft,
      completedAt: null,
      completedByMemberId: null,
    }));

    const packingItems: PackingItem[] = body.parsed.packingItems.map((item) => ({
      ...item,
      id: createId("packing"),
      sourceLabel,
      isDraft,
      completedAt: null,
      completedByMemberId: null,
    }));

    const referenceItems: ReferenceItem[] = body.parsed.referenceItems.map((item) => ({
      ...item,
      id: createId("reference"),
      sourceLabel,
      isDraft,
    }));

    const bundle: StoredNoticeBundle = {
      summary: body.parsed.summary,
      events,
      tasks,
      packingItems,
      referenceItems,
    };

    const [row] = await db
      .insert(notices)
      .values({
        workspaceId: ctx.workspace.id,
        title: body.parsed.title,
        rawText: body.rawText,
        sourceType: body.sourceType,
        status: body.status,
        baseDate: body.baseDate,
        parsedJson: bundle as unknown as ParsedNotice,
        createdByClerkUserId: ctx.userId,
      })
      .returning();

    return ok({ id: row.id }, { status: 201 });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    if (err instanceof z.ZodError) {
      return fail(400, "BAD_REQUEST", err.message);
    }
    console.error("/api/notices POST failed:", err);
    return fail(500, "INTERNAL", "공지를 저장하지 못했습니다");
  }
}
