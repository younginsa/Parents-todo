import type {
  AppStateSnapshot,
  ParsedNotice,
  UserProfile,
  Workspace,
  WorkspaceBundle,
} from "@/types";
import { materializeNotice } from "@/lib/notices";
import { parseNoticeMock } from "@/lib/mock-parser";
import { SAMPLE_NOTICE_TEXT } from "@/lib/sample-notice";

const currentUser: UserProfile = {
  id: "user-mom",
  name: "박수민",
  email: "soomin.park@example.com",
  avatarLabel: "박",
  memberId: "member-mom",
};

const workspaceOne: Workspace = {
  id: "workspace-yiseoup",
  name: "Yiseoup's kidsnote",
  childName: "Yiseoup",
  avatarLabel: "Y",
  members: [
    { id: "member-mom", name: "Mom", role: "mom" },
    { id: "member-dad", name: "Dad", role: "dad" },
  ],
};

const workspaceTwo: Workspace = {
  id: "workspace-wooseoup",
  name: "Wooseoup's kidsnote",
  childName: "Wooseoup",
  avatarLabel: "W",
  members: [
    { id: "member-mom", name: "Mom", role: "mom" },
    { id: "member-dad", name: "Dad", role: "dad" },
  ],
};

const seedOneParsed = parseNoticeMock(SAMPLE_NOTICE_TEXT, "2026-04-23");
const seedOneEnriched: ParsedNotice = {
  ...seedOneParsed,
  referenceItems: [
    ...seedOneParsed.referenceItems,
    {
      id: "reference-learning-english-melodies",
      title: "English Melodies",
      date: "2026-04-23",
      category: "learning",
      content:
        "기존에 배운 코드들을 복습하고, F 코드에서 C7으로 옮기는 손가락 위치 연습을 했어요.",
    },
    {
      id: "reference-learning-sr-test",
      title: "SR Test",
      date: "2026-04-23",
      category: "learning",
      content:
        "Reading level 3 단계 책으로 듣고 따라 읽기와 짧은 문장 정리 연습을 진행했습니다.",
    },
    {
      id: "reference-learning-logico",
      title: "Logico",
      date: "2026-04-23",
      category: "learning",
      content:
        "수 패턴 카드 짝 맞추기를 풀고, 짝꿍과 한 판씩 번갈아 풀이하며 마무리했습니다.",
    },
    {
      id: "reference-learning-hands-on",
      title: "Hands on Expression",
      date: "2026-04-23",
      category: "learning",
      content:
        "봄꽃 모양 종이 접기를 했고, 자기만의 색으로 칠해 친구에게 선물했어요.",
    },
  ],
};

const seedNoticeOne = materializeNotice({
  parsed: seedOneEnriched,
  rawText: SAMPLE_NOTICE_TEXT,
  baseDate: "2026-04-23",
  sourceType: "text",
  status: "saved",
  createdAt: "2026-04-23T08:00:00.000Z",
});

const priorParsed: ParsedNotice = {
  title: "Library Day & Apron Reminder",
  summary: "A smaller note saved earlier in the week.",
  events: [
    {
      id: "event-seed-library",
      title: "Library day",
      date: "2026-04-22",
      kind: "activity",
      description: "Return borrowed books in the class pouch.",
    },
  ],
  tasks: [
    {
      id: "task-seed-folder",
      title: "Return reading folder",
      date: "2026-04-22",
      category: "submission",
      completedAt: "2026-04-22T21:10:00.000Z",
      completedByMemberId: "member-dad",
    },
  ],
  packingItems: [
    {
      id: "packing-seed-apron",
      title: "Pack art apron",
      date: "2026-04-22",
      category: "bring",
      note: "Needed for messy painting.",
      completedAt: "2026-04-22T20:55:00.000Z",
      completedByMemberId: "member-dad",
    },
  ],
  referenceItems: [
    {
      id: "reference-seed-learning",
      title: "Class update",
      date: "2026-04-21",
      category: "learning",
      content: "The class practiced spring songs and worked on a flower collage.",
    },
  ],
  uncertainItems: [],
};

const seedNoticeTwo = materializeNotice({
  parsed: priorParsed,
  rawText:
    "Library day is tomorrow. Please return the reading folder and send an art apron. Today we practiced spring songs and made a flower collage.",
  baseDate: "2026-04-21",
  sourceType: "text",
  status: "saved",
  createdAt: "2026-04-21T08:30:00.000Z",
});

const workspaceTwoParsed = parseNoticeMock(
  "Tomorrow is garden day. Please send rain boots, a small towel, and the seed worksheet. Homework Unit 8 is due on 4/25. Today we practiced rhythm sticks and planted beans.",
  "2026-04-24",
);

const workspaceTwoNotice = materializeNotice({
  parsed: workspaceTwoParsed,
  rawText:
    "Tomorrow is garden day. Please send rain boots, a small towel, and the seed worksheet. Homework Unit 8 is due on 4/25. Today we practiced rhythm sticks and planted beans.",
  baseDate: "2026-04-24",
  sourceType: "text",
  status: "saved",
  createdAt: "2026-04-24T07:30:00.000Z",
});

const workspaceBundles: WorkspaceBundle[] = [
  {
    workspace: workspaceOne,
    notices: [seedNoticeOne.notice, seedNoticeTwo.notice],
    events: [...seedNoticeOne.events, ...seedNoticeTwo.events],
    tasks: [...seedNoticeOne.tasks, ...seedNoticeTwo.tasks],
    packingItems: [...seedNoticeOne.packingItems, ...seedNoticeTwo.packingItems],
    referenceItems: [...seedNoticeOne.referenceItems, ...seedNoticeTwo.referenceItems],
  },
  {
    workspace: workspaceTwo,
    notices: [workspaceTwoNotice.notice],
    events: [...workspaceTwoNotice.events],
    tasks: [...workspaceTwoNotice.tasks],
    packingItems: [...workspaceTwoNotice.packingItems],
    referenceItems: [...workspaceTwoNotice.referenceItems],
  },
];

export function createDemoState(): AppStateSnapshot {
  return {
    workspaceBundles,
    activeWorkspaceId: workspaceOne.id,
    currentUser,
    locale: "ko",
  };
}
