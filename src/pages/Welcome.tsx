import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { UserHeader } from '@/components/UserHeader';
import { Brain, Heart, Target, ArrowRight, Crown } from 'lucide-react';

export default function Welcome() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading your profile..." />
      </div>
    );
  }

  const hasPaid = profile?.has_paid;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <UserHeader showHomeLink={false} />

      {/* Main content */}
      <main className="container max-w-4xl py-12 px-4 md:px-8">
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-4">
            Discover Your <span className="text-gradient">Personality</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gain deep insights into your thinking patterns, emotional intelligence, and core motivations through our comprehensive personality assessment.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Brain, title: 'Self-Awareness', description: 'Understand how you think and process information' },
            { icon: Heart, title: 'Emotional Insights', description: 'Discover your emotional patterns and strengths' },
            { icon: Target, title: 'Actionable Guidance', description: 'Get personalized recommendations for growth' },
          ].map((feature, index) => (
            <div 
              key={feature.title} 
              className="chamfer bg-card p-6 text-center animate-fade-up" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 chamfer-sm bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground hover:opacity-90 px-8 py-6 text-lg rounded-full"
            onClick={() => navigate('/assessment/step1')}
          >
            Start Free Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {hasPaid ? (
            <Button
              size="lg"
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10 px-8 py-6 text-lg rounded-full"
              onClick={() => navigate('/assessment/mbti')}
            >
              <Crown className="w-5 h-5 mr-2" />
              Take MBTI Assessment
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10 px-8 py-6 text-lg rounded-full"
              onClick={() => navigate('/paywall')}
            >
              <Crown className="w-5 h-5 mr-2" />
              Unlock Premium Assessments
            </Button>
          )}
        </div>

        {/* What's included */}
        <div className="mt-16 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-2xl font-serif font-semibold text-center mb-8">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="chamfer bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-primary">Free</span> Quick Assessment
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary chamfer-sm" />
                  5 core personality questions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary chamfer-sm" />
                  Basic personality overview
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary chamfer-sm" />
                  Key trait highlights
                </li>
              </ul>
            </div>

            <div className="chamfer bg-secondary p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-foreground" />
                <span className="text-foreground">Premium</span> MBTI Assessment
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-foreground chamfer-sm" />
                  93 research-backed questions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-foreground chamfer-sm" />
                  4-axis personality analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-foreground chamfer-sm" />
                  Confidence scoring per dimension
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-foreground chamfer-sm" />
                  Inconsistency detection for accuracy
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-foreground chamfer-sm" />
                  Lifetime access to results
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
