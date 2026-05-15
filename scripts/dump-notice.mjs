import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, title, base_date, source_type, status, created_at, parsed_json, raw_text
  FROM notices
  ORDER BY created_at DESC
  LIMIT 3
`;

for (const row of rows) {
  console.log("====================");
  console.log("ID:", row.id);
  console.log("Title:", row.title);
  console.log("baseDate:", row.base_date);
  console.log("source:", row.source_type, "status:", row.status);
  console.log("createdAt:", row.created_at);
  console.log("Raw text (first 200 chars):", String(row.raw_text || "").slice(0, 200));
  const j = row.parsed_json;
  console.log("Summary:", j.summary);
  console.log(`Events (${j.events.length}):`, JSON.stringify(j.events, null, 2));
  console.log(`Tasks (${j.tasks.length}):`, JSON.stringify(j.tasks, null, 2));
  console.log(`Packing (${j.packingItems.length}):`, JSON.stringify(j.packingItems, null, 2));
  console.log(`Reference (${j.referenceItems.length}):`, JSON.stringify(j.referenceItems, null, 2));
}
