import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { Sparkles, Brain, Heart, Target, ArrowRight, Crown, LogOut, History } from 'lucide-react';

export default function Welcome() {
  const { user, profile, loading, signOut } = useAuth();
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
      <header className="p-4 md:p-6 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-serif font-semibold text-lg">MindMap</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/history">
            <Button variant="ghost" size="sm">
              <History className="w-4 h-4 mr-2" />
              My Results
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

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
            <Card 
              key={feature.title} 
              className="shadow-soft animate-fade-up" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground hover:opacity-90 px-8 py-6 text-lg"
            onClick={() => navigate('/assessment/free')}
          >
            Start Free Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {!hasPaid && (
            <Button
              size="lg"
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10 px-8 py-6 text-lg"
              onClick={() => navigate('/paywall')}
            >
              <Crown className="w-5 h-5 mr-2" />
              Unlock Full Assessment
            </Button>
          )}
        </div>

        {/* What's included */}
        <div className="mt-16 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-2xl font-serif font-semibold text-center mb-8">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="text-primary">Free</span> Quick Assessment
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    5 core personality questions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Basic personality overview
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Key trait highlights
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card border-secondary/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-secondary" />
                  <span className="text-secondary">Premium</span> Full Assessment
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    12 comprehensive questions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Detailed personality analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Personalized recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Lifetime access to results
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
