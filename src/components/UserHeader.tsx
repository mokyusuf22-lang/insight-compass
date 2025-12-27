import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Sparkles, 
  User, 
  CheckCircle, 
  ChevronDown,
  History,
  RefreshCw,
  LogOut,
  Home,
  Settings,
  Crown,
  Users,
  MessageCircle,
  Briefcase
} from 'lucide-react';

interface UserHeaderProps {
  showHomeLink?: boolean;
  children?: React.ReactNode;
}

interface AssessmentStats {
  completed: number;
  lastActive: string | null;
}

export function UserHeader({ showHomeLink = true, children }: UserHeaderProps) {
  const { user, signOut, subscription } = useAuth();
  const navigate = useNavigate();
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [stats, setStats] = useState<AssessmentStats>({ completed: 0, lastActive: null });

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      // Get completed assessments count
      const { count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_complete', true);

      // Get last activity from step1_assessments
      const { data: step1 } = await supabase
        .from('step1_assessments')
        .select('updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        completed: count || 0,
        lastActive: step1?.updated_at || null,
      });
    };

    loadStats();
  }, [user]);

  const handleSwitchAccount = async () => {
    await signOut();
    setShowSwitchDialog(false);
    navigate('/auth');
  };

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <>
      <header className="p-4 md:p-6 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-serif font-semibold text-lg">MindMap</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Custom children (additional nav items) */}
          {children}

          {showHomeLink && (
            <Link to="/welcome">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          )}

          <Link to="/path">
            <Button variant="ghost" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Skill Path
            </Button>
          </Link>

          <Link to="/results">
            <Button variant="ghost" size="sm">
              <History className="w-4 h-4 mr-2" />
              Results
            </Button>
          </Link>

          <a 
            href="https://www.linkedin.com/groups/your-community-group" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Community
            </Button>
          </a>

          <Link to="/human-coaching">
            <Button variant="ghost" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Coaching
            </Button>
          </Link>

          <Link to="/interview-prep">
            <Button variant="ghost" size="sm">
              <Briefcase className="w-4 h-4 mr-2" />
              Interview
            </Button>
          </Link>

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[150px] truncate">
                  {user.email}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Progress saved</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Assessments completed:</span>
                  <span className="font-medium text-foreground">{stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last active:</span>
                  <span className="font-medium text-foreground">{formatLastActive(stats.lastActive)}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              {subscription.tier !== 'free' && (
                <div className="px-2 py-1.5 flex items-center gap-2 text-xs">
                  <Crown className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">{subscription.tierName} Plan</span>
                </div>
              )}
              <DropdownMenuItem 
                onClick={() => navigate('/account')}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowSwitchDialog(true)}
                className="cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Switch account
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowSwitchDialog(true)}
                className="cursor-pointer text-muted-foreground text-xs"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Switch Account Confirmation Dialog */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Account?</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>You're currently signed in as:</p>
              <p className="font-medium text-foreground bg-muted px-3 py-2 rounded-md">
                {user.email}
              </p>
              <p>Switching accounts will sign you out. Your progress is saved and will be here when you return.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSwitchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSwitchAccount}>
              Switch Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
