import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, title, raw_text
  FROM notices
  ORDER BY created_at DESC
`;

for (const row of rows) {
  console.log("====================");
  console.log("ID:", row.id);
  console.log("Title:", row.title);
  console.log("--- RAW TEXT ---");
  console.log(row.raw_text);
}
