import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("--- workspaces ---");
console.log(await sql`SELECT id, name, child_name, created_by_clerk_user_id FROM workspaces`);

console.log("--- workspace_members ---");
console.log(await sql`SELECT id, workspace_id, clerk_user_id, role, display_name FROM workspace_members`);

console.log("--- notices count ---");
console.log(await sql`SELECT COUNT(*)::int as n FROM notices`);

console.log("--- completions count ---");
console.log(await sql`SELECT COUNT(*)::int as n FROM completions`);
