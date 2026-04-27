#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function displayMigration() {
  const migrationPath = path.join(
    __dirname,
    "../supabase/migrations/20260427_create_wf_rag.sql"
  );

  const sql = await fs.readFile(migrationPath, "utf8");

  console.log(`
┌────────────────────────────────────────────────────────────┐
│  WF RAG Migration SQL                                      │
│  Copy the SQL below into Supabase SQL Editor               │
│  https://dcwhczcvndjasjsfrine.supabase.co/sql              │
└────────────────────────────────────────────────────────────┘

${sql}

┌────────────────────────────────────────────────────────────┐
│  Steps:                                                    │
│  1. Go to Supabase dashboard                               │
│  2. Open SQL Editor                                        │
│  3. Create new query                                       │
│  4. Paste the SQL above                                    │
│  5. Click "Run"                                            │
│  6. Verify wf_brain_chunks table and functions exist       │
└────────────────────────────────────────────────────────────┘
  `);
}

displayMigration().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
