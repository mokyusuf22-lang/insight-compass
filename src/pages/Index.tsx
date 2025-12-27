import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Brain, Target, BarChart3, MessageSquare, Check } from 'lucide-react';
import heroImage from '@/assets/hero-professional.jpg';

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl py-4 flex justify-between items-center">
          <span className="font-serif text-2xl">MindMap</span>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/welcome">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Button onClick={handleGetStarted}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20">
        <div className="relative">
          <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
            <img
              src={heroImage}
              alt="Professional working at desk"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container max-w-6xl">
              <div className="max-w-xl space-y-6 text-background">
                <h1 className="text-3xl md:text-5xl lg:text-6xl leading-tight">
                  Structured career coaching, powered by AI and human insight.
                </h1>
                <p className="text-lg md:text-xl text-background/80">
                  A system for professionals who want clarity, direction, and measurable progress — not generic advice.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90"
                    onClick={handleGetStarted}
                  >
                    Get started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Link to="/auth">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-background/30 text-background hover:bg-background/10"
                    >
                      Sign in
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-background/60">
                  Start free. Upgrade when you're ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Statement */}
      <section className="py-24 md:py-32 bg-secondary">
        <div className="container max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-5xl lg:text-6xl leading-tight">
            Nothing meaningful is built{' '}
            <span className="font-editorial">without structure.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            We combine personality science, behavioral data, and execution planning to help professionals navigate complex career transitions with confidence.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                icon: MessageSquare,
                title: 'AI Coaching',
                description: 'Ongoing, structured AI coaching that adapts to your personality, goals, and progress.',
              },
              {
                icon: Brain,
                title: 'Core Assessments',
                description: 'Evidence-based personality and behavioral assessments that inform every recommendation.',
              },
              {
                icon: Target,
                title: 'Career Strategy',
                description: "A personalized roadmap showing what to do, when to do it, and why it works for you.",
              },
              {
                icon: BarChart3,
                title: 'Progress Tracking',
                description: 'Clear milestones, skill proof, and accountability — no vague "growth" metrics.',
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="border-border/50 shadow-soft hover:shadow-card transition-shadow duration-300"
              >
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-sans font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 md:py-32 bg-foreground text-background">
        <div className="container max-w-4xl text-center space-y-8">
          <blockquote className="text-2xl md:text-4xl lg:text-5xl leading-tight font-serif">
            "Most career advice fails because it ignores how people think, decide, and execute."
          </blockquote>
          <p className="text-sm text-background/60 uppercase tracking-wider">
            Based on aggregated career transition data and coaching outcomes
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl">
            Start with understanding how{' '}
            <span className="font-editorial">you operate.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Complete assessments, receive a strategy, and begin structured execution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={handleGetStarted}>
              Start free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline">
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 md:py-32 bg-secondary">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free and upgrade as you grow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Free */}
            <Card className="border-border/50 shadow-soft">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-sans font-semibold mb-2">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif">£0</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                  Start free
                </Button>
                <p className="text-sm text-muted-foreground">Included:</p>
                <ul className="space-y-3">
                  {[
                    'Basic AI coaching',
                    'Limited assessments',
                    'High-level insights',
                    'Strategy preview',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-foreground shadow-elevated relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-foreground text-background text-xs px-3 py-1 rounded-full font-medium">
                  Most popular
                </span>
              </div>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-sans font-semibold mb-2">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif">£49</span>
                    <span className="text-muted-foreground">/ month</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => navigate('/paywall')}>
                  Upgrade to Pro
                </Button>
                <p className="text-sm text-muted-foreground">Everything in Free, plus:</p>
                <ul className="space-y-3">
                  {[
                    'Full AI coaching',
                    '3 core assessments',
                    'Personalized career roadmap',
                    'Weekly execution guidance',
                    'Progress tracking',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-border/50 shadow-soft">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-sans font-semibold mb-2">Premium</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif">£149</span>
                    <span className="text-muted-foreground">/ month</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Join Premium
                </Button>
                <p className="text-sm text-muted-foreground">Everything in Pro, plus:</p>
                <ul className="space-y-3">
                  {[
                    'AI coaching + human coaches',
                    'Complete personality profile',
                    'Advanced strategy reviews',
                    'Direct feedback on progress',
                    'Priority support',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-4">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <span className="font-serif text-2xl block mb-4">MindMap</span>
              <p className="text-muted-foreground max-w-sm">
                A structured career coaching platform for professionals making deliberate transitions.
              </p>
            </div>
            <div>
              <h4 className="font-sans font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 MindMap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
