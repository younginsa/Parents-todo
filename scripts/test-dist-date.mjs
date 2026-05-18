import { generateObject } from "ai";
import { z } from "zod";

const schema = z.object({
  title: z.string(),
  summary: z.string(),
  noticeDistributionDate: z.string().nullable(),
  events: z.array(z.object({ title: z.string(), date: z.string().nullable(), kind: z.enum(["activity","important","submission"]), description: z.string() })),
  tasks: z.array(z.object({ title: z.string(), date: z.string().nullable(), category: z.enum(["general","packing","homework","submission"]) })),
  packingItems: z.array(z.object({ title: z.string(), date: z.string().nullable(), category: z.enum(["bring","wear","prepare","health"]), note: z.string() })),
  referenceItems: z.array(z.object({ title: z.string(), date: z.string().nullable(), category: z.enum(["notice","policy","learning"]), content: z.string() })),
  uncertainItems: z.array(z.object({ title: z.string(), date: z.string().nullable(), category: z.enum(["event","task","packing","reference"]), note: z.string() })),
});

const SYS = `당신은 알림장 분석가입니다. 
noticeDistributionDate에는 알림장 본문에 명시된 배포일(예: "5/15 금요일입니다")을 YYYY-MM-DD로 추출. 없으면 null.`;

// Case 1: notice WITH explicit date in body
const r1 = await generateObject({
  model: "openai/gpt-4o",
  schema, system: SYS,
  messages: [{ role: "user", content: "오늘은 2026-05-18 입니다.\n\n알림장:\n5월 15일 금요일 알림장입니다.\nSentence of the day : Hello." }],
});
console.log("WITH date in body:", r1.object.noticeDistributionDate);

// Case 2: no date in body
const r2 = await generateObject({
  model: "openai/gpt-4o",
  schema, system: SYS,
  messages: [{ role: "user", content: "오늘은 2026-05-18 입니다.\n\n알림장:\n오늘 도시락 준비 부탁드립니다. 내일은 소풍입니다." }],
});
console.log("WITHOUT date in body:", r2.object.noticeDistributionDate);
