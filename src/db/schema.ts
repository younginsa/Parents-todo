import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { ParsedNotice, NoticeSourceType } from "@/types";

export const memberRoleEnum = pgEnum("member_role", ["mom", "dad"]);
export const noticeSourceTypeEnum = pgEnum("notice_source_type", ["text", "image"]);
export const noticeStatusEnum = pgEnum("notice_status", ["saved", "draft"]);
export const completionItemKindEnum = pgEnum("completion_item_kind", [
  "task",
  "packing",
]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  childName: text("child_name").notNull(),
  avatarLabel: text("avatar_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdByClerkUserId: text("created_by_clerk_user_id").notNull(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    role: memberRoleEnum("role").notNull(),
    displayName: text("display_name").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceUserUnique: uniqueIndex("workspace_members_workspace_user_unique").on(
      table.workspaceId,
      table.clerkUserId
    ),
    clerkUserIdx: index("workspace_members_clerk_user_idx").on(table.clerkUserId),
  })
);

export const notices = pgTable(
  "notices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    rawText: text("raw_text").notNull().default(""),
    sourceType: noticeSourceTypeEnum("source_type").notNull(),
    status: noticeStatusEnum("status").notNull().default("saved"),
    baseDate: text("base_date").notNull(),
    parsedJson: jsonb("parsed_json").$type<ParsedNotice>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdByClerkUserId: text("created_by_clerk_user_id").notNull(),
  },
  (table) => ({
    workspaceIdx: index("notices_workspace_idx").on(table.workspaceId),
    workspaceCreatedIdx: index("notices_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt
    ),
  })
);

export const completions = pgTable(
  "completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    noticeId: uuid("notice_id")
      .notNull()
      .references(() => notices.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    itemKind: completionItemKindEnum("item_kind").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedByMemberId: uuid("completed_by_member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "cascade" }),
  },
  (table) => ({
    noticeItemUnique: uniqueIndex("completions_notice_item_unique").on(
      table.noticeId,
      table.itemId
    ),
    workspaceIdx: index("completions_workspace_idx").on(table.workspaceId),
  })
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  notices: many(notices),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
}));

export const noticesRelations = relations(notices, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [notices.workspaceId],
    references: [workspaces.id],
  }),
  completions: many(completions),
}));

export const completionsRelations = relations(completions, ({ one }) => ({
  notice: one(notices, {
    fields: [completions.noticeId],
    references: [notices.id],
  }),
  workspace: one(workspaces, {
    fields: [completions.workspaceId],
    references: [workspaces.id],
  }),
  completedByMember: one(workspaceMembers, {
    fields: [completions.completedByMemberId],
    references: [workspaceMembers.id],
  }),
}));

export type DbWorkspace = typeof workspaces.$inferSelect;
export type DbWorkspaceMember = typeof workspaceMembers.$inferSelect;
export type DbNotice = typeof notices.$inferSelect;
export type DbCompletion = typeof completions.$inferSelect;

export type NewDbWorkspace = typeof workspaces.$inferInsert;
export type NewDbWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type NewDbNotice = typeof notices.$inferInsert;
export type NewDbCompletion = typeof completions.$inferInsert;

export type { NoticeSourceType };
