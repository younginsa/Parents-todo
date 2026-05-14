export interface Member {
  id: string;
  name: "Mom" | "Dad";
  role: "mom" | "dad";
}

export interface Workspace {
  id: string;
  name: string;
  childName: string;
  avatarLabel: string;
  members: Member[];
}

export type AppLocale = "ko" | "en";
export type NoticeSourceType = "text" | "image";
export type NoticeStatus = "saved" | "draft";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarLabel: string;
  memberId: string;
}

export interface BaseItem {
  id: string;
  title: string;
  date: string | null;
  noticeId?: string;
  sourceLabel?: string;
  isDraft?: boolean;
}

export interface EventItem extends BaseItem {
  kind: "activity" | "important" | "submission";
  description?: string;
}

export interface TaskItem extends BaseItem {
  category: "general" | "packing" | "homework" | "submission";
  completedAt: string | null;
  completedByMemberId: string | null;
}

export interface PackingItem extends BaseItem {
  category: "bring" | "wear" | "prepare" | "health";
  note?: string;
  completedAt: string | null;
  completedByMemberId: string | null;
}

export interface ReferenceItem extends BaseItem {
  category: "notice" | "policy" | "learning";
  content: string;
}

export interface UncertainItem extends BaseItem {
  category: "event" | "task" | "packing" | "reference";
  note: string;
}

export interface ParsedNotice {
  title: string;
  summary: string;
  events: EventItem[];
  tasks: TaskItem[];
  packingItems: PackingItem[];
  referenceItems: ReferenceItem[];
  uncertainItems: UncertainItem[];
}

export interface Notice {
  id: string;
  title: string;
  rawText: string;
  summary: string;
  baseDate: string;
  createdAt: string;
  sourceType: NoticeSourceType;
  status: NoticeStatus;
  draftData?: ParsedNotice;
}

export interface WorkspaceBundle {
  workspace: Workspace;
  notices: Notice[];
  events: EventItem[];
  tasks: TaskItem[];
  packingItems: PackingItem[];
  referenceItems: ReferenceItem[];
}

export interface AppStateSnapshot {
  workspaceBundles: WorkspaceBundle[];
  activeWorkspaceId: string;
  currentUser: UserProfile;
  locale: AppLocale;
}

export interface ParseNoticePayload {
  text?: string;
  fileName?: string;
  baseDate: string;
  sourceType: NoticeSourceType;
}
