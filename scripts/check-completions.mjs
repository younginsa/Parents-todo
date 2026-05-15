import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const completions = await sql`
  SELECT c.id, c.notice_id, c.item_id, c.item_kind, c.completed_at, n.title as notice_title
  FROM completions c
  JOIN notices n ON n.id = c.notice_id
`;

console.log(`${completions.length} completion(s):`);
for (const c of completions) {
  console.log(`  - notice "${c.notice_title}" → item_id=${c.item_id} (${c.item_kind})`);
}
