import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, workspaceMembers, type DbWorkspace, type DbWorkspaceMember } from "@/db/schema";

export class AuthError extends Error {
  constructor(public status: 401 | 403 | 404, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export interface WorkspaceContext {
  userId: string;
  workspace: DbWorkspace;
  member: DbWorkspaceMember;
}

async function readMembership(userId: string): Promise<WorkspaceContext | null> {
  const rows = await db
    .select({ workspace: workspaces, member: workspaceMembers })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.clerkUserId, userId))
    .limit(1);

  if (rows.length === 0) return null;
  return { userId, workspace: rows[0].workspace, member: rows[0].member };
}

export async function getWorkspaceForUser(): Promise<WorkspaceContext> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthError(401, "Not signed in");
  }

  const ctx = await readMembership(userId);
  if (!ctx) {
    throw new AuthError(403, "No workspace membership");
  }
  return ctx;
}

const HOUSEHOLD_MEMBER_CAP = 2;

export async function ensureWorkspaceForUser(): Promise<WorkspaceContext> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthError(401, "Not signed in");
  }

  const existing = await readMembership(userId);
  if (existing) return existing;

  const user = await currentUser();
  const displayName =
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    user?.emailAddresses[0]?.emailAddress.split("@")[0] ||
    "사용자";

  const allWorkspaces = await db.select().from(workspaces).limit(1);
  const existingWorkspace = allWorkspaces[0];

  // No workspace yet — first sign-in. Create workspace, user becomes mom.
  if (!existingWorkspace) {
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: `${displayName}'s 알림장`,
        childName: displayName,
        avatarLabel: displayName.slice(0, 1).toUpperCase(),
        createdByClerkUserId: userId,
      })
      .returning();

    const [newMember] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId: newWorkspace.id,
        clerkUserId: userId,
        role: "mom",
        displayName,
      })
      .returning();

    return { userId, workspace: newWorkspace, member: newMember };
  }

  // Workspace exists. Auto-join if there's room (household cap = 2).
  const memberCount = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, existingWorkspace.id));

  if (memberCount[0].count >= HOUSEHOLD_MEMBER_CAP) {
    throw new AuthError(
      403,
      "이 워크스페이스는 이미 가족 구성원이 모두 등록되어 있어요. 관리자에게 문의해 주세요."
    );
  }

  // Second user joins existing workspace as dad.
  const [newMember] = await db
    .insert(workspaceMembers)
    .values({
      workspaceId: existingWorkspace.id,
      clerkUserId: userId,
      role: "dad",
      displayName,
    })
    .returning();

  return { userId, workspace: existingWorkspace, member: newMember };
}

export async function assertWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<DbWorkspaceMember> {
  const rows = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.clerkUserId, userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (rows.length === 0) {
    throw new AuthError(403, "Not a member of this workspace");
  }
  return rows[0];
}
