import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserHeader } from '@/components/UserHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Search, 
  CheckCircle, 
  Star, 
  MessageSquare, 
  Send,
  Linkedin,
  Award,
  Briefcase,
  Clock
} from 'lucide-react';

// Coach profile data
const COACH_PROFILE = {
  name: "Sarah Mitchell",
  title: "Executive Career Coach",
  specialties: ["Career Transitions", "Leadership Development", "Personal Branding"],
  experience: "15+ years",
  matchScore: 94,
  bio: "I help ambitious professionals unlock their full potential and navigate complex career transitions. With 15+ years of experience coaching executives at Fortune 500 companies, I specialize in helping people like you turn their unique strengths into career success.",
  credentials: ["ICF Certified Coach (PCC)", "Former VP at McKinsey", "MBA, Harvard Business School"],
  linkedinUrl: "https://www.linkedin.com/in/sarah-mitchell-coach",
  availability: "Next available: Tomorrow at 2pm",
  imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face"
};

const LOADING_MESSAGES = [
  "Analyzing your assessment results...",
  "Matching your personality profile...",
  "Finding coaches with relevant expertise...",
  "Evaluating compatibility scores...",
  "Selecting your ideal coach match..."
];

export default function HumanCoaching() {
  const { user, profile, loading, subscription } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has already seen the loading animation
  const hasSeenLoading = localStorage.getItem('coach_matched') === 'true';
  
  const [stage, setStage] = useState<'loading' | 'matched' | 'messaging'>(hasSeenLoading ? 'matched' : 'loading');
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Loading animation
  useEffect(() => {
    if (stage !== 'loading') return;

    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = LOADING_MESSAGES.indexOf(prev);
        return LOADING_MESSAGES[(currentIndex + 1) % LOADING_MESSAGES.length];
      });
    }, 1200);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(messageInterval);
          localStorage.setItem('coach_matched', 'true');
          setTimeout(() => setStage('matched'), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [stage]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Please write a message');
      return;
    }
    
    // In a real app, this would send to the coach
    setMessageSent(true);
    toast.success('Message sent! Sarah will respond within 24 hours.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container max-w-3xl py-8 px-4 md:px-8">
        {/* Loading Stage */}
        {stage === 'loading' && (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-muted animate-pulse" />
              <Search className="absolute w-10 h-10 text-primary animate-bounce" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
              Finding Your Perfect Coach
            </h1>
            
            <p className="text-muted-foreground mb-8 animate-pulse">
              {loadingMessage}
            </p>

            <div className="max-w-md mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{loadingProgress}%</p>
            </div>
          </div>
        )}

        {/* Matched Stage */}
        {stage === 'matched' && !messageSent && (
          <div className="animate-fade-up">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
                Great Match Found!
              </h1>
              <p className="text-muted-foreground">
                Based on your personality profile and career goals
              </p>
            </div>

            {/* Coach Card */}
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                {/* Match Score Banner */}
                <div className="bg-primary/10 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <span className="font-medium text-primary">
                      {COACH_PROFILE.matchScore}% Match Score
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-background">
                    Top Recommendation
                  </Badge>
                </div>

                <div className="p-6">
                  {/* Coach Info */}
                  <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <img 
                      src={COACH_PROFILE.imageUrl}
                      alt={COACH_PROFILE.name}
                      className="w-24 h-24 rounded-xl object-cover mx-auto sm:mx-0"
                    />
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl font-serif font-bold text-foreground mb-1">
                        {COACH_PROFILE.name}
                      </h2>
                      <p className="text-muted-foreground mb-3">{COACH_PROFILE.title}</p>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {COACH_PROFILE.specialties.map((specialty, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {COACH_PROFILE.bio}
                  </p>

                  {/* Credentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>{COACH_PROFILE.experience} experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span>ICF Certified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Available tomorrow</span>
                    </div>
                  </div>

                  {/* Credentials List */}
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium mb-2">Credentials</h3>
                    <ul className="space-y-1">
                      {COACH_PROFILE.credentials.map((cred, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-primary" />
                          {cred}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      className="flex-1 gradient-primary text-primary-foreground"
                      onClick={() => setStage('messaging')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <a 
                      href={COACH_PROFILE.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Linkedin className="w-4 h-4 mr-2" />
                        View LinkedIn
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium CTA for free users */}
            {subscription.tier === 'free' && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to Pro or Premium for priority coach matching and unlimited sessions
                  </p>
                  <Button variant="outline" onClick={() => navigate('/paywall')}>
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Messaging Stage */}
        {stage === 'messaging' && !messageSent && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
                Message {COACH_PROFILE.name}
              </h1>
              <p className="text-muted-foreground">
                Introduce yourself and share your goals
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <img 
                    src={COACH_PROFILE.imageUrl}
                    alt={COACH_PROFILE.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{COACH_PROFILE.name}</h3>
                    <p className="text-sm text-muted-foreground">{COACH_PROFILE.title}</p>
                  </div>
                </div>

                <Textarea
                  placeholder="Hi Sarah, I came across your profile and I'd love to discuss my career transition goals..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[200px] mb-4"
                />

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStage('matched')}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 gradient-primary text-primary-foreground"
                    onClick={handleSendMessage}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message Sent Confirmation */}
        {messageSent && (
          <div className="text-center py-20 animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
              Message Sent!
            </h1>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {COACH_PROFILE.name} will respond to your message within 24 hours. 
              You'll receive a notification when she replies.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/welcome')}>
                Back to Dashboard
              </Button>
              <a 
                href={COACH_PROFILE.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Connect on LinkedIn
                </Button>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
