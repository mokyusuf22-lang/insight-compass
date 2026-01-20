import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, MessageSquare, Brain, Target, BarChart3, Check, Sparkles, Users, TrendingUp, ChevronDown, Plus, Minus } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useEffect, useRef, useState } from 'react';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([false, false, false]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate('/welcome');
    } else {
      navigate('/auth');
    }
  };

  // How it Works scroll animation - steps pop up then disappear
  useEffect(() => {
    const handleScroll = () => {
      if (!howItWorksRef.current) return;
      const rect = howItWorksRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = howItWorksRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll progress through the section (0 to 1)
      const scrollProgress = Math.max(0, Math.min(1, 
        (viewportHeight - sectionTop) / (sectionHeight + viewportHeight * 0.5)
      ));
      
      // Each step appears and disappears in sequence
      const stepDuration = 0.25; // Each step takes 25% of scroll
      const newVisibleSteps = [false, false, false];
      
      for (let i = 0; i < 3; i++) {
        const stepStart = i * stepDuration;
        const stepEnd = stepStart + stepDuration * 1.5;
        newVisibleSteps[i] = scrollProgress >= stepStart && scrollProgress <= stepEnd;
      }
      
      setVisibleSteps(newVisibleSteps);
      
      // Set active step for indicators
      const step = Math.min(2, Math.floor(scrollProgress * 3));
      setActiveStep(step);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const howItWorksSteps = [
    {
      number: '01',
      title: 'Take your assessments',
      description: 'Complete our personality and behavioral assessments to understand how you think, work, and execute.',
      icon: Brain,
    },
    {
      number: '02',
      title: 'Get your personalized strategy',
      description: 'Receive a structured roadmap that shows what to focus on now — and what to ignore.',
      icon: Target,
    },
    {
      number: '03',
      title: 'Execute with AI coaching',
      description: 'Continuous, adaptive coaching that responds to your goals, decisions, and progress.',
      icon: Sparkles,
    },
  ];

  const faqItems = [
    {
      question: "What is Clarity?",
      answer: "Clarity is an AI-powered personal coaching platform that combines personality assessments with structured guidance to help you make better decisions and achieve your goals."
    },
    {
      question: "How does the AI coaching work?",
      answer: "Our AI analyzes your assessment results and goals to provide personalized, actionable guidance. It adapts to your progress and helps you stay focused on what matters most."
    },
    {
      question: "What assessments are included?",
      answer: "We include MBTI, DISC, and Strengths assessments. These help identify your working style, communication preferences, and natural talents."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. There are no long-term commitments or hidden fees."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption and never share your personal information with third parties."
    }
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/90 backdrop-blur-md">
        <div className="container max-w-6xl py-4 px-4 flex justify-between items-center">
          <span className="font-sans font-bold tracking-wide text-lg text-foreground">CLARITY</span>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/welcome">
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-primary/10 text-sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-primary/10 text-sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile First */}
      <section className="pt-20 pb-12 px-4">
        <div className="container max-w-lg mx-auto">
          <ScrollReveal animation="fade-up" className="text-center">
            <h1 className="text-3xl sm:text-4xl leading-tight font-serif mb-4">
              No stress,<br />
              <span className="text-primary">just progress.</span>
            </h1>
            
            <p className="text-base text-muted-foreground mb-6 leading-relaxed px-4">
              AI-powered personal coaching combined with personality insight to help you plan, decide, and move forward with confidence.
            </p>
            
            <div className="flex flex-col gap-3 px-4">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-full py-6 text-base shadow-lg"
                onClick={handleGetStarted}
              >
                Start free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="rounded-full w-full py-6 text-base border-primary/30 hover:bg-primary/10"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See how it works
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Free to start. No credit card required.
            </p>
          </ScrollReveal>
          
          {/* Phone mockup */}
          <div className="relative mt-8 flex justify-center">
            <div className="relative">
              <div className="w-48 h-[380px] bg-card rounded-[2rem] shadow-xl border-4 border-foreground/10 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-secondary to-card flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-primary rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="font-serif text-sm text-foreground">Your personal path to clarity</p>
                  </div>
                </div>
              </div>
              
              {/* Floating card left */}
              <div className="absolute -left-4 top-16 bg-card rounded-xl p-3 shadow-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs">Complete</p>
                    <p className="text-[10px] text-muted-foreground">MBTI: INTJ</p>
                  </div>
                </div>
              </div>
              
              {/* Floating card right */}
              <div className="absolute -right-4 top-32 bg-card rounded-xl p-3 shadow-lg animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs">Progress</p>
                    <p className="text-[10px] text-muted-foreground">85%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statement Section */}
      <section className="py-12 px-4 bg-card/50">
        <div className="container max-w-lg mx-auto">
          <ScrollReveal animation="fade" className="text-center mb-6">
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>PLANNING</span>
              <span className="text-primary">·</span>
              <span>EXECUTION</span>
              <span className="text-primary">·</span>
              <span>DIRECTION</span>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <h2 className="text-2xl sm:text-3xl text-center leading-tight mb-4">
              <span className="font-serif italic">Nothing</span>{' '}
              <span className="font-sans font-bold">meaningful</span>
              <br />
              <span className="font-sans">is built</span>{' '}
              <span className="font-serif italic text-primary">without structure.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="text-center text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              This platform exists to replace vague advice with clear thinking, practical plans, and measurable progress.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 bg-secondary">
        <div className="container max-w-lg mx-auto">
          <ScrollReveal animation="fade-up" className="text-center mb-8">
            <h2 className="text-2xl font-serif mb-2">Everything you need</h2>
            <p className="text-muted-foreground text-sm">Powerful tools for personal growth</p>
          </ScrollReveal>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: MessageSquare,
                title: 'AI Coaching',
                description: 'Adaptive coaching that responds to your goals.',
              },
              {
                icon: Brain,
                title: 'Assessments',
                description: 'Understand how you think and execute.',
              },
              {
                icon: Target,
                title: 'Strategy',
                description: 'A roadmap of what to focus on now.',
              },
              {
                icon: BarChart3,
                title: 'Tracking',
                description: 'Clear milestones and progress.',
              },
            ].map((feature, index) => (
              <ScrollReveal key={feature.title} animation="fade-up" delay={index * 100}>
                <div className="bg-card rounded-2xl p-4 h-full shadow-md border border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-sans font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pinned How It Works Section with Gradient Background */}
      <section 
        id="how-it-works" 
        ref={howItWorksRef}
        className="relative"
        style={{ minHeight: '250vh' }}
      >
        {/* Pinned gradient background */}
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Gradient background using custom gradient class */}
          <div className="absolute inset-0 how-it-works-gradient">
            {/* Floating decorative elements */}
            <div className="absolute top-20 left-8 w-3 h-3 bg-primary/40 rounded-full animate-pulse" />
            <div className="absolute top-40 right-12 w-2 h-2 bg-card/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-32 left-16 w-4 h-4 bg-card/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/3 right-8 w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="absolute bottom-48 right-20 w-3 h-3 bg-card/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-serif text-foreground mb-2">How it works</h2>
              <p className="text-foreground/60 text-sm">Three simple steps to clarity</p>
            </div>
            
            {/* Step cards that pop up and disappear */}
            <div className="relative w-full max-w-sm h-64">
              {howItWorksSteps.map((step, index) => (
                <div 
                  key={step.number}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                    visibleSteps[index] 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-primary/10 w-full">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                        <step.icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <span className="text-primary text-xs font-semibold mb-1 block">{step.number}</span>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Step indicators */}
            <div className="flex gap-2 mt-8">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    visibleSteps[i] ? 'bg-primary w-6' : 'bg-foreground/30'
                  }`}
                />
              ))}
            </div>
            
            {/* CTA */}
            <Button 
              size="lg"
              className="mt-8 bg-foreground hover:bg-foreground/90 text-background rounded-full px-8"
              onClick={handleGetStarted}
            >
              Get started now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16 px-4 bg-primary">
        <div className="container max-w-lg mx-auto">
          <ScrollReveal animation="fade-up">
            <blockquote className="text-xl sm:text-2xl text-primary-foreground leading-snug font-serif text-center">
              <span className="text-4xl leading-none">"</span>Most people don't fail because of ability — they fail because they{' '}
              <span className="italic">lack structure.</span>"
            </blockquote>
            <p className="mt-6 text-primary-foreground/70 text-xs uppercase tracking-wider text-center">
              Aggregated coaching and personal transition data
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-secondary">
        <div className="container max-w-lg mx-auto">
          <ScrollReveal animation="fade-up" className="text-center mb-8">
            <h2 className="text-2xl font-serif mb-2">
              Start with clarity. Build momentum.
            </h2>
            <p className="text-muted-foreground text-sm">
              Understand how you operate, then execute with intention.
            </p>
          </ScrollReveal>
          
          <ScrollReveal animation="scale" delay={150}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: '10k+', sublabel: 'Users' },
                { icon: Target, label: '85%', sublabel: 'Goal rate' },
                { icon: TrendingUp, label: '4.9', sublabel: 'Rating' },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-card rounded-xl p-4 shadow-md">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xl font-bold text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Strategy Section */}
      <section className="py-12 px-4 bg-card">
        <div className="container max-w-lg mx-auto">
          <ScrollReveal animation="fade-up">
            <div className="bg-gradient-to-br from-secondary to-primary/20 rounded-2xl p-6 mb-6 flex items-center justify-center aspect-square max-h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <p className="font-serif text-lg text-foreground">Your AI Coach</p>
                <p className="text-muted-foreground text-sm mt-1">Always available</p>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="space-y-4 text-center">
              <h2 className="text-xl sm:text-2xl font-serif leading-tight">
                Clear direction.<br />
                Structured execution.<br />
                <span className="text-primary">Real progress.</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our platform combines AI coaching with evidence-based assessments to give you a personalized strategy.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-full" onClick={handleGetStarted}>
                  Start free
                </Button>
                <Button variant="outline" className="rounded-full w-full border-primary/30 hover:bg-primary/10" onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  See pricing
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 px-4 bg-secondary">
        <div className="container max-w-lg mx-auto">
          <ScrollReveal animation="fade-up" className="text-center mb-8">
            <h2 className="text-2xl font-serif mb-2">
              Simple pricing, real value
            </h2>
            <p className="text-muted-foreground text-sm">
              Start free and upgrade when you're ready.
            </p>
          </ScrollReveal>
          
          <div className="space-y-4">
            {/* Free Tier */}
            <ScrollReveal animation="fade-up" delay={100}>
              <div className="bg-card rounded-2xl p-6 shadow-md border border-primary/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-sans font-semibold mb-1">Free</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-serif">£0</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-full border-primary/30 hover:bg-primary/10"
                    onClick={handleGetStarted}
                  >
                    Start free
                  </Button>
                </div>
                <ul className="space-y-2">
                  {['AI suggestions', 'Core profile', 'Basic assessments'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* Pro Tier */}
            <ScrollReveal animation="fade-up" delay={200}>
              <div className="bg-foreground text-card rounded-2xl p-6 relative shadow-xl">
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                    Popular
                  </span>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-sans font-semibold mb-1">Pro</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-serif">£49</span>
                      <span className="text-card/70 text-xs">/mo</span>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => navigate('/paywall')}
                  >
                    Get Pro
                  </Button>
                </div>
                <ul className="space-y-2">
                  {['Full AI coaching', 'All assessments', 'Personal roadmap', 'Weekly guidance'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section with Pinned Background */}
      <section className="relative bg-card">
        <div className="py-12 px-4">
          <div className="container max-w-lg mx-auto">
            <ScrollReveal animation="fade-up" className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-sm">
                Everything you need to know
              </p>
            </ScrollReveal>
            
            <div className="space-y-3">
              {faqItems.map((faq, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 50}>
                  <div className="bg-secondary rounded-xl overflow-hidden border border-primary/10">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="font-medium text-sm text-foreground pr-4">{faq.question}</span>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}>
                        {openFaq === index ? (
                          <Minus className="w-3 h-3 text-primary" />
                        ) : (
                          <Plus className="w-3 h-3 text-primary" />
                        )}
                      </div>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-40' : 'max-h-0'}`}>
                      <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-foreground text-card">
        <div className="container max-w-lg mx-auto">
          <div className="text-center mb-8">
            <span className="font-sans font-bold tracking-wide text-xl block mb-3">CLARITY</span>
            <p className="text-card/70 text-sm leading-relaxed max-w-xs mx-auto">
              A structured personal coaching platform for people who want direction, not noise.
            </p>
          </div>
          
          {/* Newsletter */}
          <div className="mb-8">
            <p className="text-sm text-center text-card/70 mb-3">Stay updated</p>
            <div className="flex gap-2">
              <Input 
                placeholder="you@email.com" 
                className="bg-card/10 border-card/20 text-card placeholder:text-card/50 rounded-full flex-1"
              />
              <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Join
              </Button>
            </div>
          </div>
          
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-card/70 mb-8">
            <a href="#how-it-works" className="hover:text-card transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-card transition-colors">Pricing</a>
            <a href="#" className="hover:text-card transition-colors">Privacy</a>
            <a href="#" className="hover:text-card transition-colors">Contact</a>
          </div>
          
          {/* Bottom */}
          <div className="pt-6 border-t border-card/20 text-center">
            <p className="text-xs text-card/50">
              © 2024 Clarity. All rights reserved.
            </p>
          </div>
          
          {/* Large Brand Name */}
          <div className="mt-8 text-center">
            <span className="text-5xl font-sans font-bold tracking-tight text-card/10">
              CLARITY
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
