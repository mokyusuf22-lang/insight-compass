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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Route,
  LineChart,
  Globe,
  BotMessageSquare,
  CircleUser,
  CheckCircle,
  ChevronDown,
  RefreshCw,
  LogOut,
  Settings,
  Menu,
  X,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState<AssessmentStats>({ completed: 0, lastActive: null });

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      const { count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_complete', true);

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

  const handleLogOut = async () => {
    await signOut();
    navigate('/');
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

  const navLinks = [
    ...(showHomeLink ? [{ to: '/welcome', icon: LayoutDashboard, label: 'Home' }] : []),
    { to: '/path',    icon: Route,           label: 'Skill Path' },
    { to: '/results', icon: LineChart,        label: 'Results' },
    {
      href: 'https://www.linkedin.com/groups/your-community-group',
      icon: Globe,
      label: 'Community',
    },
    { to: '/human-coaching', icon: BotMessageSquare, label: 'Coaching' },
  ];

  return (
    <header className="p-4 md:p-5 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 chamfer-sm bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-white font-sans font-bold text-sm leading-none">b</span>
        </div>
        <span className="font-sans font-semibold tracking-wide text-base">Be:More</span>
      </div>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        {children}

        {navLinks.map((link) =>
          'href' in link ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            </a>
          ) : (
            <Link key={link.label} to={link.to}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            </Link>
          )
        )}

        {/* Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 ml-1">
              <CircleUser className="w-4 h-4" />
              <span className="hidden lg:inline max-w-[140px] truncate text-xs">
                {user.email}
              </span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Progress saved</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
            <DropdownMenuItem onClick={() => navigate('/account')} className="cursor-pointer gap-2">
              <Settings className="w-4 h-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile — hamburger */}
      <div className="flex md:hidden items-center gap-2">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 pt-8">
            <SheetHeader className="mb-6 text-left">
              <SheetTitle className="flex items-center gap-2">
                <div className="w-7 h-7 chamfer-sm bg-accent flex items-center justify-center">
                  <span className="text-white font-sans font-bold text-xs">b</span>
                </div>
                Be:More
              </SheetTitle>
            </SheetHeader>

            {/* User info */}
            <div className="mb-6 p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Nav items */}
            <nav className="space-y-1" aria-label="Main navigation">
              {navLinks.map((link) =>
                'href' in link ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <link.icon className="w-4 h-4 flex-shrink-0" />
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <link.icon className="w-4 h-4 flex-shrink-0" />
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            <div className="absolute bottom-8 left-6 right-6 space-y-1">
              <button
                onClick={() => { navigate('/account'); setMobileOpen(false); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
              <button
                onClick={handleLogOut}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
