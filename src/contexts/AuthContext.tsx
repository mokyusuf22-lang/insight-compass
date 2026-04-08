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
  path_committed?: boolean;
  personal_path_generated?: boolean;
}

interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  tierName: string;
  productId: string | null;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: SubscriptionState;
  loading: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
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
  isAdmin: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

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

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
        return true;
      }
      setIsAdmin(false);
      return false;
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
      return false;
    }
  };

  const fetchSubscription = useCallback(async () => {
    if (!session?.access_token || !user) {
      setSubscription({ ...defaultSubscription, loading: false });
      return;
    }

    // Check if user is admin first
    const userIsAdmin = await checkAdminRole(user.id);
    
    // If admin, grant full access without checking Stripe
    if (userIsAdmin) {
      setSubscription({
        subscribed: true,
        tier: 'premium',
        tierName: 'Admin (Full Access)',
        productId: null,
        subscriptionEnd: null,
        cancelAtPeriodEnd: false,
        loading: false,
        isAdmin: true,
      });
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
        isAdmin: false,
      });
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setSubscription({ ...defaultSubscription, loading: false });
    }
  }, [session?.access_token, user]);

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
        setEmailVerified(!!session?.user?.email_confirmed_at);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setEmailVerified(false);
          setSubscription({ ...defaultSubscription, loading: false });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setEmailVerified(!!session?.user?.email_confirmed_at);

      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
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
    const redirectUrl = `${window.location.origin}/auth?verified=true`;
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
        redirectTo: `${window.location.origin}/aura/welcome`,
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

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth?verified=true` },
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
    setIsAdmin(false);
    setSubscription({ ...defaultSubscription, loading: false });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      subscription,
      loading,
      isAdmin,
      emailVerified,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      resendVerificationEmail,
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
