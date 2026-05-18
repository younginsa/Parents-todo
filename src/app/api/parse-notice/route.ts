import { z } from "zod";
import { generateObject } from "ai";
import { ok, fail, handleAuthError } from "@/lib/api";
import { getWorkspaceForUser } from "@/lib/workspace";

const eventKind = z.enum(["activity", "important", "submission"]);
const taskCategory = z.enum(["general", "packing", "homework", "submission"]);
const packingCategory = z.enum(["bring", "wear", "prepare", "health"]);
const referenceCategory = z.enum(["notice", "policy", "learning"]);
const uncertainCategory = z.enum(["event", "task", "packing", "reference"]);

const parsedNoticeSchema = z.object({
  title: z.string().describe("알림장 제목 (간결한 한 줄)"),
  summary: z.string().describe("알림장 핵심 내용 1-2문장 요약"),
  noticeDistributionDate: z
    .string()
    .nullable()
    .describe(
      "알림장 본문에 명시된 배포 날짜. 'YYYY-MM-DD' 형식. '5월 15일 금요일입니다', '5/15 알림장' 같은 표현에서 추출하세요. 본문에 명시되지 않았으면 null."
    ),
  events: z.array(
    z.object({
      title: z.string().describe("일정 이름"),
      date: z
        .string()
        .nullable()
        .describe("YYYY-MM-DD 형식. 날짜 미정이면 null"),
      kind: eventKind.describe(
        "activity=일반 활동, important=중요 행사, submission=제출 마감일"
      ),
      description: z.string().describe("간단한 부연 설명. 없으면 빈 문자열."),
    })
  ),
  tasks: z.array(
    z.object({
      title: z.string().describe("학부모가 실제로 해야 할 행동"),
      date: z
        .string()
        .nullable()
        .describe("YYYY-MM-DD 형식. 날짜 미정이면 null"),
      category: taskCategory.describe(
        "general=일반, packing=준비물 관련, homework=숙제, submission=제출"
      ),
    })
  ),
  packingItems: z.array(
    z.object({
      title: z.string().describe("준비물 이름"),
      date: z
        .string()
        .nullable()
        .describe("필요한 날짜. 미정이면 null"),
      category: packingCategory.describe(
        "bring=가져가기, wear=입기/복장, prepare=미리 준비, health=건강 관련"
      ),
      note: z.string().describe("추가 메모. 없으면 빈 문자열."),
    })
  ),
  referenceItems: z.array(
    z.object({
      title: z.string().describe("참고 정보 제목"),
      date: z
        .string()
        .nullable()
        .describe("관련 날짜. 미정이면 null"),
      category: referenceCategory.describe(
        "notice=일반 공지, policy=규정, learning=학습 내용"
      ),
      content: z.string().describe("참고 내용 본문"),
    })
  ),
  uncertainItems: z.array(
    z.object({
      title: z.string().describe("분류가 애매한 항목 제목"),
      date: z.string().nullable(),
      category: uncertainCategory.describe("가장 가까운 추정 분류"),
      note: z.string().describe("왜 분류가 불확실한지 설명"),
    })
  ),
});

const bodySchema = z.object({
  baseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceType: z.enum(["text", "image"]),
  text: z.string().optional(),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
});

