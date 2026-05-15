import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const result = await sql`
  DELETE FROM notices
  WHERE parsed_json->>'summary' LIKE 'Parsed in demo mode%'
  RETURNING id, title
`;

console.log(`Deleted ${result.length} demo-mode notices:`);
for (const row of result) {
  console.log(`  - ${row.id}: ${row.title}`);
}
