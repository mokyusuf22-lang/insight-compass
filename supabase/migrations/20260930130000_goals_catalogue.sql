-- Goal catalogue for the Aura goal picker (1,000+ goals, searched server-side).
-- Goals are labels only; Aura's themes and the step-by-step plan are generated
-- per user by the aura-plan edge function. Seed data: 20260930130100_seed_goals.sql
-- (built from supabase/seed/goals/*.json by scripts/build-goals-seed.mjs).

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.goals (
  id         text PRIMARY KEY,                -- slug, e.g. 'pass-my-driving-test'
  label      text NOT NULL,
  category   text NOT NULL,
  keywords   text NOT NULL DEFAULT '',        -- comma-separated synonyms
  popularity integer NOT NULL DEFAULT 0,
  search     tsvector GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, label || ' ' || keywords || ' ' || category)
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_search_idx ON public.goals USING gin (search);
CREATE INDEX IF NOT EXISTS goals_trgm_idx ON public.goals
  USING gin ((label || ' ' || keywords) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS goals_popularity_idx ON public.goals (popularity DESC);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read goals" ON public.goals;
CREATE POLICY "Anyone can read goals" ON public.goals FOR SELECT USING (true);
-- No insert/update/delete policies: the catalogue is managed through migrations only.

-- Ranked search: prefix full-text match OR fuzzy (typo-tolerant) trigram match.
-- Empty query returns the most popular goals.
CREATE OR REPLACE FUNCTION public.search_goals(q text DEFAULT '', lim integer DEFAULT 12)
RETURNS TABLE (id text, label text, category text)
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions
AS $$
DECLARE
  v_q   text := left(btrim(coalesce(q, '')), 100);
  v_lim integer := least(greatest(coalesce(lim, 12), 1), 24);
  v_words text[];
  v_tsq tsquery;
BEGIN
  IF v_q = '' THEN
    RETURN QUERY
      SELECT g.id, g.label, g.category FROM public.goals g
      ORDER BY g.popularity DESC, g.label
      LIMIT v_lim;
    RETURN;
  END IF;

  v_words := array(
    SELECT w FROM unnest(regexp_split_to_array(lower(regexp_replace(v_q, '[^[:alnum:]]+', ' ', 'g')), '\s+')) w
    WHERE length(w) >= 2
  );
  IF array_length(v_words, 1) > 0 THEN
    v_tsq := to_tsquery('simple', array_to_string(array(SELECT w || ':*' FROM unnest(v_words) w), ' | '));
  END IF;

  RETURN QUERY
    SELECT g.id, g.label, g.category
    FROM public.goals g
    WHERE (v_tsq IS NOT NULL AND g.search @@ v_tsq)
       OR word_similarity(v_q, g.label || ' ' || g.keywords) > 0.35
    ORDER BY
      (CASE WHEN g.label ILIKE v_q || '%' THEN 2 ELSE 0 END)
      + (CASE WHEN v_tsq IS NOT NULL THEN ts_rank(g.search, v_tsq) * 4 ELSE 0 END)
      + word_similarity(v_q, g.label || ' ' || g.keywords)
      + g.popularity / 200.0 DESC,
      g.label
    LIMIT v_lim;
END;
$$;

GRANT SELECT ON public.goals TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_goals(text, integer) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
