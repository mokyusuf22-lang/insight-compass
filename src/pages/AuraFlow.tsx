import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  AuraFlowState, HOURS, PlanPhase, STEP_LABELS, Theme,
  auraSummary, buildPaths, buildReport, freshFlowState, planRequest, recommendedPathIdx, requestKey, resolveGoal,
  themesRequest, toPersonalPathPhases,
} from '@/lib/auraFlow';
import { WelcomeStep } from '@/components/aura/flow/WelcomeStep';
import { GoalStep } from '@/components/aura/flow/GoalStep';
import { AboutStep } from '@/components/aura/flow/AboutStep';
import { AuraStep } from '@/components/aura/flow/AuraStep';
import { CheckInsStep } from '@/components/aura/flow/CheckInsStep';
import { InsightsStep } from '@/components/aura/flow/InsightsStep';
import { PathsStep } from '@/components/aura/flow/PathsStep';
import { CommitStep } from '@/components/aura/flow/CommitStep';
import { Wordmark } from '@/components/aura/flow/ui';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';

/** aura_sessions.current_step once the user has committed to a path. */
export const AURA_COMMITTED_STEP = 8;
const MIN_ANALYSE_MS = 1400;
const draftKey = (userId: string) => `aura_flow_v2:${userId}`;

export default function AuraFlow() {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const startNew = params.get('new') === '1';

  const [s, setS] = useState<AuraFlowState>(() => freshFlowState());
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [planStatus, setPlanStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const stateRef = useRef(s);
  stateRef.current = s;
  // Key of the plan request currently in flight (drops stale responses and duplicate calls).
  const planInFlight = useRef<string | null>(null);
  // Set false if the flow_data column hasn't been migrated yet; we then save the core columns only.
  const flowDataSupported = useRef(true);

  const m = resolveGoal(s);

  const update = useCallback((patch: Partial<AuraFlowState>) => setS((prev) => ({ ...prev, ...patch })), []);

  // ── Load / resume ─────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/auth', { state: { from: '/aura' } }); return; }

    const load = async () => {
      const { data: existing } = await supabase
        .from('aura_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const row = existing as any;
      const fallbackName = row?.name || user.user_metadata?.display_name || '';

      if (row && !startNew) {
        const committed = (row.current_step ?? 0) >= AURA_COMMITTED_STEP;
        // Sessions from the old 7-step flow have no flow_data; step 7 meant "finished".
        const legacyDone = !row.flow_data && (row.current_step ?? 0) >= 7;
        if (committed || legacyDone) { navigate('/welcome', { replace: true }); return; }

        let restored: AuraFlowState | null = null;
        try {
          const raw = localStorage.getItem(draftKey(user.id));
          if (raw) restored = { ...freshFlowState(), ...JSON.parse(raw) };
        } catch { /* ignore corrupt draft */ }
        if (!restored && row.flow_data) restored = { ...freshFlowState(), ...row.flow_data };

        setSessionId(row.id);
        setS(restored ?? freshFlowState(fallbackName));
      } else {
        localStorage.removeItem(draftKey(user.id));
        const { data: created, error } = await supabase
          .from('aura_sessions')
          .insert({ user_id: user.id, name: fallbackName || null, email: user.email ?? null, current_step: 0 } as any)
          .select('id')
          .single();
        if (error) console.error('Error creating aura session:', error);
        setSessionId(created?.id ?? null);
        setS(freshFlowState(fallbackName));
        if (startNew) navigate('/aura', { replace: true });
      }
      setReady(true);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // ── Persist: localStorage immediately, DB debounced ───────
  useEffect(() => {
    if (!ready || !user) return;
    try { localStorage.setItem(draftKey(user.id), JSON.stringify(s)); } catch { /* storage full or blocked */ }
    if (!sessionId) return;

    const t = setTimeout(async () => {
      const cur = resolveGoal(s);
      const core = {
        name: s.name.trim() || null,
        challenge_text: cur.has ? cur.title : null,
        identified_themes: cur.goal
          ? cur.goal.themes.map(([area, conf, explanation]) => ({ area, confidence: conf / 100, explanation }))
          : null,
        aura_summary: cur.has && s.level ? auraSummary(s, cur) : null,
        current_step: s.step,
      };
      const payload = flowDataSupported.current ? { ...core, flow_data: s } : core;
      const { error } = await supabase.from('aura_sessions').update(payload as any).eq('id', sessionId);
      if (error && flowDataSupported.current && /flow_data/.test(error.message)) {
        flowDataSupported.current = false;
        await supabase.from('aura_sessions').update(core as any).eq('id', sessionId);
      } else if (error) {
        console.error('Error saving aura session:', error);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [s, ready, user, sessionId]);

  // ── Aura themes (step 3) ──────────────────────────────────
  // Cached by request payload, so going Back or reloading doesn't re-spend an AI call.
  const analyse = useCallback(async () => {
    const cur = stateRef.current;
    const goal = resolveGoal(cur);
    if (!goal.has) return;
    const payload = themesRequest(cur, goal);
    const key = requestKey(payload);
    if (cur.themesKey === key && cur.aiThemes) return;

    setAnalysing(true);
    const started = Date.now();
    let aiThemes: Theme[] | null = null;
    try {
      const { data, error } = await supabase.functions.invoke('aura-plan', { body: { mode: 'themes', ...payload } });
      if (error) throw error;
      aiThemes = (data?.themes ?? []).map((t: { area: string; confidence: number; why: string }): Theme => [t.area, t.confidence, t.why]);
    } catch (err) {
      // Fall back to generic themes rather than blocking the flow.
      console.error('aura-plan themes failed, using defaults:', err);
    }

    const wait = MIN_ANALYSE_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setS((prev) => ({ ...prev, aiThemes: aiThemes?.length ? aiThemes : null, themesKey: aiThemes?.length ? key : null }));
    setAnalysing(false);
  }, []);

  // ── Location-aware plan (requested on the way to Insights) ─
  const ensurePlan = useCallback(async (force = false) => {
    const cur = stateRef.current;
    const goal = resolveGoal(cur);
    if (!goal.has) return;
    const payload = planRequest(cur, goal);
    const key = requestKey(payload);
    if (!force && cur.plan?.key === key) return;
    if (planInFlight.current === key) return;

    planInFlight.current = key;
    setPlanStatus('loading');
    try {
      const { data, error } = await supabase.functions.invoke('aura-plan', { body: { mode: 'plan', ...payload } });
      if (error) throw error;
      if (!Array.isArray(data?.phases) || data.phases.length === 0) throw new Error('Empty plan');
      // Ignore a stale response if the user changed answers meanwhile.
      if (planInFlight.current !== key) return;
      setS((prev) => ({ ...prev, plan: { key, phases: data.phases as PlanPhase[] } }));
      setPlanStatus('idle');
    } catch (err) {
      console.error('aura-plan plan failed, using a general plan:', err);
      if (planInFlight.current === key) setPlanStatus('error');
    } finally {
      if (planInFlight.current === key) planInFlight.current = null;
    }
  }, []);

  // Resuming on Insights/Paths/Commit: make sure the plan matches the saved answers.
  useEffect(() => {
    if (ready && s.step >= 5 && s.step <= 7) ensurePlan();
    // Only on load; later changes go through go().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const go = useCallback((n: number) => {
    setS((prev) => ({
      ...prev,
      step: n,
      maxStep: Math.max(prev.maxStep, n),
      // Pre-select support on Commit to match the chosen path.
      support: n === 7 && !prev.support && prev.pathIdx !== null ? (prev.pathIdx === 2 ? 'coach' : 'self') : prev.support,
    }));
    if (n === 3) analyse();
    if (n === 5) ensurePlan();
    window.scrollTo({ top: 0 });
  }, [analyse, ensurePlan]);

  const resetDown = useCallback((): Partial<AuraFlowState> => ({
    aiThemes: null, themesKey: null, plan: null, pathIdx: null, maxStep: Math.min(stateRef.current.maxStep, 1),
  }), []);

  const restart = () => {
    planInFlight.current = null;
    setAnalysing(false);
    setPlanStatus('idle');
    setS(freshFlowState(s.name));
  };

  // ── Commit: write the path and report the rest of the app reads ──
  const commit = async () => {
    if (!user || !m.has || !m.goal) return;
    setSaving(true);
    try {
      const paths = buildPaths(s, m);
      const idx = s.pathIdx ?? recommendedPathIdx(s);
      const chosen = paths[idx];
      const report = buildReport(s, m);
      const hoursLabel = HOURS.find((h) => h.v === s.hours)?.label ?? '';

      await supabase.from('personal_paths').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true);

      const results = await Promise.all([
        supabase.from('personal_paths').insert({
          user_id: user.id,
          title: m.title,
          description: `${chosen.name} · ${chosen.weeks} weeks · ${chosen.cadence}`,
          phases: toPersonalPathPhases(m, chosen) as any,
          total_progress: 0,
          is_active: true,
        }),
        supabase.from('reality_reports' as any).insert({
          user_id: user.id,
          generated_summary: JSON.stringify({
            headline: `Your picture for “${m.title}”`,
            key_insight: report.watchOuts,
            summary: report.summary,
            working: report.working,
            drives: report.drives,
            accurate: s.accurate,
            source: 'aura',
          }),
          strengths: [report.working],
          risks: [report.watchOuts],
          key_constraints: s.obstacles,
        }),
        supabase.from('path_recommendations' as any).insert({
          user_id: user.id,
          recommendations: paths.map((p) => ({
            title: p.name, tagline: p.desc, difficulty: p.cadence, time_horizon: `${p.weeks} weeks`, phases: p.phases,
          })),
          selected_path_index: idx,
        }),
        supabase.from('path_commitments' as any).insert({
          user_id: user.id,
          chosen_path: { ...chosen, goal: m.title, goal_id: s.goal?.id, location: s.location, support: s.support, start: s.start },
          intent: s.pledge.trim() || null,
          focus_area: m.title,
          time_budget: hoursLabel,
          constraints: s.obstacles.join(', ') || null,
        }),
        supabase.from('profiles').update({
          reality_report_generated: true,
          path_options_shown: true,
          path_committed: true,
          personal_path_generated: true,
        } as any).eq('user_id', user.id),
      ]);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;

      // Match a human coach now (least-loaded with room) or join the admin queue.
      // A failure here shouldn't undo the commit; the dashboard shows the queued state.
      if (s.support === 'coach') {
        const { data: match, error: matchError } = await supabase.rpc('request_coach', { p_goal: m.title });
        if (matchError) console.error('request_coach failed:', matchError);
        const name = (match as { display_name?: string } | null)?.display_name;
        if (name) toast.success(`You’ve been matched with ${name}. Say hello!`);
      }

      if (sessionId) {
        const committed = { ...s, step: AURA_COMMITTED_STEP };
        const core = { current_step: AURA_COMMITTED_STEP, user_confirmed: s.accurate !== 'no' };
        await supabase.from('aura_sessions')
          .update((flowDataSupported.current ? { ...core, flow_data: committed } : core) as any)
          .eq('id', sessionId);
      }
      localStorage.removeItem(draftKey(user.id));
      await refreshProfile();
      navigate('/welcome');
    } catch (err) {
      console.error('Error committing path:', err);
      toast.error('We couldn’t save your path. Please try again.');
      setSaving(false);
    }
  };

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bm-cream">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  const stepProps = { s, m, update, go };
  const showRail = s.step >= 1 && s.step <= 7;

  return (
    <div className="relative flex min-h-screen bg-bm-cream font-manrope text-bm-ink">
      {showRail && (
        // Outer div stretches with the page so the sand background runs full height; the rail itself stays sticky.
        <div className="hidden w-[260px] shrink-0 border-r border-bm-line bg-bm-sand lg:block">
        <aside className="sticky top-0 flex h-screen flex-col gap-9 px-[22px] py-8">
          <Wordmark />
          <nav aria-label="Progress" className="flex flex-col gap-1">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const cur = s.step === n;
              const done = !cur && n <= s.maxStep;
              const locked = n > s.maxStep;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => go(n)}
                  disabled={locked || analysing}
                  aria-current={cur ? 'step' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-[10px] px-2.5 py-2 text-left text-[15px] disabled:cursor-not-allowed',
                    cur ? 'bg-bm-paper font-bold' : 'bg-transparent font-medium',
                    locked ? 'text-bm-muted' : 'text-bm-ink',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-xs font-bold',
                      cur ? 'border-bm-ink bg-bm-ink text-bm-paper'
                        : done ? 'border-bm-green bg-bm-green text-bm-paper'
                        : 'border-bm-stone bg-transparent text-bm-muted',
                    )}
                  >
                    {n}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
          {m.has && (
            <div className="mt-auto flex flex-col gap-1.5 rounded-[14px] border border-bm-line bg-bm-paper p-4">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-bm-muted">Your goal</div>
              <div className="font-display text-[22px] leading-[1.15]">{m.title}</div>
            </div>
          )}
        </aside>
        </div>
      )}

      <main className="relative flex min-w-0 flex-grow flex-col">
        <button
          type="button"
          onClick={restart}
          className="absolute right-4 top-3.5 z-10 flex h-8 items-center gap-1.5 rounded-full border border-bm-line bg-bm-paper px-3 text-xs font-semibold text-bm-muted"
        >
          <RotateCcw className="h-[13px] w-[13px]" aria-hidden />
          Start over
        </button>

        {showRail && (
          <div className="flex flex-col gap-3 border-b border-bm-line bg-bm-sand px-5 pb-4 pt-4 lg:hidden">
            <Wordmark className="text-2xl" />
            <div className="h-1.5 overflow-hidden rounded-full bg-bm-track" aria-hidden>
              <div className="h-1.5 rounded-full bg-bm-green transition-all" style={{ width: `${(s.step / 7) * 100}%` }} />
            </div>
          </div>
        )}

        {s.step === 0 ? (
          <WelcomeStep {...stepProps} />
        ) : (
          <div className="mx-auto flex w-full max-w-[1100px] flex-grow flex-col px-5 pb-7 pt-8 md:px-14 md:pt-11">
            {s.step === 1 && <GoalStep {...stepProps} resetDown={resetDown} />}
            {s.step === 2 && <AboutStep {...stepProps} />}
            {s.step === 3 && (
              <AuraStep {...stepProps} analysing={analysing} onConfirm={() => { update({ checkIdx: 0 }); go(4); }} />
            )}
            {s.step === 4 && <CheckInsStep {...stepProps} />}
            {s.step === 5 && <InsightsStep {...stepProps} />}
            {s.step === 6 && <PathsStep {...stepProps} planStatus={planStatus} onRetryPlan={() => ensurePlan(true)} />}
            {s.step === 7 && (
              <CommitStep {...stepProps} saving={saving} planLoading={planStatus === 'loading'} onCommit={commit} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
