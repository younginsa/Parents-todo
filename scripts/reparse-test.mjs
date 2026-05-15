import { neon } from "@neondatabase/serverless";
import { generateObject } from "ai";
import { z } from "zod";

const sql = neon(process.env.DATABASE_URL);

// Schemas (mirror /api/parse-notice)
const eventKind = z.enum(["activity", "important", "submission"]);
const taskCategory = z.enum(["general", "packing", "homework", "submission"]);
const packingCategory = z.enum(["bring", "wear", "prepare", "health"]);
const referenceCategory = z.enum(["notice", "policy", "learning"]);
const uncertainCategory = z.enum(["event", "task", "packing", "reference"]);

const parsedNoticeSchema = z.object({
  title: z.string(),
  summary: z.string(),
  events: z.array(z.object({
    title: z.string(),
    date: z.string().nullable(),
    kind: eventKind,
    description: z.string(),
  })),
  tasks: z.array(z.object({
    title: z.string(),
    date: z.string().nullable(),
    category: taskCategory,
  })),
  packingItems: z.array(z.object({
    title: z.string(),
    date: z.string().nullable(),
    category: packingCategory,
    note: z.string(),
  })),
  referenceItems: z.array(z.object({
    title: z.string(),
    date: z.string().nullable(),
    category: referenceCategory,
    content: z.string(),
  })),
  uncertainItems: z.array(z.object({
    title: z.string(),
    date: z.string().nullable(),
    category: uncertainCategory,
    note: z.string(),
  })),
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

예시 (Sentence of the day 처리):

원문:
🌈Sentence of the day : Grasslands are covered with grass and has few trees.
Theme과 관련된 문장이니 집에서 여러 번 연습해볼 수 있도록 도와주세요. 자신있고 정확하게 얘기한 친구들은 스티커를 받는답니다.

올바른 출력 (referenceItems에 추가):
{
  "title": "Sentence of the day",
  "date": "<baseDate>",
  "category": "learning",
  "content": "Grasslands are covered with grass and has few trees. Theme과 관련된 문장이니 집에서 여러 번 연습해볼 수 있도록 도와주세요. 자신있고 정확하게 얘기한 친구들은 스티커를 받는답니다."
}

잘못된 출력 (요약 — 하지 마세요):
{
  "title": "Sentence of the day",
  "content": "Grasslands are covered with grass and has few trees. Theme 관련 문장 연습"
}

또 다른 예시 (짧은 한 줄도 절대 빼먹지 말 것):

원문:
🌈Sentence of the day : Hurricanes are big storms in the ocean.

올바른 출력 (referenceItems에 반드시 추가):
{
  "title": "Sentence of the day",
  "date": "<baseDate>",
  "category": "learning",
  "content": "Hurricanes are big storms in the ocean."
}`;

const rows = await sql`SELECT id, title, base_date, raw_text FROM notices ORDER BY created_at DESC`;

for (const row of rows) {
  console.log(`\n========== ${row.id} — ${row.title} ==========`);
  console.log(`baseDate: ${row.base_date}`);

  const result = await generateObject({
    model: "openai/gpt-4o",
    schema: parsedNoticeSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `오늘(기준일)은 ${row.base_date} 입니다.\n\n알림장 내용:\n${row.raw_text}`,
      },
    ],
  });

  console.log(`\nReference items (${result.object.referenceItems.length}):`);
  for (const ref of result.object.referenceItems) {
    console.log(`  • ${ref.title} (${ref.category}, ${ref.date})`);
    console.log(`    "${ref.content}"`);
  }

  const sentenceOfDay = result.object.referenceItems.find((r) =>
    r.title.toLowerCase().includes("sentence")
  );
  if (sentenceOfDay) {
    console.log(`\n✓ Sentence of the day found and preserved`);
  } else {
    console.log(`\n✗ Sentence of the day MISSING in output`);
  }
}