const SYSTEM_PROMPT = `당신은 한국 유치원/어린이집 알림장을 분석하는 도우미입니다.

학부모가 알림장(텍스트 또는 스크린샷)을 주면, 다음 카테고리로 정확하게 분류해 JSON으로 반환합니다:

- events: 캘린더에 들어갈 일정 (소풍, 견학, 학부모 참여 행사, 발표회 등)
- tasks: 학부모가 직접 해야 할 행동 (서류 제출, 동의서 작성, 회비 납부, 사진 제출 등)
- packingItems: 아이가 챙겨야 할 물건 (도시락, 우유컵, 체육복, 실내화, 모자, 우산 등)
- referenceItems: 알아두면 좋은 참고 정보 (이번 주 학습 주제, 식단 안내, Sentence of the day, 규정 등)
- uncertainItems: 분류가 명확하지 않은 애매한 항목

날짜 규칙:
- 모든 항목에 날짜를 반드시 부여하세요. 가능하면 알림장에 명시된 날짜를 사용합니다.
- "내일", "이번 주 금요일", "다음 주 월요일" 같은 상대적 표현은 사용자가 제공한 baseDate를 기준으로 절대 날짜로 변환하세요.
- 알림장에 구체적인 날짜가 없는 일반적/지속적 항목(예: "집에서 연습하세요", "가디건 준비")은 baseDate(알림장 받은 날)를 사용하세요. 학부모는 알림장을 받은 날부터 챙겨야 하기 때문입니다.
- 정말 어떤 날짜도 추정할 수 없는 경우에만 null을 사용하세요.

내용 보존 규칙 (매우 중요):
- referenceItems의 content는 알림장 원문을 그대로 보존하세요. 절대 요약하거나 줄이지 마세요. 학습 내용 설명이 한국어로 길게 있으면 모든 문장을 그대로 옮기세요.
- 짧은 한 줄짜리 섹션(예: "Sentence of the day : Hurricanes are big storms in the ocean.")도 절대 빼먹지 마세요. 모든 헤더가 있는 섹션은 하나의 항목으로 만드세요.
- 알림장에 명시된 섹션 헤더(💗 Writer's Workshop, 🌈 Sentence of the day, 📝 오늘 배운 내용, 📌 Homework & Notice 등)는 모두 reference 또는 task로 변환하세요. 하나도 빠뜨리지 마세요.
- 학부모가 행동해야 하는 내용은 task로, 아이가 학교에서 한 활동/배운 것은 reference의 'learning'으로 분류하세요.

섹션 분리 규칙 (매우 중요):
- 각 과목/주제 헤더(예: 💗 Writer's Workshop, 💗 Grammar, 💗 Happy Chatty, 💗 Wonders 1.4, 💗 Logico, 💗 Hands on Expression, 🌈 Sentence of the day 등)는 반드시 별도의 referenceItem으로 만드세요.
- 절대로 여러 과목을 하나의 "오늘 배운 내용" 항목에 합치지 마세요.
- title은 해당 섹션 헤더의 이름을 사용하세요 (예: title="Writer's Workshop", title="Grammar", title="Sentence of the day").
- content는 그 섹션의 본문 원문만 포함하세요 (다른 섹션 내용을 섞지 마세요).

같은 항목이 여러 카테고리에 동시에 속할 수 있다면, 가장 자연스러운 한 곳에만 넣고 중복하지 마세요.

알림장에 명시되지 않은 내용은 절대 만들어내지 마세요.

알림장 배포 날짜 추출:
- noticeDistributionDate에는 알림장이 작성/배포된 실제 날짜를 넣으세요. 본문에 "5월 15일 금요일입니다", "오늘 5/15", "5/15 알림장", "2026.5.15" 같은 표현이 있으면 그것을 'YYYY-MM-DD' 형식으로 변환해 사용하세요.
- 본문에서 추출할 수 없으면 반드시 null을 반환하세요. baseDate를 기본값으로 채우지 마세요. 추측하지 마세요.

Sentence of the day 특별 규칙:
- "Sentence of the day"의 content에는 영어 문장만 포함하세요. 절대 한국어 설명을 섞지 마세요.
- "집에서 연습해주세요", "스티커를 받습니다" 같은 학부모를 위한 한국어 안내가 따라오면, 그 안내는 별도의 task로 추출하세요 (category: "homework", title: "Sentence of the day 집에서 연습").

예시 1 — Sentence of the day + 학부모 안내 함께 있는 경우:

원문:
🌈Sentence of the day : Grasslands are covered with grass and has few trees.
Theme과 관련된 문장이니 집에서 여러 번 연습해볼 수 있도록 도와주세요. 자신있고 정확하게 얘기한 친구들은 스티커를 받는답니다.

올바른 출력:
referenceItems에 추가:
{
  "title": "Sentence of the day",
  "date": "<baseDate>",
  "category": "learning",
  "content": "Grasslands are covered with grass and has few trees."
}
tasks에 추가:
{
  "title": "Sentence of the day 집에서 연습",
  "date": "<baseDate>",
  "category": "homework"
}

잘못된 출력 (한국어를 영어 문장과 섞음 — 하지 마세요):
{
  "title": "Sentence of the day",
  "content": "Grasslands are covered with grass and has few trees. Theme과 관련된 문장이니 집에서 여러 번 연습해볼 수 있도록 도와주세요."
}

예시 2 — Sentence of the day만 있고 안내 없는 경우:

원문:
🌈Sentence of the day : Hurricanes are big storms in the ocean.

올바른 출력 (referenceItems에 추가만, 별도 task 만들지 말 것):
{
  "title": "Sentence of the day",
  "date": "<baseDate>",
  "category": "learning",
  "content": "Hurricanes are big storms in the ocean."
}`;

