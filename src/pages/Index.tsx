import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, MessageSquare, Brain, Target, BarChart3, Check } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import heroImage from '@/assets/hero-gen-z.jpg';
import quoteImage from '@/assets/professional-nurse.jpg';
import collaborationImage from '@/assets/collaboration-diverse.jpg';
import builderImage from '@/assets/professional-builder.jpg';
import teacherImage from '@/assets/professional-teacher.jpg';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Start with onboarding flow (Tell me about yourself)
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="container max-w-6xl py-4 flex justify-between items-center">
          <span className="font-sans font-semibold tracking-wide text-lg">CLARITY</span>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/welcome">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Split Layout */}
      <section className="pt-16">
        <div className="grid lg:grid-cols-2 min-h-[70vh]">
          {/* Image Side */}
          <div className="relative order-1 lg:order-2 overflow-hidden">
            <img
              src={heroImage}
              alt="Professional at work"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content Side */}
          <div className="flex items-center px-6 md:px-12 lg:px-16 py-16 lg:py-24 order-2 lg:order-1 bg-amber-100">
            <ScrollReveal animation="fade-up" className="max-w-md space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl leading-tight font-serif">
                Intelligent, personalised coaching for real execution.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                AI-powered coaching combined with personality insight to craft your personalised path to success.
              </p>
              <div className="space-y-3 pt-4">
                <Button 
                  className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 rounded-full"
                  onClick={handleGetStarted}
                >
                  Start free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Free to start. No credit card required.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Statement Section - Large Typography */}
      <section className="py-20 md:py-28 px-6 bg-background">
        <div className="container max-w-5xl">
          <ScrollReveal animation="fade" className="text-center mb-8">
            <div className="flex flex-wrap justify-center items-baseline gap-x-2 gap-y-1 text-xs uppercase tracking-widest text-muted-foreground mb-6">
              <span>PLANNING</span>
              <span className="text-muted-foreground/30">·</span>
              <span>EXECUTION</span>
              <span className="text-muted-foreground/30">·</span>
              <span>DIRECTION</span>
              <span className="text-muted-foreground/30">·</span>
              <span>STRUCTURE</span>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <h2 className="text-4xl md:text-6xl lg:text-7xl text-center leading-tight mb-8">
              <span className="font-serif italic">Nothing</span>{' '}
              <span className="font-sans font-bold">meaningful</span>
              <br />
              <span className="font-sans">is built</span>{' '}
              <span className="font-serif italic">without structure.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="text-center text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              This platform exists to replace vague advice with clear thinking, practical plans, and measurable progress.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 px-6 border-t border-border">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
            {[
              {
                icon: MessageSquare,
                title: 'AI Coaching',
                description: 'Continuous, adaptive coaching that responds to your goals, decisions, and progress.',
              },
              {
                icon: Brain,
                title: 'Core Assessments',
                description: 'Personality and behavioral assessments that explain how you think, work, and execute.',
              },
              {
                icon: Target,
                title: 'Personalised Strategy',
                description: 'A structured roadmap that shows what to focus on now — and what to ignore.',
              },
              {
                icon: BarChart3,
                title: 'Execution Tracking',
                description: 'Clear milestones, accountability, and evidence of progress.',
              },
            ].map((feature, index) => (
              <ScrollReveal key={feature.title} animation="fade-up" delay={index * 100}>
                <div className="space-y-3">
                  <div className="w-10 h-10 chamfer-sm bg-secondary flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-sans font-semibold text-base">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section with Image */}
      <section className="py-16 md:py-24 px-6 bg-teal-600">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Quote */}
            <ScrollReveal animation="fade-left" className="order-2 lg:order-1">
              <blockquote className="text-2xl md:text-3xl lg:text-4xl text-white leading-snug font-serif">
                <span className="text-5xl leading-none">"</span>Most people don't fail because of ability — they fail because they{' '}
                <span className="italic">lack structure.</span>"
              </blockquote>
              <p className="mt-6 text-white/70 text-sm uppercase tracking-wider">
                Aggregated coaching and career transition data
              </p>
            </ScrollReveal>
            {/* Image */}
            <ScrollReveal animation="fade-right" className="order-1 lg:order-2">
              <img
                src={quoteImage}
                alt="Professional with tablet"
                className="w-full max-w-sm mx-auto lg:max-w-none chamfer"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className="py-20 md:py-28 px-6 bg-background">
        <div className="container max-w-5xl">
          <ScrollReveal animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-4">
              Start with clarity. Build momentum.
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Understand how you operate, then execute with intention.
            </p>
          </ScrollReveal>
          <ScrollReveal animation="scale" delay={150}>
            <div className="max-w-2xl mx-auto">
              <img
                src={collaborationImage}
                alt="Professionals collaborating"
                className="w-full chamfer"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Strategy Section - Split */}
      <section className="py-16 md:py-24 px-6 bg-secondary">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <ScrollReveal animation="fade-right">
              <img
                src={teacherImage}
                alt="Professional educator"
                className="w-full chamfer"
              />
            </ScrollReveal>
            {/* Content */}
            <ScrollReveal animation="fade-left" delay={100}>
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif leading-tight">
                  Clear direction.<br />
                  Structured execution.<br />
                  Real progress.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform combines AI coaching with evidence-based assessments to craft your personalised path to success. No generic advice. No vague promises. Just clear thinking and practical steps.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button className="rounded-full" onClick={handleGetStarted}>
                    Start free
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => {
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    See pricing
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 px-6 bg-background">
        <div className="container max-w-5xl">
          <ScrollReveal animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-4">
              Simple pricing, real value
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free and upgrade when you're ready.
            </p>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <ScrollReveal animation="fade-up" delay={100}>
              <div className="chamfer bg-card p-8 space-y-6 h-full">
                <div>
                  <h3 className="text-lg font-sans font-semibold mb-1">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif">£0</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full rounded-full"
                  onClick={handleGetStarted}
                >
                  Start with Free
                </Button>
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-4">Included:</p>
                  <ul className="space-y-3">
                    {[
                      'AI-powered suggestions',
                      'Core profile building',
                      'Basic assessments',
                      'High-level insights',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 mt-0.5 text-foreground shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            {/* Pro Tier */}
            <ScrollReveal animation="fade-up" delay={200}>
              <div className="chamfer bg-foreground text-background p-8 space-y-6 relative h-full">
                <div className="absolute top-4 right-6">
                  <span className="bg-background text-foreground text-xs px-3 py-1 rounded-full font-medium">
                    Recommended
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-sans font-semibold mb-1">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif">£49</span>
                    <span className="text-background/70 text-sm">/mo</span>
                  </div>
                </div>
                <Button 
                  className="w-full rounded-full bg-background text-foreground hover:bg-background/90"
                  onClick={() => navigate('/paywall')}
                >
                  Start with Pro
                </Button>
                <div className="pt-2">
                  <p className="text-sm text-background/70 mb-4">Everything in Free, plus:</p>
                  <ul className="space-y-3">
                    {[
                      'Full AI coaching access',
                      'Personality-led guidance',
                      '3 core assessments',
                      'Personalized career roadmap',
                      'Weekly execution guidance',
                      'Progress tracking dashboard',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 mt-0.5 text-background shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Premium Note */}
          <ScrollReveal animation="fade-up" delay={300}>
            <div className="text-center mt-12 pt-8 border-t border-border">
              <h3 className="font-sans font-semibold mb-2">Need human coaching?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Premium includes AI coaching + human coaches, complete personality profile, advanced strategy reviews, and priority support.
              </p>
              <Button variant="outline" size="sm" className="rounded-full">
                Learn about Premium — £149/mo
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-foreground text-background">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <span className="font-sans font-semibold tracking-wide text-lg block mb-4">CLARITY</span>
              <p className="text-background/70 text-sm leading-relaxed">
                A structured career coaching platform for professionals who want direction, not noise.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-sans font-semibold mb-4 text-sm uppercase tracking-wider">Links</h4>
              <ul className="space-y-2 text-background/70 text-sm">
                <li><a href="#" className="hover:text-background transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-background transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-sans font-semibold mb-4 text-sm uppercase tracking-wider">Stay updated</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="you@email.com" 
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/50"
                />
                <Button size="sm" variant="secondary" className="rounded-full">
                  Join
                </Button>
              </div>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="pt-8 border-t border-background/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-background/50">
                © 2026 Clarity. All rights reserved.
              </p>
              <div className="text-xs text-background/50 flex gap-4">
                <a href="#" className="hover:text-background/70">Terms of Service</a>
                <a href="#" className="hover:text-background/70">Privacy Policy</a>
              </div>
            </div>
          </div>
          
          {/* Large Brand Name */}
          <div className="mt-12 pt-8">
            <span className="text-6xl md:text-8xl lg:text-9xl font-sans font-bold tracking-tight text-background/10">
              CLARITY
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
