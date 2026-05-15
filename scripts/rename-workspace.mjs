import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const result = await sql`
  UPDATE workspaces
  SET name = '이섭이 알림장',
      child_name = '이섭',
      avatar_label = '이'
  RETURNING id, name, child_name, avatar_label
`;

console.log("Updated workspace:");
for (const row of result) {
  console.log(`  ${row.id}: ${row.name} (child: ${row.child_name}, avatar: ${row.avatar_label})`);
}
