import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/assessment/LoadingSpinner';
import { SignInConfirmation } from '@/components/SignInConfirmation';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset-sent';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get('reset') === 'true';
  
  const [mode, setMode] = useState<AuthMode>(isReset ? 'login' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');

  const { signIn, signUp, signInWithGoogle, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConfirmationComplete = useCallback(() => {
    navigate('/welcome');
  }, [navigate]);

  useEffect(() => {
    if (!loading && user && !showConfirmation) {
      navigate('/welcome');
    }
  }, [user, loading, navigate, showConfirmation]);

  const validateForm = () => {
    try {
      if (mode === 'forgot') {
        emailSchema.parse({ email });
      } else {
        authSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Google sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setMode('reset-sent');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot') {
      return handleForgotPassword();
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          setConfirmedEmail(email);
          setShowConfirmation(true);
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'An account with this email already exists. Try signing in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          setConfirmedEmail(email);
          setShowConfirmation(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirmation && confirmedEmail) {
    return (
      <SignInConfirmation 
        email={confirmedEmail} 
        onComplete={handleConfirmationComplete}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Password reset sent confirmation
  if (mode === 'reset-sent') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="py-6 px-6 text-center border-b border-border">
          <Link to="/" className="font-sans font-semibold tracking-wide text-lg">
            CLARITY
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="chamfer-lg bg-card p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 chamfer bg-secondary flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif mb-4">Check your email</h1>
              <p className="text-muted-foreground mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
              </p>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setMode('login')}
              >
                Back to sign in
              </Button>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center">
          <p className="text-xs text-muted-foreground">©2025 Clarity</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-6 text-center border-b border-border">
        <Link to="/" className="font-sans font-semibold tracking-wide text-lg">
          CLARITY
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Card with chamfered corners */}
          <div className="chamfer-lg bg-card p-8 md:p-12">
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl leading-tight">
                {mode === 'forgot' ? (
                  <>
                    <span className="font-sans">Reset your</span>
                    <br />
                    <span className="font-serif italic">password</span>
                  </>
                ) : (
                  <>
                    <span className="font-sans">Please sign</span>
                    <br />
                    <span className="font-sans">{mode === 'login' ? 'in' : 'up'} </span>
                    <span className="font-serif italic">to continue</span>
                  </>
                )}
              </h1>
              {mode === 'forgot' && (
                <p className="text-muted-foreground text-sm mt-3">
                  Enter your email and we'll send you a reset link.
                </p>
              )}
            </div>

            {/* Google Sign In - only show for login/signup */}
            {mode !== 'forgot' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-full mb-6"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                >
                  {isGoogleLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`h-12 rounded-lg border-border ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm text-muted-foreground">
                      Password
                    </Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrors({});
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className={`h-12 rounded-lg border-border ${errors.password ? 'border-destructive' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : mode === 'forgot' ? (
                  'Send reset link'
                ) : mode === 'login' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className="text-sm text-foreground hover:underline font-medium"
                >
                  Back to sign in
                </button>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setErrors({});
                    }}
                    className="text-sm text-foreground hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Get started' : 'Sign in'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you acknowledge and agree to our
            </p>
            <p className="text-xs text-muted-foreground">
              <a href="#" className="underline hover:text-foreground">terms of service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-foreground">privacy policy</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          ©2025 Clarity
        </p>
      </footer>
    </div>
  );
}
