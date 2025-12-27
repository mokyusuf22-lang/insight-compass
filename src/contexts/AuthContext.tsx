import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionTier } from '@/lib/subscriptionTiers';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  has_paid: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  tierName: string;
  productId: string | null;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: SubscriptionState;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  tier: 'free',
  tierName: 'Free',
  productId: null,
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
  loading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscription({ ...defaultSubscription, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ ...defaultSubscription, loading: false });
        return;
      }

      setSubscription({
        subscribed: data.subscribed || false,
        tier: (data.tier as SubscriptionTier) || 'free',
        tierName: data.tier_name || 'Free',
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setSubscription({ ...defaultSubscription, loading: false });
    }
  }, [session?.access_token]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setSubscription({ ...defaultSubscription, loading: false });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  // Fetch subscription when session changes
  useEffect(() => {
    if (session) {
      fetchSubscription();
    }
  }, [session, fetchSubscription]);

  // Auto-refresh subscription every minute
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      fetchSubscription();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [session, fetchSubscription]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/welcome`,
      },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription({ ...defaultSubscription, loading: false });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      subscription,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      signOut,
      refreshProfile,
      refreshSubscription,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
