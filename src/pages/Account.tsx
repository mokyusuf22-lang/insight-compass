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
import { Switch } from '@/components/ui/switch';
import { openCookieSettings, recordConsents, untypedDb } from '@/lib/consent';
import { LegalLinks } from './Legal';
import {
  CircleUser,
  ShieldCheck,
  UserMinus,
  ArrowLeft,
  Download,
  Lock,
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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [marketing, setMarketing] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.user_metadata?.display_name) setDisplayName(user.user_metadata.display_name);
  }, [user]);

  // Latest marketing-email choice (consents are append-only, so the newest row wins).
  useEffect(() => {
    if (!user) return;
    untypedDb.from('user_consents').select('granted').eq('user_id', user.id).eq('consent_type', 'marketing_email')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setMarketing(!!(data as { granted?: boolean } | null)?.granted));
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

  const handleMarketing = async (on: boolean) => {
    setMarketing(on);
    const ok = await recordConsents([{ type: 'marketing_email', granted: on }]);
    if (!ok) {
      setMarketing(!on);
      toast({ title: 'Error', description: 'Couldn’t save your choice. Please try again.', variant: 'destructive' });
    }
  };

  // GDPR data portability: everything we hold about the user, as one JSON file.
  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const tables = [
        'profiles', 'aura_sessions', 'path_commitments', 'path_recommendations', 'personal_paths',
        'weekly_execution_plans', 'reality_reports', 'career_strategies', 'assessments', 'assessment_responses',
        'disc_assessments', 'mbti_assessments', 'strengths_assessments', 'wheel_of_life_assessments',
        'value_map_assessments', 'blob_tree_assessments', 'coach_requests', 'coach_assignments', 'user_consents',
      ];
      const out: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        account: { id: user.id, email: user.email ?? null, created_at: user.created_at, guest: !!user.is_anonymous },
      };
      await Promise.all(tables.map(async (t) => {
        const { data, error } = await untypedDb.from(t).select('*').eq('user_id', user.id);
        if (!error) out[t] = data;
      }));
      const assignmentIds = ((out.coach_assignments as { id: string }[] | undefined) ?? []).map((a) => a.id);
      if (assignmentIds.length) {
        const { data } = await untypedDb.from('coach_messages').select('*').in('assignment_id', assignmentIds);
        out.coach_messages = data ?? [];
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bemore-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Error', description: 'Couldn’t prepare your data. Please try again.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } });
      if (error || !(data as { deleted?: boolean } | null)?.deleted) {
        let message = 'We couldn’t delete your account. Please contact support.';
        try {
          const body = await (error as { context?: Response } | null)?.context?.json();
          if (body?.error) message = body.error;
        } catch { /* keep the default message */ }
        throw new Error(message);
      }
      await signOut();
      navigate('/');
      toast({ title: 'Account deleted', description: 'Your account and data have been permanently deleted.' });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirm('');
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
              <Input id="email" value={user?.email || 'Guest account (no email)'} disabled className="max-w-md bg-muted" />
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

        {/* ── Privacy & data ──────────────────────────────── */}
        <section className="chamfer bg-card border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 chamfer-sm bg-secondary flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold">Privacy &amp; data</h2>
              <p className="text-sm text-muted-foreground">Your choices and a copy of your data</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 p-4 chamfer-sm bg-secondary/50">
              <label htmlFor="acct-marketing">
                <p className="font-medium text-sm">Tips and updates by email</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email ? 'Occasional emails. You can turn this off at any time.' : 'Add an email to your account to receive these.'}
                </p>
              </label>
              <Switch
                id="acct-marketing"
                checked={!!marketing}
                disabled={marketing === null || !user?.email}
                onCheckedChange={handleMarketing}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-4 chamfer-sm bg-secondary/50">
              <div>
                <p className="font-medium text-sm">Cookies</p>
                <p className="text-sm text-muted-foreground">Change whether we use analytics and advertising cookies</p>
              </div>
              <Button variant="outline" onClick={openCookieSettings}>Cookie settings</Button>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 chamfer-sm bg-secondary/50">
              <div>
                <p className="font-medium text-sm">Download my data</p>
                <p className="text-sm text-muted-foreground">Your goal, answers, plan, consents and coach messages as a file</p>
              </div>
              <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-2">
                {isExporting ? <LoadingSpinner size="sm" /> : <><Download className="w-4 h-4" />Download</>}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Delete account ──────────────────────────────── */}
        <section className="chamfer bg-destructive/3 border-2 border-destructive/25 p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 chamfer-sm bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <UserMinus className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-destructive">Delete account</h2>
              <p className="text-sm text-muted-foreground">Permanent and can’t be undone</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This permanently deletes your account, goal, answers, plan, progress and coach messages.
            Download your data first if you want a copy.
          </p>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete my account
          </Button>
        </section>

        <LegalLinks className="justify-center pt-2" />
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

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(o) => { setShowDeleteDialog(o); if (!o) setDeleteConfirm(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything will be permanently deleted. Type <strong>DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
              disabled={isDeleting || deleteConfirm !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <LoadingSpinner size="sm" /> : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
