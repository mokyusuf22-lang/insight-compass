import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useAuraReturn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasActiveAura, setHasActiveAura] = useState(false);

  useEffect(() => {
    const check = async () => {
      // Check localStorage first
      const flag = localStorage.getItem('aura_active');
      if (flag === 'true') {
        setHasActiveAura(true);
        return;
      }

      // Check DB
      if (!user) return;
      const { data } = await supabase
        .from('aura_sessions')
        .select('id, current_step')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && (data.current_step ?? 0) < 7) {
        setHasActiveAura(true);
        localStorage.setItem('aura_active', 'true');
      }
    };
    check();
  }, [user]);

  const returnToAura = () => {
    navigate('/aura/assessments');
  };

  return { hasActiveAura, returnToAura };
}
