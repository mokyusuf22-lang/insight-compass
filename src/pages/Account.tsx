import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { useToast } from '@/hooks/use-toast';
import {
  CircleUser,
  ShieldCheck,
  UserMinus,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Account() {
  const { user, loading, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.user_metadata?.display_name) setDisplayName(user.user_metadata.display_name);
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
      if (error) throw error;
      toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Make sure both passwords are the same.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      toast({ title: 'Password Updated', description: 'Your password has been changed.' });
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({ title: 'Error', description: 'Failed to update password.', variant: 'destructive' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      await signOut();
      navigate('/');
      toast({ title: 'Account Deactivated', description: 'Sign in anytime to reactivate.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to deactivate account.', variant: 'destructive' });
    } finally {
      setIsDeactivating(false);
      setShowDeactivateDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="container max-w-4xl flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-serif">Account Settings</h1>
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4 md:px-8 space-y-6">

        {/* ── Profile ─────────────────────────────────────── */}
        <section className="chamfer bg-card border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 chamfer-sm gradient-coral flex items-center justify-center flex-shrink-0">
              <CircleUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">Your name and contact details</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user?.email || ''} disabled className="max-w-md bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="mt-2">
              {isSavingProfile ? <LoadingSpinner size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        </section>

        {/* ── Security ────────────────────────────────────── */}
        <section className="chamfer bg-card border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 chamfer-sm bg-pop/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-pop" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">Manage your password and account access</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 chamfer-sm bg-secondary/50">
            <div>
              <p className="font-medium text-sm">Password</p>
              <p className="text-sm text-muted-foreground">Keep your account secure with a strong password</p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              Update Password
            </Button>
          </div>
        </section>

        {/* ── Danger Zone ─────────────────────────────────── */}
        <section className="chamfer bg-destructive/3 border-2 border-destructive/25 p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 chamfer-sm bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <UserMinus className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Irreversible account actions</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Deactivating your account will pause your Skill Path and coaching access. Your data is retained and you can reactivate anytime by signing in again.
          </p>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeactivateDialog(true)}
          >
            Deactivate Account
          </Button>
        </section>
      </main>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>Enter your new password. Minimum 8 characters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showNewPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !newPassword || newPassword !== confirmPassword}>
              {isUpdatingPassword ? <LoadingSpinner size="sm" /> : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivating will pause your Skill Path and coaching access. You can reactivate anytime by signing in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAccount}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? <LoadingSpinner size="sm" /> : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
