import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Waypoints,
} from 'lucide-react';

type AppStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'loading';

export default function BecomeACoach() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [appStatus, setAppStatus] = useState<AppStatus>('loading');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; bio?: string }>({});

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setAppStatus('none');
        return;
      }

      const { data } = await supabase
        .from('coach_applications' as any)
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setAppStatus((data as any).status as AppStatus);
      } else {
        setAppStatus('none');
      }
    };

    if (!authLoading) checkStatus();
  }, [user, authLoading]);

  const validate = () => {
    const e: typeof errors = {};
    if (!displayName.trim()) e.displayName = 'Display name is required.';
    if (bio.trim().length < 20) e.bio = 'Please write at least a couple of sentences about yourself.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/auth', { state: { from: '/become-a-coach' } });
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('coach_applications' as any)
        .insert({
          user_id: user.id,
          display_name: displayName.trim(),
          bio: bio.trim(),
          experience: experience.trim() || null,
          status: 'pending',
        } as any);

      if (error) throw error;
      setAppStatus('pending');
      toast.success('Application submitted!');
    } catch (err: any) {
      console.error('Coach application error:', err);
      if (err?.code === '23505') {
        // unique constraint — already applied
        setAppStatus('pending');
      } else {
        const msg = err?.message || err?.error_description || JSON.stringify(err);
        toast.error(`Failed to submit: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || appStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 chamfer-sm bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-xs">b</span>
          </div>
          <span className="font-semibold text-sm">Be:More</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-14">

        {/* ── Pending state ─────────────────────────────────────────────── */}
        {appStatus === 'pending' && (
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 chamfer bg-accent/10 mb-6">
              <Clock className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-serif font-semibold mb-3">Application Under Review</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8 leading-relaxed">
              We've received your application and our team is reviewing it. We'll be in touch soon.
            </p>
            <Button variant="outline" onClick={() => navigate('/')} className="rounded-full">
              Back to Home
            </Button>
          </div>
        )}

        {/* ── Already approved ──────────────────────────────────────────── */}
        {appStatus === 'approved' && (
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 chamfer bg-accent/10 mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-serif font-semibold mb-3">You're a Coach!</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8 leading-relaxed">
              Your application has been approved. Head to your dashboard to start working with clients.
            </p>
            <Button
              onClick={() => navigate('/coach')}
              className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent btn-lift gap-2"
            >
              Go to Coach Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── Rejected ──────────────────────────────────────────────────── */}
        {appStatus === 'rejected' && (
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 chamfer bg-muted mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-semibold mb-3">Application Not Approved</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8 leading-relaxed">
              Unfortunately we weren't able to approve your application at this time. If you believe this is an error, please reach out to us.
            </p>
            <Button variant="outline" onClick={() => navigate('/')} className="rounded-full">
              Back to Home
            </Button>
          </div>
        )}

        {/* ── Application form ──────────────────────────────────────────── */}
        {appStatus === 'none' && (
          <div className="animate-fade-up">
            {/* Hero */}
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-3">
                Become a Be:More Coach
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Guide motivated professionals through their personal development journey. Build skill paths, have direct conversations, and make a real impact.
              </p>
            </div>

            {/* What coaches do */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: Users, label: 'Guide mentees', desc: 'Support clients through their Be:More journey' },
                { icon: Waypoints, label: 'Build paths', desc: 'Create personalised skill paths and tasks' },
                { icon: MessageSquare, label: 'Direct messaging', desc: 'Chat with clients inside the platform' },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border/60 rounded-2xl p-4 text-center">
                  <div className="w-9 h-9 chamfer-sm bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-1">{item.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-card space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Your name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="How mentees will see you"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">
                  About you <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Write 2–3 sentences about yourself. This is shown to mentees so they know who you are."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`min-h-[100px] resize-none ${errors.bio ? 'border-destructive' : ''}`}
                />
                {errors.bio && (
                  <p className="text-xs text-destructive">{errors.bio}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">
                  Coaching experience <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="experience"
                  placeholder="Any relevant background, certifications, or experience you'd like to share with our team..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {!user && (
                <p className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3">
                  You'll be asked to sign in or create an account before your application is submitted.
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 text-base rounded-full btn-lift bg-accent hover:bg-accent/90 text-white shadow-accent gap-2"
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Applications are reviewed by our team within 2–3 business days.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
