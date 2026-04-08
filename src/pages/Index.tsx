import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  BotMessageSquare,
  ScanFace,
  Waypoints,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import heroImage from '@/assets/hero-gen-z.jpg';
import quoteImage from '@/assets/professional-nurse.jpg';
import builderImage from '@/assets/professional-builder.jpg';
import teacherImage from '@/assets/professional-teacher.jpg';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/aura/welcome');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 chamfer-sm bg-accent flex items-center justify-center">
              <span className="text-white font-sans font-bold text-xs">b</span>
            </div>
            <span className="font-sans font-semibold tracking-wide text-base">Be:More</span>
          </div>
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

      {/* Hero — split layout */}
      <section className="pt-16">
        <div className="grid lg:grid-cols-2 min-h-[70vh]">
          {/* Image */}
          <div className="relative order-1 lg:order-2 overflow-hidden">
            <img
              src={heroImage}
              alt="Professional at work"
              className="w-full h-full object-cover"
              fetchPriority="high"
            />
          </div>
          {/* Content */}
          <div className="flex items-center px-6 md:px-12 lg:px-16 py-16 lg:py-24 order-2 lg:order-1 bg-secondary section-dots">
            <ScrollReveal animation="fade-up" className="max-w-md space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium text-accent tracking-wide uppercase">AI Career Coaching</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl leading-tight font-serif">
                Intelligent, personalised coaching for real execution.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                AI-powered coaching combined with personality insight to craft your personalised path to success.
              </p>
              <div className="space-y-3 pt-2">
                <Button
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white rounded-full shadow-accent btn-lift gap-2"
                  onClick={handleGetStarted}
                >
                  Start free
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Free to start. No credit card required.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="py-20 md:py-28 px-6 bg-background">
        <div className="container max-w-5xl">
          <ScrollReveal animation="fade" className="text-center mb-8">
            <div className="flex flex-wrap justify-center items-baseline gap-x-2 gap-y-1 text-xs uppercase tracking-widest text-muted-foreground mb-6">
              <span>PLANNING</span>
              <span className="text-accent">·</span>
              <span>EXECUTION</span>
              <span className="text-accent">·</span>
              <span>DIRECTION</span>
              <span className="text-accent">·</span>
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

      {/* Features */}
      <section className="py-16 md:py-24 px-6 border-t border-border section-dots">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
            {[
              {
                icon: BotMessageSquare,
                title: 'AI Coaching',
                description: 'Continuous, adaptive coaching that responds to your goals, decisions, and progress.',
                color: 'bg-accent/10 text-accent',
              },
              {
                icon: ScanFace,
                title: 'Core Assessments',
                description: 'Personality and behavioral assessments that explain how you think, work, and execute.',
                color: 'bg-pop/10 text-pop',
              },
              {
                icon: Waypoints,
                title: 'Personalised Strategy',
                description: 'A structured roadmap that shows what to focus on now — and what to ignore.',
                color: 'bg-accent/10 text-accent',
              },
              {
                icon: TrendingUp,
                title: 'Execution Tracking',
                description: 'Clear milestones, accountability, and evidence of progress.',
                color: 'bg-pop/10 text-pop',
              },
            ].map((feature, index) => (
              <ScrollReveal key={feature.title} animation="fade-up" delay={index * 100}>
                <div className="space-y-4">
                  <div className={`w-11 h-11 chamfer-sm flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-sans font-semibold text-base">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quote section */}
      <section className="py-16 md:py-24 px-6 bg-foreground">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-left" className="order-2 lg:order-1">
              <blockquote className="text-2xl md:text-3xl lg:text-4xl text-background leading-snug font-serif">
                <span className="text-5xl leading-none text-accent">"</span>Most people don't fail because of ability — they fail because they{' '}
                <span className="italic">lack structure.</span>"
              </blockquote>
              <p className="mt-6 text-background/60 text-sm uppercase tracking-wider">
                Aggregated coaching and career transition data
              </p>
            </ScrollReveal>
            <ScrollReveal animation="fade-right" className="order-1 lg:order-2">
              <img
                src={quoteImage}
                alt="Professional with tablet"
                className="w-full max-w-sm mx-auto lg:max-w-none chamfer"
                loading="lazy"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How it works */}
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
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                step: '01',
                title: 'Discover',
                description: 'Meet Aura, your AI coach. Share your challenge and uncover your unique profile through guided assessments.',
                accent: 'border-accent/40',
              },
              {
                step: '02',
                title: 'Plan',
                description: 'Receive a personalised strategy and structured roadmap built around your strengths, values, and goals.',
                accent: 'border-pop/40',
              },
              {
                step: '03',
                title: 'Execute',
                description: 'Follow weekly action plans, track milestones, and get adaptive coaching as you make real progress.',
                accent: 'border-accent/40',
              },
            ].map((item, index) => (
              <ScrollReveal key={item.step} animation="fade-up" delay={100 + index * 150}>
                <div className={`chamfer bg-card border-2 ${item.accent} p-6 space-y-3 h-full`}>
                  <span className="text-3xl font-serif text-accent/50">{item.step}</span>
                  <h3 className="font-sans font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy split */}
      <section className="py-16 md:py-24 px-6 bg-secondary section-dots">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <img
                src={teacherImage}
                alt="Professional educator"
                className="w-full chamfer"
                loading="lazy"
              />
            </ScrollReveal>
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
                  <Button
                    className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent btn-lift"
                    onClick={handleGetStarted}
                  >
                    Start free
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-6 bg-background text-center">
        <div className="container max-w-3xl">
          <ScrollReveal animation="fade-up">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-4">Ready to start?</h2>
            <p className="text-muted-foreground text-lg mb-8">Begin your journey with a free AI coaching session.</p>
            <Button
              className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-accent btn-lift gap-2"
              size="lg"
              onClick={handleGetStarted}
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-foreground text-background">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 chamfer-sm bg-accent flex items-center justify-center">
                  <span className="text-white font-sans font-bold text-xs">b</span>
                </div>
                <span className="font-sans font-semibold tracking-wide text-base">Be:More</span>
              </div>
              <p className="text-background/60 text-sm leading-relaxed">
                A structured career coaching platform for professionals who want direction, not noise.
              </p>
            </div>

            <div>
              <h4 className="font-sans font-semibold mb-4 text-sm uppercase tracking-wider">Links</h4>
              <ul className="space-y-2 text-background/60 text-sm">
                <li><a href="#" className="hover:text-background transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-sans font-semibold mb-4 text-sm uppercase tracking-wider">Stay updated</h4>
              <Label htmlFor="newsletter-email" className="sr-only">Email address</Label>
              <div className="flex gap-2">
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="you@email.com"
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                />
                <Button size="sm" variant="secondary" className="rounded-full shrink-0">
                  Join
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-background/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-background/40">© 2026 Be:More. All rights reserved.</p>
              <div className="text-xs text-background/40 flex gap-4">
                <a href="#" className="hover:text-background/60">Terms of Service</a>
                <a href="#" className="hover:text-background/60">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8">
            <span className="text-6xl md:text-8xl lg:text-9xl font-sans font-bold tracking-tight text-background/8">
              Be:More
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
