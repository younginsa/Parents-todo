import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  notices as noticesTable,
  completions as completionsTable,
  workspaceMembers as workspaceMembersTable,
} from "@/db/schema";
import type {
  AppStateSnapshot,
  EventItem,
  Notice,
  NoticeSourceType,
  PackingItem,
  ReferenceItem,
  TaskItem,
  Workspace,
} from "@/types";
import type { WorkspaceContext } from "@/lib/workspace";

export interface StoredNoticeBundle {
  summary: string;
  events: EventItem[];
  tasks: TaskItem[];
  packingItems: PackingItem[];
  referenceItems: ReferenceItem[];
  uncertainItems?: TaskItem[];
}

export async function loadAppState(ctx: WorkspaceContext): Promise<AppStateSnapshot> {
  const { workspace: ws, member } = ctx;

  const allMembers = await db
    .select()
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.workspaceId, ws.id));

  const noticeRows = await db
    .select()
    .from(noticesTable)
    .where(eq(noticesTable.workspaceId, ws.id));

  const completionRows = await db
    .select()
    .from(completionsTable)
    .where(eq(completionsTable.workspaceId, ws.id));

  const completionByKey = new Map<string, { completedAt: string; memberId: string }>();
  for (const row of completionRows) {
    completionByKey.set(`${row.noticeId}:${row.itemId}`, {
      completedAt: row.completedAt.toISOString(),
      memberId: row.completedByMemberId,
    });
  }

  const allNotices: Notice[] = [];
  const allEvents: EventItem[] = [];
  const allTasks: TaskItem[] = [];
  const allPacking: PackingItem[] = [];
  const allReferences: ReferenceItem[] = [];

  for (const row of noticeRows) {
    const bundle = row.parsedJson as unknown as StoredNoticeBundle;

    const status = row.status === "draft" ? "draft" : "saved";

    allNotices.push({
      id: row.id,
      title: row.title,
      rawText: row.rawText,
      summary: bundle.summary,
      baseDate: row.baseDate,
      createdAt: row.createdAt.toISOString(),
      sourceType: row.sourceType as NoticeSourceType,
      status,
    });

    if (status === "draft") continue;

    const noticeBaseDate = row.baseDate;

    for (const event of bundle.events) {
      allEvents.push({ ...event, noticeId: row.id });
    }

    for (const task of bundle.tasks) {
      const key = `${row.id}:${task.id}`;
      const completion = completionByKey.get(key);
      allTasks.push({
        ...task,
        date: task.date ?? noticeBaseDate,
        noticeId: row.id,
        completedAt: completion?.completedAt ?? null,
        completedByMemberId: completion?.memberId ?? null,
      });
    }

    for (const item of bundle.packingItems) {
      const key = `${row.id}:${item.id}`;
      const completion = completionByKey.get(key);
      allPacking.push({
        ...item,
        date: item.date ?? noticeBaseDate,
        noticeId: row.id,
        completedAt: completion?.completedAt ?? null,
        completedByMemberId: completion?.memberId ?? null,
      });
    }

    for (const ref of bundle.referenceItems) {
      allReferences.push({ ...ref, noticeId: row.id });
    }
  }

  const workspaceForUi: Workspace = {
    id: ws.id,
    name: ws.name,
    childName: ws.childName,
    avatarLabel: ws.avatarLabel,
    members: allMembers.map((m) => ({
      id: m.id,
      name: m.role === "mom" ? "Mom" : "Dad",
      role: m.role,
    })),
  };

  return {
    workspaceBundles: [
      {
        workspace: workspaceForUi,
        notices: allNotices,
        events: allEvents,
        tasks: allTasks,
        packingItems: allPacking,
        referenceItems: allReferences,
      },
    ],
    activeWorkspaceId: ws.id,
    currentUser: {
      id: ctx.userId,
      name: member.displayName,
      email: "",
      avatarLabel: member.displayName.slice(0, 1),
      memberId: member.id,
    },
    locale: "ko",
  };
}
