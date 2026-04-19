import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const AURA_RETURN_KEY = 'aura_flow_active';

export function useAuraReturn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Initialize synchronously so it's correct on the first render — avoids the
  // race condition where hasAuraSession is still false when an assessment
  // completes and calls navigate().
  const [hasAuraSession, setHasAuraSession] = useState(
    () => !!localStorage.getItem(AURA_RETURN_KEY)
  );

  useEffect(() => {
    const check = async () => {
      if (!user) return;

      // Quick localStorage check first (avoids extra DB round-trip)
      const flag = localStorage.getItem(AURA_RETURN_KEY);
      if (flag === user.id) {
        setHasAuraSession(true);
        return;
      }

      // Fallback: check DB for an active session that hasn't reached insights yet
      const { data } = await supabase
        .from('aura_sessions')
        .select('id, current_step')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && (data as any).current_step !== null && (data as any).current_step < 6) {
        setHasAuraSession(true);
        localStorage.setItem(AURA_RETURN_KEY, user.id);
      } else if (!flag) {
        setHasAuraSession(false);
      }
    };

    check();
  }, [user]);

  const returnToAura = () => {
    navigate('/aura/assessments');
  };

  return { hasAuraSession, returnToAura };
}

export function clearAuraReturnFlag() {
  localStorage.removeItem(AURA_RETURN_KEY);
}

export function setAuraReturnFlag(userId: string) {
  localStorage.setItem(AURA_RETURN_KEY, userId);
}
