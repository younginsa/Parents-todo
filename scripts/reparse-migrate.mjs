import { neon } from "@neondatabase/serverless";
import { generateObject } from "ai";
import { z } from "zod";

const sql = neon(process.env.DATABASE_URL);

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
- 상대적 표현은 baseDate를 기준으로 절대 날짜로 변환하세요.
- 알림장에 구체적인 날짜가 없는 일반적/지속적 항목은 baseDate를 사용하세요.
- 정말 어떤 날짜도 추정할 수 없는 경우에만 null을 사용하세요.

내용 보존 규칙 (매우 중요):
- referenceItems의 content는 알림장 원문을 그대로 보존하세요. 절대 요약하거나 줄이지 마세요.
- 짧은 한 줄짜리 섹션도 절대 빼먹지 마세요. 모든 헤더가 있는 섹션은 하나의 항목으로 만드세요.
- 알림장에 명시된 섹션 헤더는 모두 reference 또는 task로 변환하세요. 하나도 빠뜨리지 마세요.

섹션 분리 규칙 (매우 중요):
- 각 과목/주제 헤더는 반드시 별도의 referenceItem으로 만드세요.
- 절대로 여러 과목을 하나의 "오늘 배운 내용" 항목에 합치지 마세요.
- title은 해당 섹션 헤더의 이름을 사용하세요 (예: title="Writer's Workshop", title="Sentence of the day").
- content는 그 섹션의 본문 원문만 포함하세요.

예시:
원문: 🌈Sentence of the day : Hurricanes are big storms in the ocean.
출력: { title: "Sentence of the day", date: "<baseDate>", category: "learning", content: "Hurricanes are big storms in the ocean." }

알림장에 명시되지 않은 내용은 절대 만들어내지 마세요.`;

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildSourceLabel(title, baseDate) {
  const d = new Date(baseDate + "T00:00:00Z");
  const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${title}, ${monthShort} ${d.getUTCDate()} note`;
}

const rows = await sql`SELECT id, title, base_date, raw_text, parsed_json FROM notices ORDER BY created_at`;

for (const row of rows) {
  console.log(`\n========== Re-parsing ${row.id} — ${row.title} ==========`);

  // Map old item titles → old IDs (for completion preservation)
  const oldParsed = row.parsed_json;
  const oldTaskByTitle = new Map((oldParsed.tasks ?? []).map((t) => [t.title.trim(), t.id]));
  const oldPackingByTitle = new Map((oldParsed.packingItems ?? []).map((p) => [p.title.trim(), p.id]));

  const result = await generateObject({
    model: "openai/gpt-4o",
    schema: parsedNoticeSchema,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `오늘(기준일)은 ${row.base_date} 입니다.\n\n알림장 내용:\n${row.raw_text}` }],
  });

  const sourceLabel = buildSourceLabel(result.object.title, row.base_date);
  const idRemap = new Map(); // old item_id → new item_id

  const events = result.object.events.map((e) => ({
    ...e, id: createId("event"), sourceLabel, isDraft: false,
  }));

  const tasks = result.object.tasks.map((t) => {
    const newId = createId("task");
    const oldId = oldTaskByTitle.get(t.title.trim());
    if (oldId) idRemap.set(oldId, newId);
    return { ...t, id: newId, sourceLabel, isDraft: false, completedAt: null, completedByMemberId: null };
  });

  const packingItems = result.object.packingItems.map((p) => {
    const newId = createId("packing");
    const oldId = oldPackingByTitle.get(p.title.trim());
    if (oldId) idRemap.set(oldId, newId);
    return { ...p, id: newId, sourceLabel, isDraft: false, completedAt: null, completedByMemberId: null };
  });

  const referenceItems = result.object.referenceItems.map((r) => ({
    ...r, id: createId("reference"), sourceLabel, isDraft: false,
  }));

  const newBundle = {
    summary: result.object.summary,
    events, tasks, packingItems, referenceItems,
  };

  // Update parsed_json
  await sql`
    UPDATE notices
    SET parsed_json = ${JSON.stringify(newBundle)}::jsonb,
        title = ${result.object.title}
    WHERE id = ${row.id}
  `;
  console.log(`  ✓ Updated parsed_json (${tasks.length} tasks, ${packingItems.length} packing, ${referenceItems.length} refs)`);

  // Re-map completions
  for (const [oldId, newId] of idRemap.entries()) {
    const updated = await sql`
      UPDATE completions
      SET item_id = ${newId}
      WHERE notice_id = ${row.id} AND item_id = ${oldId}
      RETURNING id, item_id
    `;
    if (updated.length > 0) {
      console.log(`  ✓ Remapped completion: ${oldId} → ${newId}`);
    }
  }

  // Note: completions that didn't find a title match are left orphaned.
  // state-loader silently ignores completions whose item_id is not in parsed_json.
  // User just re-checks any that were "done" before the re-parse.
}

console.log("\nDone.");
