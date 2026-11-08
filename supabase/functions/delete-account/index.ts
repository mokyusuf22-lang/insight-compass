// Permanently deletes the caller's account and their data (GDPR right to erasure).
// The caller must be signed in and send { "confirm": "DELETE" }. Uses the service role,
// which Supabase provides to edge functions automatically; it never leaves the server.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getUser, json, withCors } from "../_shared/ai.ts";

// Tables keyed by user_id. Most cascade from auth.users already; deleting explicitly
// first means one table without a cascade can't block the account deletion.
const USER_TABLES = [
  "ai_usage", "user_consents", "coach_requests", "path_commitments", "path_recommendations",
  "personal_paths", "weekly_execution_plans", "reality_reports", "career_strategies", "aura_sessions",
  "assessment_responses", "assessments", "disc_assessments", "mbti_assessments", "strengths_assessments",
  "wheel_of_life_assessments", "value_map_assessments", "blob_tree_assessments", "coach_applications",
  "profiles",
];

serve(withCors(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await getUser(req);
  if (!user) return json({ error: "Unauthorized", stage: "auth" }, 401);

  let body: { confirm?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body", stage: "input" }, 400);
  }
  if (body?.confirm !== "DELETE") return json({ error: "Confirmation missing", stage: "input" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false },
  });

  // Coaching: the client's messages and assignments go with them. (Messages cascade from
  // coach_assignments.) A coach deleting their own account is handled by an admin instead.
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  if ((roles ?? []).some((r) => r.role === "coach" || r.role === "admin")) {
    return json({ error: "Coach and admin accounts are deleted by an administrator. Please contact support.", stage: "role" }, 403);
  }
  await admin.from("coach_assignments").delete().eq("user_id", user.id);

  for (const table of USER_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", user.id);
    // A table that doesn't exist on this project is fine; anything else is logged.
    if (error && !/does not exist|Could not find/i.test(error.message)) {
      console.error(`delete-account: ${table}:`, error.message);
    }
  }
  await admin.from("user_roles").delete().eq("user_id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("delete-account: auth user:", error.message);
    return json({ error: "We couldn’t delete your account. Please contact support.", stage: "delete" }, 500);
  }
  console.log("delete-account: deleted", user.id);
  return json({ deleted: true });
}));
