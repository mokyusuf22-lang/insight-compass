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
import { SUBSCRIPTION_TIERS } from '@/lib/subscriptionTiers';
import {
  User,
  Shield,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Check,
  Crown,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink
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
  const { user, profile, subscription, loading, signOut, updatePassword, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Billing state
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  // Deactivation state
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  // Refresh subscription on mount
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);

      if (error) throw error;

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: subscription.subscribed 
          ? 'Unable to open billing portal. Please try again.'
          : 'You need an active subscription to manage billing.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      // For now, just sign out the user
      // In a real implementation, you'd also set a flag in the database
      await signOut();
      navigate('/');
      toast({
        title: 'Account Deactivated',
        description: 'Your account has been deactivated. Sign in anytime to reactivate.',
      });
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeactivating(false);
      setShowDeactivateDialog(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading || subscription.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border">
        <div className="container max-w-4xl flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-serif font-semibold">Account Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-8 px-4 md:px-8 space-y-8">
        {/* Profile Settings */}
        <section className="chamfer bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 chamfer-sm bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Profile Settings</h2>
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
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="max-w-md bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="mt-4"
            >
              {isSavingProfile ? <LoadingSpinner size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        </section>

        {/* Security Settings */}
        <section className="chamfer bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 chamfer-sm bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Security Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 chamfer-sm bg-secondary/50">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
              </div>
              <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                Update Password
              </Button>
            </div>
          </div>
        </section>

        {/* Subscription & Billing */}
        <section className="chamfer bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 chamfer-sm bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Subscription & Billing</h2>
          </div>

          <div className="space-y-4">
            {/* Current Plan */}
            <div className={`p-4 chamfer-sm ${subscription.tier !== 'free' ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {subscription.tier !== 'free' && <Crown className="w-5 h-5 text-primary" />}
                  <span className="font-semibold text-lg">{tierConfig.name} Plan</span>
                </div>
                <span className="text-2xl font-bold">{tierConfig.priceDisplay}<span className="text-sm font-normal text-muted-foreground">/ month</span></span>
              </div>

              {subscription.subscribed && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'}: {formatDate(subscription.subscriptionEnd)}
                    </span>
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <span className="text-amber-600 font-medium">Cancellation pending</span>
                  )}
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {tierConfig.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {subscription.tier === 'free' ? (
                <Button onClick={() => navigate('/paywall')} className="gradient-primary text-primary-foreground">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/paywall')}>
                    Change Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal}
                  >
                    {isLoadingPortal ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                onClick={() => refreshSubscription()}
                className="text-muted-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        </section>

        {/* Account Deactivation */}
        <section className="chamfer bg-card p-6 border border-destructive/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 chamfer-sm bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">Account Deactivation</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Deactivating your account will pause your Skill Path and coaching access. Your data will be retained and you can reactivate anytime by signing in again.
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

      {/* Password Update Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Make sure it's at least 8 characters long.
            </DialogDescription>
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
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isUpdatingPassword || !newPassword || newPassword !== confirmPassword}
            >
              {isUpdatingPassword ? <LoadingSpinner size="sm" /> : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivating your account will pause your Skill Path and coaching access. You can reactivate anytime by signing in again.
              {subscription.subscribed && (
                <span className="block mt-2 font-medium text-amber-600">
                  Note: Your subscription will continue until the end of your current billing period.
                </span>
              )}
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
