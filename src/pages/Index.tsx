import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight, Brain, Heart, Target } from 'lucide-react';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/welcome');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-serif font-semibold text-xl">MindMap</span>
        </div>
        <div>
          {user ? (
            <Link to="/welcome">
              <Button variant="outline">Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container max-w-5xl py-16 md:py-24 px-4 md:px-8">
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Discover Your True Self</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-semibold text-foreground mb-6 leading-tight">
            Understand Your <br />
            <span className="text-gradient">Personality</span> Better
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Take our comprehensive personality assessment and gain deep insights into your 
            thinking patterns, emotional intelligence, and core motivations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground hover:opacity-90 px-8 py-6 text-lg"
              onClick={handleGetStarted}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { 
              icon: Brain, 
              title: 'Science-Based', 
              description: 'Our assessment draws from established psychological frameworks to provide accurate insights.' 
            },
            { 
              icon: Heart, 
              title: 'Personalized', 
              description: 'Receive tailored recommendations based on your unique personality profile.' 
            },
            { 
              icon: Target, 
              title: 'Actionable', 
              description: 'Get practical guidance for personal growth, relationships, and career development.' 
            },
          ].map((feature, index) => (
            <Card 
              key={feature.title} 
              className="shadow-soft animate-fade-up border-border/50"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <div className="text-center animate-fade-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Answer Questions', description: 'Complete our quick assessment with thoughtful responses' },
              { step: '2', title: 'Get Your Profile', description: 'Receive your personalized personality analysis' },
              { step: '3', title: 'Take Action', description: 'Apply insights to improve your life' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full gradient-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center animate-fade-up" style={{ animationDelay: '500ms' }}>
          <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-border shadow-soft">
            <CardContent className="p-8 md:p-12">
              <h3 className="text-2xl font-serif font-semibold mb-3">
                Ready to Discover Yourself?
              </h3>
              <p className="text-muted-foreground mb-6">
                Start with our free assessment - no credit card required.
              </p>
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground hover:opacity-90"
                onClick={handleGetStarted}
              >
                Start Free Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container max-w-5xl text-center text-sm text-muted-foreground">
          <p>© 2024 MindMap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
