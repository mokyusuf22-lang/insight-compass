# Edge functions

| Function | What it does |
|---|---|
| `aura-plan` | Aura's goal themes (`mode: "themes"`) and the step-by-step plan (`mode: "plan"`) |
| `generate-coaching` | "Ask Aura" answers on the task page |
| `delete-account` | Account → "Delete my account": removes the user's data and login (uses the service role, server-side only) |
| `_shared/` | Shared prompts (`prompts.ts`), Claude helper (`ai.ts`), coach name (`coach.ts`). Not deployed on its own. |

Backup AI providers (Groq, Mistral, OpenRouter) and how to get free keys: [docs/AI_PROVIDERS.md](../../docs/AI_PROVIDERS.md).

Prompts, readable: [docs/AI_PROMPTS.md](../../docs/AI_PROMPTS.md).

## Deploy and verify

**Shortcut:** `npm run supabase:setup` runs the new migrations and deploys all three functions. Options: `--admin <email>`, `--domain <domain>`, `--check`. See `scripts/supabase-setup.mjs`. The manual steps are below.

The app talks to the Supabase project in `.env` (`VITE_SUPABASE_PROJECT_ID`, currently `gbrgscsloxjvqquknmxm`). The functions **and** the secret must be on that same project, or every AI call fails and Aura shows general content instead.

```bash
supabase login
supabase link --project-ref gbrgscsloxjvqquknmxm
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...        # from console.anthropic.com
# Websites allowed to call the functions from a browser (comma-separated; * matches a subdomain part).
supabase secrets set ALLOWED_ORIGINS="https://<your-domain>,https://www.<your-domain>,https://*.vercel.app,http://localhost:8080"
supabase functions deploy aura-plan generate-coaching delete-account
```

Run `supabase/migrations/20261107120000_security_hardening.sql` too. It adds the per-user AI limits that the functions check. Until it's run, the functions log `quota check failed` and allow the call.

### Smoke test

1. Sign in to the app (a guest account is fine).
2. In the browser console, run `JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')))).access_token`.
3. Copy the token, then run:

```bash
TOKEN=...   # the access token
ANON=...    # VITE_SUPABASE_PUBLISHABLE_KEY from .env
curl -s https://gbrgscsloxjvqquknmxm.supabase.co/functions/v1/aura-plan \
  -H "Authorization: Bearer $TOKEN" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"mode":"themes","goal":{"label":"Run a 10k","category":"Health"},"about":{"level":"Complete beginner","timeline":"3 months","hours":"3–5 hours","obstacles":["Time"]},"location":{"country":"United Kingdom","countryCode":"GB","city":"Leeds"}}'
```

- **It works:** you get `{ "summary": ..., "themes": [...] }`.
- **It fails:** you get `{ "error", "stage" }`, where `stage` says why:
  - `auth`: no valid sign-in token, or an invalid API key.
  - `config`: `ANTHROPIC_API_KEY` is not set.
  - `rate_limit`, `api`, `refusal`, `max_tokens`: the Claude call itself failed.
- **Logs:** Supabase Dashboard → Edge Functions → *function* → Logs. Each success logs which model answered and how long it took.

## Auth settings these functions rely on

Guests use Supabase anonymous sign-in, so in **Authentication → Sign In / Providers**:

- Turn on **Allow anonymous sign-ins**.
- Turn off **Confirm email**, so email sign-ups can log straight in.
