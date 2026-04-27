import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const migrationPath = path.join(
    __dirname,
    "supabase/migrations/20260427_create_wf_rag.sql"
  );
  const sql = await fs.readFile(migrationPath, "utf8");

  console.log("📋 Applying migration...");

  const { error } = await supabase.rpc("pg_net.http_post", {
    url: `${supabaseUrl}/rest/v1/rpc/exec_raw_sql`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }

  console.log("✅ Migration applied successfully!");
}

runMigration().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
