import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Shield, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';

interface CoachLoad { coach_id: string; display_name: string | null; max_clients: number; active_clients: number }
interface Request { user_id: string; goal: string | null; created_at: string; email: string | null; name: string | null }
interface Assignment {
  id: string; coach_id: string; user_id: string; created_at: string;
  coach_name: string | null; email: string | null; name: string | null; goal: string | null;
}
interface Overview { coaches: CoachLoad[]; requests: Request[]; assignments: Assignment[] }

const who = (r: { name: string | null; email: string | null; user_id: string }) => r.name || r.email || r.user_id.slice(0, 8);
const coachLabel = (c: CoachLoad) => `${c.display_name || c.coach_id.slice(0, 8)} (${c.active_clients}/${c.max_clients})`;

/** Admin screen for matching clients with coaches. */
export default function AdminCoaching() {
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Ending a match removes the coach's access, so it takes a second click.
  const [confirmEnd, setConfirmEnd] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: overview, error } = await supabase.rpc('admin_coaching_overview');
    if (error) {
      console.error(error);
      toast.error('Couldn’t load coaching data. Has the coaching migration been applied?');
      setData({ coaches: [], requests: [], assignments: [] });
      return;
    }
    setData(overview as unknown as Overview);
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    setBusy(key);
    const { error } = await fn();
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(ok);
    load();
  };

  const assign = (userId: string, coachId: string) =>
    run(`assign:${userId}`, () => supabase.rpc('admin_assign_coach', { p_user: userId, p_coach: coachId }), 'Coach assigned');
  const end = (assignmentId: string) =>
    run(`end:${assignmentId}`, () => supabase.rpc('admin_end_assignment', { p_assignment: assignmentId }), 'Assignment ended');
  const setMax = (coachId: string, max: number) =>
    run(`max:${coachId}`, () => supabase.rpc('admin_set_max_clients', { p_coach: coachId, p_max: max }), 'Capacity updated');

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const CoachPicker = ({ onPick, exclude, label }: { onPick: (id: string) => void; exclude?: string; label: string }) => (
    <Select onValueChange={onPick}>
      <SelectTrigger className="h-9 w-full sm:w-56 text-sm" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {data.coaches.filter((c) => c.coach_id !== exclude).map((c) => (
          <SelectItem key={c.coach_id} value={c.coach_id} disabled={c.active_clients >= c.max_clients}>
            {coachLabel(c)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} aria-label="Back to admin dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-7 h-7 chamfer-sm bg-accent flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-sm">Coach matching</span>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-10">
        <section aria-labelledby="queue-heading">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-accent" />
            <h2 id="queue-heading" className="font-semibold">Waiting for a coach</h2>
            <span className="text-xs text-muted-foreground">{data.requests.length}</span>
          </div>
          {data.requests.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-secondary/40 rounded-2xl p-5">
              Nobody is waiting. Clients who ask for a coach are matched automatically while coaches have room.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.requests.map((r) => (
                <li key={r.user_id} className="bg-card border border-border/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{who(r)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.goal || 'No goal recorded'} · waiting since {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {busy === `assign:${r.user_id}` ? <LoadingSpinner size="sm" /> : (
                    <CoachPicker label="Assign a coach" onPick={(id) => assign(r.user_id, id)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="coaches-heading">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent" />
            <h2 id="coaches-heading" className="font-semibold">Coach capacity</h2>
          </div>
          {data.coaches.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-secondary/40 rounded-2xl p-5">
              No approved coaches yet. Approve applications to add coaches.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4 font-medium">Coach</th>
                    <th className="py-2 pr-4 font-medium">Active clients</th>
                    <th className="py-2 font-medium">Max clients</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coaches.map((c) => (
                    <tr key={c.coach_id} className="border-b border-border/50">
                      <td className="py-3 pr-4">{c.display_name || c.coach_id.slice(0, 8)}</td>
                      <td className={`py-3 pr-4 ${c.active_clients >= c.max_clients ? 'text-destructive font-medium' : ''}`}>
                        {c.active_clients}
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          min={0}
                          max={500}
                          defaultValue={c.max_clients}
                          aria-label={`Max clients for ${c.display_name || 'coach'}`}
                          className="h-9 w-24"
                          disabled={busy === `max:${c.coach_id}`}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (Number.isInteger(v) && v !== c.max_clients) setMax(c.coach_id, v);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="assignments-heading">
          <h2 id="assignments-heading" className="font-semibold mb-3">Active matches</h2>
          {data.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-secondary/40 rounded-2xl p-5">No active client–coach matches yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.assignments.map((a) => (
                <li key={a.id} className="bg-card border border-border/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{who(a)} <span className="text-muted-foreground font-normal">→ {a.coach_name || 'Coach'}</span></p>
                    <p className="text-xs text-muted-foreground truncate">{a.goal || 'No goal recorded'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {busy === `assign:${a.user_id}` ? <LoadingSpinner size="sm" /> : (
                      <CoachPicker label="Reassign to…" exclude={a.coach_id} onPick={(id) => assign(a.user_id, id)} />
                    )}
                    <Button
                      variant={confirmEnd === a.id ? 'destructive' : 'ghost'}
                      size="sm"
                      className={confirmEnd === a.id ? 'gap-1.5' : 'text-destructive gap-1.5'}
                      disabled={busy === `end:${a.id}`}
                      onClick={() => {
                        if (confirmEnd === a.id) { setConfirmEnd(null); end(a.id); }
                        else setConfirmEnd(a.id);
                      }}
                      onBlur={() => setConfirmEnd((c) => (c === a.id ? null : c))}
                    >
                      <UserMinus className="w-4 h-4" />
                      {confirmEnd === a.id ? 'Confirm end' : 'End'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
