import { generateObject } from "ai";
import { z } from "zod";

const SAMPLE_NOTICE = `안녕하세요. 5월 20일 화요일은 야외 소풍 가는 날입니다.
- 도시락과 물통 준비 부탁드립니다
- 자외선 차단제 미리 발라 주세요
- 모자 꼭 챙겨주세요
- 5월 22일 목요일까지 가정통신문 회신 부탁드립니다
이번 주는 봄꽃 그리기 활동을 했습니다. 아이들이 즐거워했어요.`;

const schema = z.object({
  title: z.string(),
  summary: z.string(),
  events: z.array(
    z.object({
      title: z.string(),
      date: z.string().nullable(),
      kind: z.enum(["activity", "important", "submission"]),
      description: z.string(),
    })
  ),
  tasks: z.array(
    z.object({
      title: z.string(),
      date: z.string().nullable(),
      category: z.enum(["general", "packing", "homework", "submission"]),
    })
  ),
  packingItems: z.array(
    z.object({
      title: z.string(),
      date: z.string().nullable(),
      category: z.enum(["bring", "wear", "prepare", "health"]),
      note: z.string(),
    })
  ),
  referenceItems: z.array(
    z.object({
      title: z.string(),
      date: z.string().nullable(),
      category: z.enum(["notice", "policy", "learning"]),
      content: z.string(),
    })
  ),
  uncertainItems: z.array(
    z.object({
      title: z.string(),
      date: z.string().nullable(),
      category: z.enum(["event", "task", "packing", "reference"]),
      note: z.string(),
    })
  ),
});

const SYSTEM_PROMPT = `당신은 한국 유치원/어린이집 알림장을 분석하는 도우미입니다.

학부모가 알림장(텍스트 또는 스크린샷)을 주면, 다음 카테고리로 정확하게 분류해 JSON으로 반환합니다:

- events: 캘린더에 들어갈 일정 (소풍, 견학, 학부모 참여 행사, 발표회 등)
- tasks: 학부모가 직접 해야 할 행동 (서류 제출, 동의서 작성, 회비 납부, 사진 제출 등)
- packingItems: 아이가 챙겨야 할 물건 (도시락, 우유컵, 체육복, 실내화, 모자, 우산 등)
- referenceItems: 알아두면 좋은 참고 정보 (이번 주 학습 주제, 식단 안내, 규정 등)
- uncertainItems: 분류가 명확하지 않은 애매한 항목

날짜는 항상 ISO 형식 (YYYY-MM-DD)으로 변환하세요.
날짜를 특정할 수 없으면 null을 반환하세요.
알림장에 명시되지 않은 내용은 절대 만들어내지 마세요.`;

console.log("Calling AI Gateway with sample kidsnote text...");
const start = Date.now();

try {
  const result = await generateObject({
    model: "openai/gpt-4o",
    schema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `오늘은 2026-05-15입니다.\n\n알림장:\n${SAMPLE_NOTICE}`,
      },
    ],
  });

  const ms = Date.now() - start;
  console.log(`\n✓ Success in ${ms}ms\n`);
  console.log(JSON.stringify(result.object, null, 2));
  console.log(`\nCounts: events=${result.object.events.length} tasks=${result.object.tasks.length} packing=${result.object.packingItems.length} reference=${result.object.referenceItems.length}`);
} catch (err) {
  console.error("\n✗ FAILED:");
  console.error(err.message);
  if (err.responseBody) console.error("Response body:", err.responseBody);
  process.exit(1);
}
