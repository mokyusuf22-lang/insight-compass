import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, MessageSquare, Brain, Target, BarChart3, Check, Sparkles, Users, TrendingUp } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useEffect, useRef, useState } from 'react';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const stickyRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate('/welcome');
    } else {
      navigate('/auth');
    }
  };

  // Sticky section scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!stickyRef.current) return;
      const rect = stickyRef.current.getBoundingClientRect();
      const sectionHeight = stickyRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // Calculate progress through the sticky section
      const scrollProgress = Math.max(0, Math.min(1, 
        (viewportHeight - rect.top) / (sectionHeight + viewportHeight)
      ));
      
      // Map progress to steps (0-2)
      const step = Math.min(2, Math.floor(scrollProgress * 3));
      setActiveStep(step);
    };

    window.addEventListener('scroll', handleScroll);
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

  return (
    <div className="min-h-screen bg-[#FFE8D6]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFE8D6]/90 backdrop-blur-md border-b border-[#CB997E]/20">
        <div className="container max-w-6xl py-4 flex justify-between items-center">
          <span className="font-sans font-bold tracking-wide text-xl text-foreground">CLARITY</span>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/welcome">
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-[#CB997E]/10">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-[#CB997E]/10">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6">
        <div className="container max-w-5xl">
          <ScrollReveal animation="fade-up" className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-[#CB997E]/20">
              <Sparkles className="w-4 h-4 text-[#CB997E]" />
              <span className="text-sm font-medium text-foreground">AI-Powered Personal Coaching</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl leading-tight font-serif mb-6">
              No stress,<br />
              <span className="text-[#CB997E]">just progress.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              AI-powered coaching combined with personality insight to help you plan, decide, and move forward with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-[#CB997E] hover:bg-[#B88B70] text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-[#CB997E]/25"
                onClick={handleGetStarted}
              >
                Start free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="rounded-full px-8 py-6 text-lg border-[#CB997E]/30 hover:bg-[#CB997E]/10"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See how it works
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Free to start. No credit card required.
            </p>
          </ScrollReveal>
          
          {/* Floating elements decoration */}
          <div className="relative mt-16 flex justify-center">
            <div className="relative">
              {/* Phone mockup placeholder */}
              <div className="w-64 h-[500px] bg-white rounded-[2.5rem] shadow-2xl shadow-[#CB997E]/20 border-8 border-foreground/10 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-[#FFE8D6] to-white flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-[#CB997E] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-serif text-lg text-foreground">Your personal path to clarity</p>
                  </div>
                </div>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -left-24 top-20 bg-white rounded-2xl p-4 shadow-xl shadow-[#CB997E]/15 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Assessment Complete</p>
                    <p className="text-xs text-muted-foreground">MBTI: INTJ</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-20 top-40 bg-white rounded-2xl p-4 shadow-xl shadow-[#CB997E]/15 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#CB997E]/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#CB997E]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Weekly Goal</p>
                    <p className="text-xs text-muted-foreground">85% progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statement Section */}
      <section className="py-20 md:py-28 px-6 bg-white/50">
        <div className="container max-w-5xl">
          <ScrollReveal animation="fade" className="text-center mb-8">
            <div className="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-muted-foreground mb-8">
              <span>PLANNING</span>
              <span className="text-[#CB997E]">·</span>
              <span>EXECUTION</span>
              <span className="text-[#CB997E]">·</span>
              <span>DIRECTION</span>
              <span className="text-[#CB997E]">·</span>
              <span>STRUCTURE</span>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <h2 className="text-4xl md:text-6xl lg:text-7xl text-center leading-tight mb-8">
              <span className="font-serif italic">Nothing</span>{' '}
              <span className="font-sans font-bold">meaningful</span>
              <br />
              <span className="font-sans">is built</span>{' '}
              <span className="font-serif italic text-[#CB997E]">without structure.</span>
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
      <section className="py-16 md:py-24 px-6 bg-[#FFE8D6]">
        <div className="container max-w-5xl">
          <ScrollReveal animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">Everything you need</h2>
            <p className="text-muted-foreground text-lg">Powerful tools for personal growth</p>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                title: 'Personal Strategy',
                description: 'A structured roadmap that shows what to focus on now — and what to ignore.',
              },
              {
                icon: BarChart3,
                title: 'Execution Tracking',
                description: 'Clear milestones, accountability, and evidence of progress.',
              },
            ].map((feature, index) => (
              <ScrollReveal key={feature.title} animation="fade-up" delay={index * 100}>
                <div className="bg-white rounded-2xl p-6 h-full shadow-lg shadow-[#CB997E]/10 border border-[#CB997E]/10 hover:shadow-xl hover:shadow-[#CB997E]/15 transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-[#CB997E]/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-[#CB997E]" />
                  </div>
                  <h3 className="font-sans font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky How It Works Section */}
      <section 
        id="how-it-works" 
        ref={stickyRef}
        className="relative bg-foreground text-white"
        style={{ minHeight: '300vh' }}
      >
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="container max-w-6xl px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-serif mb-4">How it works</h2>
              <p className="text-white/60 text-lg">Three simple steps to clarity</p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Steps */}
              <div className="space-y-8">
                {howItWorksSteps.map((step, index) => (
                  <div 
                    key={step.number}
                    className={`flex gap-6 transition-all duration-500 ${
                      activeStep === index 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-30 translate-x-4'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                      activeStep === index ? 'bg-[#CB997E]' : 'bg-white/10'
                    }`}>
                      <step.icon className={`w-8 h-8 ${activeStep === index ? 'text-white' : 'text-white/50'}`} />
                    </div>
                    <div>
                      <span className="text-[#CB997E] text-sm font-semibold mb-1 block">{step.number}</span>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-white/60 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Visual */}
              <div className="relative flex justify-center">
                <div className="w-72 h-[450px] bg-white/10 rounded-[2.5rem] backdrop-blur-sm border border-white/20 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-all duration-500 ${
                        activeStep === 0 ? 'bg-[#CB997E]' : activeStep === 1 ? 'bg-white/20' : 'bg-[#CB997E]'
                      }`}>
                        {activeStep === 0 && <Brain className="w-10 h-10 text-white" />}
                        {activeStep === 1 && <Target className="w-10 h-10 text-white" />}
                        {activeStep === 2 && <Sparkles className="w-10 h-10 text-white" />}
                      </div>
                      <h4 className="text-xl font-serif mb-2">{howItWorksSteps[activeStep].title}</h4>
                      <div className="flex justify-center gap-2 mt-6">
                        {[0, 1, 2].map((i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                              i === activeStep ? 'bg-[#CB997E]' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i}
                      className={`w-1 h-12 rounded-full transition-all duration-300 ${
                        i <= activeStep ? 'bg-[#CB997E]' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Button 
                size="lg"
                className="bg-[#CB997E] hover:bg-[#B88B70] text-white rounded-full px-8"
                onClick={handleGetStarted}
              >
                Get started now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 md:py-28 px-6 bg-[#CB997E]">
        <div className="container max-w-4xl">
          <ScrollReveal animation="fade-up">
            <blockquote className="text-2xl md:text-4xl lg:text-5xl text-white leading-snug font-serif text-center">
              <span className="text-6xl leading-none">"</span>Most people don't fail because of ability — they fail because they{' '}
              <span className="italic">lack structure.</span>"
            </blockquote>
            <p className="mt-8 text-white/70 text-sm uppercase tracking-wider text-center">
              Aggregated coaching and personal transition data
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className="py-20 md:py-28 px-6 bg-[#FFE8D6]">
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
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { icon: Users, label: '10,000+', sublabel: 'Users coached' },
                { icon: Target, label: '85%', sublabel: 'Goal completion rate' },
                { icon: TrendingUp, label: '4.9/5', sublabel: 'User satisfaction' },
              ].map((stat, index) => (
                <div key={stat.label} className="text-center bg-white rounded-2xl p-6 shadow-lg shadow-[#CB997E]/10">
                  <stat.icon className="w-8 h-8 text-[#CB997E] mx-auto mb-3" />
                  <p className="text-3xl font-bold text-foreground">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Strategy Section */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal animation="fade-right">
              <div className="bg-gradient-to-br from-[#FFE8D6] to-[#CB997E]/20 rounded-3xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-[#CB997E] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-[#CB997E]/30">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <p className="font-serif text-2xl text-foreground">Your AI Coach</p>
                  <p className="text-muted-foreground mt-2">Always available, always personalized</p>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-left" delay={100}>
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif leading-tight">
                  Clear direction.<br />
                  Structured execution.<br />
                  <span className="text-[#CB997E]">Real progress.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform combines AI coaching with evidence-based assessments to give you a personalized strategy. No generic advice. No vague promises. Just clear thinking and practical steps.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button className="bg-[#CB997E] hover:bg-[#B88B70] text-white rounded-full" onClick={handleGetStarted}>
                    Start free
                  </Button>
                  <Button variant="outline" className="rounded-full border-[#CB997E]/30 hover:bg-[#CB997E]/10" onClick={() => {
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
      <section id="pricing" className="py-20 md:py-28 px-6 bg-[#FFE8D6]">
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
              <div className="bg-white rounded-3xl p-8 space-y-6 h-full shadow-lg shadow-[#CB997E]/10 border border-[#CB997E]/10">
                <div>
                  <h3 className="text-lg font-sans font-semibold mb-1">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif">£0</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full rounded-full border-[#CB997E]/30 hover:bg-[#CB997E]/10"
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
                        <Check className="w-4 h-4 mt-0.5 text-[#CB997E] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            {/* Pro Tier */}
            <ScrollReveal animation="fade-up" delay={200}>
              <div className="bg-foreground text-white rounded-3xl p-8 space-y-6 relative h-full shadow-2xl">
                <div className="absolute top-4 right-6">
                  <span className="bg-[#CB997E] text-white text-xs px-3 py-1 rounded-full font-medium">
                    Recommended
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-sans font-semibold mb-1">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif">£49</span>
                    <span className="text-white/70 text-sm">/mo</span>
                  </div>
                </div>
                <Button 
                  className="w-full rounded-full bg-[#CB997E] hover:bg-[#B88B70] text-white"
                  onClick={() => navigate('/paywall')}
                >
                  Start with Pro
                </Button>
                <div className="pt-2">
                  <p className="text-sm text-white/70 mb-4">Everything in Free, plus:</p>
                  <ul className="space-y-3">
                    {[
                      'Full AI coaching access',
                      'Personality-led guidance',
                      '3 core assessments',
                      'Personalized roadmap',
                      'Weekly execution guidance',
                      'Progress tracking dashboard',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 mt-0.5 text-[#CB997E] shrink-0" />
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
            <div className="text-center mt-12 pt-8 border-t border-[#CB997E]/20">
              <h3 className="font-sans font-semibold mb-2">Need human coaching?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Premium includes AI coaching + human coaches, complete personality profile, advanced strategy reviews, and priority support.
              </p>
              <Button variant="outline" size="sm" className="rounded-full border-[#CB997E]/30 hover:bg-[#CB997E]/10">
                Learn about Premium — £149/mo
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground/10 py-16 px-6 bg-foreground text-white">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <span className="font-sans font-bold tracking-wide text-xl block mb-4">CLARITY</span>
              <p className="text-white/70 text-sm leading-relaxed">
                A structured personal coaching platform for people who want direction, not noise.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-sans font-semibold mb-4 text-sm uppercase tracking-wider">Links</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-sans font-semibold mb-4 text-sm uppercase tracking-wider">Stay updated</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="you@email.com" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full"
                />
                <Button size="sm" className="rounded-full bg-[#CB997E] hover:bg-[#B88B70]">
                  Join
                </Button>
              </div>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/50">
                © 2024 Clarity. All rights reserved.
              </p>
              <div className="text-xs text-white/50 flex gap-4">
                <a href="#" className="hover:text-white/70">Terms of Service</a>
                <a href="#" className="hover:text-white/70">Privacy Policy</a>
              </div>
            </div>
          </div>
          
          {/* Large Brand Name */}
          <div className="mt-12 pt-8">
            <span className="text-6xl md:text-8xl lg:text-9xl font-sans font-bold tracking-tight text-white/10">
              CLARITY
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}