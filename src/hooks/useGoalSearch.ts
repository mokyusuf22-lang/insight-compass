import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GOAL_FALLBACK } from '@/data/goalFallback';
import type { GoalRef } from '@/lib/auraFlow';

const DEBOUNCE_MS = 250;
const LIMIT = 12;

/** Offline/pre-migration fallback: simple word match over the popular goals. */
function localSearch(q: string): GoalRef[] {
  const words = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
  if (!words.length) return GOAL_FALLBACK.slice(0, LIMIT);
  return GOAL_FALLBACK
    .map((g) => {
      const hay = `${g.label} ${g.keywords} ${g.category}`.toLowerCase();
      return { g, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT)
    .map((x) => x.g);
}

/**
 * Searches the goal catalogue (1,200+ goals) via the search_goals RPC.
 * Empty query returns popular goals. Results are cached per query for the session.
 */
export function useGoalSearch(query: string) {
  const q = query.trim();
  const cache = useRef(new Map<string, GoalRef[]>());
  const [results, setResults] = useState<GoalRef[]>(() => cache.current.get(q) ?? []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hit = cache.current.get(q);
    if (hit) { setResults(hit); setLoading(false); return; }

    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_goals', { q, lim: LIMIT });
      if (cancelled) return;
      let rows: GoalRef[];
      if (error) {
        console.warn('search_goals unavailable, using local fallback:', error.message);
        rows = localSearch(q);
      } else {
        rows = (data ?? []).map((g) => ({ id: g.id, label: g.label, category: g.category }));
      }
      cache.current.set(q, rows);
      setResults(rows);
      setLoading(false);
    }, q ? DEBOUNCE_MS : 0);

    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  return { results, loading };
}
