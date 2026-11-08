# AI providers and fallbacks

Aura tries each AI in turn, best first, until one gives a usable answer:

| Order | Provider | Model | Cost | Key secret |
|---|---|---|---|---|
| 1 | Anthropic | Claude Sonnet 5.5 (plans) or Haiku 5.5 (themes, Q&A) | Paid | `ANTHROPIC_API_KEY` (already set) |
| 2 | Anthropic | Claude Haiku 5.5 | Paid | same key |
| 3 | Groq | Llama 3.3 70B | **Free tier** | `GROQ_API_KEY` |
| 4 | Mistral AI | Mistral Small | **Free tier** | `MISTRAL_API_KEY` |
| 5 | OpenRouter | a free model | **Free** (low daily limit) | `OPENROUTER_API_KEY` |
| 6 | none | Aura's built-in general themes and plan | Free | nothing to set |

- **Skipped:** any provider without a key.
- **Time limit:** the whole chain stops after about 140 seconds, so a slow provider can't hang the page.
- **Plan quality:** answers from providers 3 to 5 are checked the same way as Claude's. A broken answer moves on to the next provider. Expect plainer plans from them.
- **Logs:** the Supabase function logs show which provider answered, e.g. `ok on groq (llama-3.3-70b-versatile)`.

Free tiers and model names change often. Check each provider's current terms when you sign up. If a model name stops working, set a new one without changing code, for example: `supabase secrets set GROQ_MODEL=<new model id>`.

## Why not Google Gemini's free tier?

- **Uses your users' data:** Google's free Gemini tier can use what you send it to improve its products.
- **UK and EU restriction:** Google's terms have also required the paid tier for apps used by people in the UK and EU.

Aura sends wellbeing answers, which count as health data, so it's left out. Gemini on a paid plan would be fine and could be added later.

## Step by step: get the free keys

### 1. Groq (recommended first backup: fast and generous)

1. Go to **console.groq.com** and sign up with Google or email. No card is needed.
2. Open **API Keys** in the left menu and click **Create API Key**.
3. Name it `bemore-supabase` and copy the key (`gsk_...`). It's shown only once.
4. **Data controls:** check Settings for data retention or training options and turn sharing off. Groq states it doesn't train on API data.
5. In your terminal, run:
   ```bash
   supabase secrets set GROQ_API_KEY=gsk_...
   ```

### 2. Mistral AI (EU company: good for UK and EU data)

1. Go to **console.mistral.ai** and sign up.
2. **Choose a plan:** under **Billing / Plans**, choose the free **Experiment** plan. It asks for a phone number to verify.
3. **Privacy:** look for the option about using your data to train models and **turn it off** before sending real user data. Free plans may have it on by default.
4. Open **API Keys**, then **Create new key**, and copy it.
5. Run:
   ```bash
   supabase secrets set MISTRAL_API_KEY=...
   ```

### 3. OpenRouter (last AI backup)

1. Go to **openrouter.ai** and sign up.
2. Open **Settings → Privacy** and turn **off** "Enable training / logging" for free models.
   - Some free models then disappear. That's the right trade-off for health data.
   - If the default model stops working, choose another free model ending in `:free` from openrouter.ai/models (filter: free). Then run `supabase secrets set OPENROUTER_MODEL=<model id>`.
3. Open **Keys**, then **Create Key**, and copy it (`sk-or-...`).
4. Run:
   ```bash
   supabase secrets set OPENROUTER_API_KEY=sk-or-paste-your-key-here
   ```

Free OpenRouter models allow only a small number of requests a day (about 50 without credit). It's a last resort, not a main supply.

### 4. Turn it on

After setting the keys, redeploy so the functions run the new fallback code:

```bash
npm run supabase:setup
```

Then check which keys are set: `supabase secrets list`.

## Testing the fallback

**Test it:** to check that Groq really answers, temporarily break Claude:

```bash
supabase secrets set ANTHROPIC_API_KEY=broken
```

Run through Aura, and the logs should show `ok on groq`.

**Put it back:** set the real Anthropic key again straight away:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## Before launch

The Privacy Policy (`/privacy`) now lists Groq, Mistral and OpenRouter as backup providers, and the Aura consent box mentions backup AI.

Do these before launch:

- **Remove unused providers:** if you don't set a key for one, remove it from the list in `src/pages/Legal.tsx`.
- **Keep the data agreements:** download each provider's data processing agreement (DPA) with the others.
- **Solicitor review:** ask the solicitor to look at the backup providers too, as part of the review in [LAUNCH_TODO.md](LAUNCH_TODO.md).
