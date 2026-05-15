import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { completions, notices } from "@/db/schema";
import { getWorkspaceForUser } from "@/lib/workspace";
import { ok, fail, handleAuthError } from "@/lib/api";

const bodySchema = z.object({
  noticeId: z.string().uuid(),
  itemId: z.string().min(1),
  itemKind: z.enum(["task", "packing"]),
  completed: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const ctx = await getWorkspaceForUser();
    const json = await request.json();
    const body = bodySchema.parse(json);

    const [noticeRow] = await db
      .select({ workspaceId: notices.workspaceId })
      .from(notices)
      .where(eq(notices.id, body.noticeId))
      .limit(1);

    if (!noticeRow) {
      return fail(404, "NOT_FOUND", "공지를 찾을 수 없습니다");
    }
    if (noticeRow.workspaceId !== ctx.workspace.id) {
      return fail(403, "FORBIDDEN", "다른 워크스페이스의 항목입니다");
    }

    if (body.completed) {
      await db
        .insert(completions)
        .values({
          workspaceId: ctx.workspace.id,
          noticeId: body.noticeId,
          itemId: body.itemId,
          itemKind: body.itemKind,
          completedByMemberId: ctx.member.id,
        })
        .onConflictDoUpdate({
          target: [completions.noticeId, completions.itemId],
          set: {
            completedAt: new Date(),
            completedByMemberId: ctx.member.id,
            itemKind: body.itemKind,
          },
        });
    } else {
      await db
        .delete(completions)
        .where(
          and(
            eq(completions.noticeId, body.noticeId),
            eq(completions.itemId, body.itemId)
          )
        );
    }

    return ok({
      completedAt: body.completed ? new Date().toISOString() : null,
      completedByMemberId: body.completed ? ctx.member.id : null,
    });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    if (err instanceof z.ZodError) {
      return fail(400, "BAD_REQUEST", err.message);
    }
    console.error("/api/completions POST failed:", err);
    return fail(500, "INTERNAL", "완료 상태를 저장하지 못했습니다");
  }
}
