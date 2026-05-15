import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("Dropping Neon sample 'todos' table...");
await sql`DROP TABLE IF EXISTS todos CASCADE`;
console.log("Done.");