export async function POST(request: Request) {
  try {
    await getWorkspaceForUser();
    const json = await request.json();
    const body = bodySchema.parse(json);

    if (body.sourceType === "text" && (!body.text || body.text.trim().length === 0)) {
      return fail(400, "BAD_REQUEST", "텍스트가 비어 있습니다");
    }
    if (body.sourceType === "image" && !body.imageBase64) {
      return fail(400, "BAD_REQUEST", "이미지가 없습니다");
    }

    const userPrompt = `오늘(기준일)은 ${body.baseDate} 입니다.`;

    const userContent =
      body.sourceType === "text"
        ? `${userPrompt}\n\n알림장 내용:\n${body.text}`
        : [
            { type: "text" as const, text: `${userPrompt}\n\n다음 알림장 스크린샷을 분석해 주세요:` },
            {
              type: "image" as const,
              image: body.imageBase64!,
              mediaType: body.imageMimeType ?? "image/png",
            },
          ];

    const result = await generateObject({
      model: "openai/gpt-4o",
      schema: parsedNoticeSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userContent as never,
        },
      ],
    });

    // Sanity-clamp the GPT-extracted distribution date: must be within
    // [baseDate - 30 days, baseDate + 7 days]. Outside that range it's
    // almost certainly a hallucination (e.g. parsing "신년 인사" as 2025-01-01).
    let sanitizedDistributionDate: string | null = result.object.noticeDistributionDate;
    if (sanitizedDistributionDate) {
      const distMs = Date.parse(sanitizedDistributionDate + "T00:00:00Z");
      const baseMs = Date.parse(body.baseDate + "T00:00:00Z");
      if (Number.isNaN(distMs)) {
        sanitizedDistributionDate = null;
      } else {
        const deltaDays = (distMs - baseMs) / 86_400_000;
        if (deltaDays < -30 || deltaDays > 7) {
          sanitizedDistributionDate = null;
        }
      }
    }

    const parsed = {
      ...result.object,
      noticeDistributionDate: sanitizedDistributionDate,
      events: result.object.events.map((e, i) => ({
        ...e,
        id: `event-${i}`,
      })),
      tasks: result.object.tasks.map((t, i) => ({
        ...t,
        id: `task-${i}`,
        completedAt: null,
        completedByMemberId: null,
      })),
      packingItems: result.object.packingItems.map((p, i) => ({
        ...p,
        id: `packing-${i}`,
        completedAt: null,
        completedByMemberId: null,
      })),
      referenceItems: result.object.referenceItems.map((r, i) => ({
        ...r,
        id: `reference-${i}`,
      })),
      uncertainItems: result.object.uncertainItems.map((u, i) => ({
        ...u,
        id: `uncertain-${i}`,
      })),
    };

    return ok({ parsed, mode: "ai-gateway" });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    if (err instanceof z.ZodError) {
      return fail(400, "BAD_REQUEST", err.message);
    }
    console.error("/api/parse-notice failed:", err);
    return fail(503, "LLM_ERROR", "알림장 분석에 실패했습니다. 다시 시도해 주세요.");
  }
}
