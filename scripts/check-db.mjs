import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`;
console.log("Tables in public schema:", tables.map((t) => t.table_name));

const enums = await sql`
  SELECT typname
  FROM pg_type
  WHERE typnamespace = 'public'::regnamespace AND typtype = 'e'
  ORDER BY typname
`;
console.log("Enums in public schema:", enums.map((e) => e.typname));
