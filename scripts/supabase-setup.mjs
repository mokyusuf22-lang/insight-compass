#!/usr/bin/env node
// One-command Supabase setup for Be:More: database changes, admin, secrets, edge functions.
// Works in PowerShell, Git Bash, macOS and Linux. Safe to run more than once.
//
//   npm run supabase:setup                                   # migrations + deploy
//   npm run supabase:setup -- --admin you@example.com        # also make that account an admin
//   npm run supabase:setup -- --domain bemore.app            # also restrict who can call the AI functions
//   npm run supabase:check                                   # only show what's set up, change nothing
//
// Needs: Supabase CLI, logged in (`supabase login`) and linked (`supabase link --project-ref gbrgscsloxjvqquknmxm`).
// Note: this database was built in the SQL editor, so it has no migration history and
// `supabase db push` would re-run every old migration. This script runs only the files listed below.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const MIGRATIONS = [
  "supabase/migrations/20261105120000_single_coach.sql",
  "supabase/migrations/20261107120000_security_hardening.sql",
];
const FUNCTIONS = ["aura-plan", "generate-coaching", "delete-account"];
const SECRETS_TO_SHOW = ["ANTHROPIC_API_KEY", "GROQ_API_KEY", "MISTRAL_API_KEY", "OPENROUTER_API_KEY", "ALLOWED_ORIGINS"];

// ── arguments ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let admin = "", domain = "", check = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--admin") admin = args[++i] ?? "";
  else if (args[i] === "--domain") domain = args[++i] ?? "";
  else if (args[i] === "--check") check = true;
  else { console.error(`Unknown option: ${args[i]}`); process.exit(1); }
}

// ── helpers ─────────────────────────────────────────────────────────────────
const step = (s) => console.log(`\n\x1b[1;33m▶ ${s}\x1b[0m`);

/** Runs the Supabase CLI. Uses the Windows shell on Windows so the npm-installed `supabase` is found. */
function supabase(cliArgs, { quiet = false } = {}) {
  const r = spawnSync("supabase", cliArgs, {
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: quiet ? "pipe" : ["inherit", "pipe", "pipe"],
  });
  if (r.error) { console.error(`Couldn't run the Supabase CLI: ${r.error.message}`); process.exit(1); }
  return { ok: r.status === 0, stdout: r.stdout ?? "", out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/** Runs SQL on the linked project and returns the result rows. */
function query(sql) {
  // Passing SQL through a file avoids quoting problems in Windows shells.
  const dir = mkdtempSync(join(tmpdir(), "bemore-sql-"));
  const file = join(dir, "q.sql");
  writeFileSync(file, sql);
  const r = supabase(["db", "query", "--linked", "-f", process.platform === "win32" ? `"${file}"` : file], { quiet: true });
  rmSync(dir, { recursive: true, force: true });
  if (!r.ok) { console.error(r.out.trim().split("\n").slice(-3).join("\n")); process.exit(1); }
  const json = r.stdout.slice(r.stdout.indexOf("{"), r.stdout.lastIndexOf("}") + 1);
  try { return JSON.parse(json).rows ?? []; } catch { console.error("Couldn't read query result."); return []; }
}

const sqlString = (s) => `'${s.replace(/'/g, "''")}'`;

function status() {
  step("Status");
  const rows = query(`
    select 'single_coach migration' as item, (exists(select 1 from information_schema.columns where table_schema='public' and table_name='coach_profiles' and column_name='is_primary'))::text as ok
    union all select 'security migration', (to_regclass('public.user_consents') is not null and to_regprocedure('public.consume_ai_quota(text)') is not null)::text
    union all select 'admins', (select count(*) from public.user_roles where role='admin')::text
    union all select 'primary coach set', (exists(select 1 from public.coach_profiles where is_primary))::text`);
  for (const r of rows) console.log(`  ${r.item.padEnd(24)} ${r.ok}`);

  const secrets = supabase(["secrets", "list", "--output", "json"], { quiet: true }).out;
  console.log("  AI / CORS secrets:");
  for (const name of SECRETS_TO_SHOW) {
    console.log(`    ${name.padEnd(20)} ${secrets.includes(`"${name}"`) ? "set" : "not set"}`);
  }
}

// ── run ─────────────────────────────────────────────────────────────────────
step("Project");
const refFile = "supabase/.temp/project-ref";
if (!existsSync(refFile)) {
  console.error("Not linked. Run: supabase link --project-ref gbrgscsloxjvqquknmxm");
  process.exit(1);
}
console.log(`Linked to ${readFileSync(refFile, "utf8").trim()}`);

if (check) { status(); process.exit(0); }

step("Database changes");
for (const f of MIGRATIONS) {
  console.log(`Running ${f}`);
  const r = supabase(["db", "query", "--linked", "-f", f], { quiet: true });
  if (!r.ok) {
    console.error(r.out.trim().split("\n").slice(-3).join("\n"));
    console.error(`Failed on ${f}`);
    process.exit(1);
  }
}

if (admin) {
  step(`Admin: ${admin}`);
  const rows = query(`
    insert into public.user_roles (user_id, role)
    select id, 'admin' from auth.users where lower(email) = lower(${sqlString(admin)})
    on conflict do nothing
    returning user_id`);
  const exists = query(`select count(*)::text as n from auth.users where lower(email) = lower(${sqlString(admin)})`)[0]?.n;
  if (exists === "0") console.log("No account with that email yet. Sign up in the app first, then run this again.");
  else console.log(rows.length ? "Made admin." : "Already an admin.");
}

if (domain) {
  step("ALLOWED_ORIGINS");
  const origins = `https://${domain},https://www.${domain},https://*.vercel.app,http://localhost:8080,http://localhost:5173`;
  const r = supabase(["secrets", "set", `ALLOWED_ORIGINS=${origins}`]);
  if (!r.ok) { console.error(r.out); process.exit(1); }
  console.log(origins);
}

step("Edge functions");
const dep = supabase(["functions", "deploy", ...FUNCTIONS, "--use-api"]);
console.log(dep.out.trim().split("\n").filter((l) => !l.startsWith("Uploading asset")).join("\n"));
if (!dep.ok) process.exit(1);

status();
console.log("\nDone. Remaining dashboard and paperwork steps: docs/LAUNCH_TODO.md");
