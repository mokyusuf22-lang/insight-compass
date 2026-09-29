import { supabase } from '@/integrations/supabase/client';

export interface CoachAssignment {
  id: string;
  coach_id: string;
  user_id: string;
  is_demo: boolean;
}

/**
 * The client's current coach assignment. A user can have several active rows
 * (the admin "demo client" is assigned to every coach), so prefer the newest
 * real assignment and only fall back to a demo one.
 */
export async function findMyCoachAssignment(userId: string): Promise<CoachAssignment | null> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('id, coach_id, user_id, is_demo')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('is_demo', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) console.error('Error loading coach assignment:', error);
  return data?.[0] ?? null;
}

/** The active assignment between this coach and a client, if any. */
export async function findCoachClientAssignment(coachId: string, clientId: string): Promise<CoachAssignment | null> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('id, coach_id, user_id, is_demo')
    .eq('coach_id', coachId)
    .eq('user_id', clientId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) console.error('Error loading coach assignment:', error);
  return data ?? null;
}

export async function getCoachDisplayName(coachId: string): Promise<{ displayName: string; bio: string | null }> {
  const { data } = await supabase
    .from('coach_profiles')
    .select('display_name, bio')
    .eq('user_id', coachId)
    .maybeSingle();
  const name = data?.display_name?.trim();
  return { displayName: name || 'Your coach', bio: data?.bio ?? null };
}
