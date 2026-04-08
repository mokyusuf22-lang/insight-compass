import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, User, Mail, Phone } from 'lucide-react';
import { AuraProgressBar } from '@/components/aura/AuraProgressBar';
import { AuraOrb } from '@/components/aura/AuraOrb';

const TYPING_SPEED = 30;

function useTypingEffect(text: string, start: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, TYPING_SPEED);
    return () => clearInterval(interval);
  }, [text, start]);

  return { displayed, done };
}

export default function AuraWelcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const greeting = "Welcome to your journey of growth! I'm Aura, your personal coaching guide. To get started, please share a few details about yourself.";
  const { displayed: typedGreeting, done: greetingDone } = useTypingEffect(greeting, true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    // Restore existing session
    if (user) {
      supabase
        .from('aura_sessions')
        .select('id, name, email, preferred_contact, current_step')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.name) setName(data.name);
            if (data.email) setEmail(data.email);
            if (data.preferred_contact) setPreferredContact(data.preferred_contact);
            if ((data.current_step ?? 0) >= 2) {
              navigate('/aura/challenge');
            }
          }
        });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (greetingDone) {
      const timer = setTimeout(() => setShowForm(true), 300);
      return () => clearTimeout(timer);
    }
  }, [greetingDone]);

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const isValid = name.trim().length >= 2 && email.trim().includes('@');

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setIsSubmitting(true);

    try {
      // Check for existing session
      const { data: existing } = await supabase
        .from('aura_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from('aura_sessions')
          .update({
            name: name.trim(),
            email: email.trim(),
            preferred_contact: preferredContact || null,
            current_step: 2,
          } as any)
          .eq('id', existing.id);
      } else {
        // Create new
        await supabase
          .from('aura_sessions')
          .insert({
            user_id: user.id,
            name: name.trim(),
            email: email.trim(),
            preferred_contact: preferredContact || null,
            current_step: 2,
          } as any);
      }

      navigate('/aura/challenge');
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8 bg-gradient-to-b from-secondary/50 via-background to-background">
      <div className="w-full max-w-xl">
        <AuraProgressBar currentStep={1} className="mb-10" />

        {/* Aura Avatar */}
        <div className="flex items-center gap-4 mb-7">
          <AuraOrb size="sm" interactive />
          <div>
            <p className="text-sm font-semibold text-foreground leading-none mb-1">Aura</p>
            <p className="text-xs text-muted-foreground">Your coaching guide</p>
          </div>
        </div>

        {/* Chat bubble */}
        <div className="bg-secondary/25 border border-border/60 rounded-2xl rounded-tl-sm p-6 mb-8 shadow-card">
          <p className="text-foreground text-lg leading-relaxed font-serif">
            {typedGreeting}
            {!greetingDone && <span className="inline-block w-0.5 h-5 bg-accent animate-pulse ml-0.5 align-text-bottom" />}
          </p>
        </div>

        {/* Form — slides in after typing completes */}
        <div
          className={`transition-all duration-500 ${
            showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="bg-card border border-border/70 rounded-2xl p-6 space-y-5 shadow-elevated">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-muted-foreground" />
                Your name
              </Label>
              <Input
                id="name"
                placeholder="What should I call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Preferred contact method
                <span className="text-muted-foreground/50 text-xs font-normal">(optional)</span>
              </Label>
              <Select value={preferredContact} onValueChange={setPreferredContact}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="How would you like to be contacted?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone call</SelectItem>
                  <SelectItem value="video">Video call</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="w-full h-12 text-base rounded-full btn-lift"
              size="lg"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
