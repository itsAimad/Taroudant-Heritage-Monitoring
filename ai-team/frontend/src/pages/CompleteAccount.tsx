import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService, ApiError } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

const CompleteAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const token = searchParams.get('token');

  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [userData, setUserData] = useState<{ email: string; full_name: string } | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('invalid');
      return;
    }

    authService.verifyCompletionToken(token)
      .then((data) => {
        setUserData(data);
        setVerificationStatus('valid');
      })
      .catch((err) => {
        console.error('Token verification failed:', err);
        setVerificationStatus('invalid');
      });
  }, [token]);

  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  const isValidLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isPasswordValid = isValidLength && hasUppercase && hasDigit && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!isPasswordValid) {
      setErrorMessage('Password does not meet all requirements.');
      setStatus('error');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      await authService.completeAccount({ token, password });
      // Destroy any existing session so the new user starts fresh.
      // This clears both the httpOnly cookies (via API) AND the
      // React in-memory user state — preventing session bleed from
      // an admin who opened this link while logged in.
      try {
        await logout();
      } catch {
        // best-effort — state is cleared regardless
      }
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      
      // Handle FastAPI 422 validation errors gracefully
      let errMsg = err.message || 'Failed to complete account setup.';
      if (Array.isArray(err.detail)) {
        errMsg = err.detail[0]?.msg || 'Invalid input provided.';
      }
      setErrorMessage(errMsg);
    }
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-sand/10 border-t-copper-light animate-spin rounded-full mb-4" />
          <p className="text-sand/60 font-medium">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
        <motion.div 
          className="max-w-md w-full bg-sand/5 border border-sand/10 p-8 rounded-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="font-heading text-2xl text-sand-light mb-4">Invalid or Expired Link</h1>
          <p className="text-sand/60 text-sm mb-8 leading-relaxed">
            This account completion link is either invalid or has expired. 
            Links are valid for 48 hours for security reasons.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-copper-light hover:text-copper-light/80 transition-colors font-medium"
          >
            Return to Homepage <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6 selection:bg-copper-light/30">
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-copper-light/10 p-2 rounded-lg backdrop-blur-md">
            <Shield className="h-full w-full text-copper-light" />
          </div>
          <span className="font-heading text-lg tracking-widest text-sand-light uppercase opacity-80">
            Heritage Shield
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div 
            key="success"
            className="max-w-md w-full bg-sand/5 border border-sand/10 p-10 rounded-2xl text-center shadow-2xl shadow-black/40"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="font-heading text-3xl text-sand-light mb-4">Setup Complete</h1>
            <p className="text-sand/60 text-sm mb-10 leading-relaxed">
              Welcome, <span className="text-sand-light font-medium">{userData?.full_name}</span>! 
              Your account is now active. Please log in with your new password to access the system.
            </p>
            <Link 
              to="/login"
              className="group flex items-center justify-center gap-3 w-full py-4 bg-copper-light text-charcoal rounded-xl font-bold tracking-wider hover:bg-copper-light/90 transition-all active:scale-[0.98]"
            >
              PROCEED TO LOGIN <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            className="max-w-md w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-10 text-center">
              <h1 className="font-heading text-4xl text-sand-light mb-3">Complete Your Account</h1>
              <p className="text-sand/40 text-sm">
                Set a secure password for <span className="text-sand/70">{userData?.email}</span>
              </p>
            </div>

            <div className="bg-sand/5 border border-sand/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-sand/40 uppercase mb-2">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-sand/20 group-focus-within:text-copper-light transition-colors" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-sand/5 border border-sand/10 rounded-xl py-4 pl-12 pr-12 text-sand-light placeholder:text-sand/10 focus:outline-none focus:border-copper-light/40 focus:bg-sand/8 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-sand/20 hover:text-sand/50 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-sand/40 uppercase mb-2">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-sand/20 group-focus-within:text-copper-light transition-colors" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-sand/5 border border-sand/10 rounded-xl py-4 pl-12 pr-12 text-sand-light placeholder:text-sand/10 focus:outline-none focus:border-copper-light/40 focus:bg-sand/8 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-4 bg-black/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-[10px] tracking-wide">
                    <div className={`h-1.5 w-1.5 rounded-full ${isValidLength ? 'bg-emerald-400' : 'bg-sand/20'}`} />
                    <span className={isValidLength ? 'text-emerald-400/80' : 'text-sand/40'}>Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] tracking-wide">
                    <div className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? 'bg-emerald-400' : 'bg-sand/20'}`} />
                    <span className={hasUppercase ? 'text-emerald-400/80' : 'text-sand/40'}>One uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] tracking-wide">
                    <div className={`h-1.5 w-1.5 rounded-full ${hasDigit ? 'bg-emerald-400' : 'bg-sand/20'}`} />
                    <span className={hasDigit ? 'text-emerald-400/80' : 'text-sand/40'}>One number</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] tracking-wide">
                    <div className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? 'bg-emerald-400' : 'bg-sand/20'}`} />
                    <span className={hasSpecial ? 'text-emerald-400/80' : 'text-sand/40'}>One special character (@$!%*?&)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] tracking-wide">
                    <div className={`h-1.5 w-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-400' : 'bg-sand/20'}`} />
                    <span className={passwordsMatch ? 'text-emerald-400/80' : 'text-sand/40'}>Passwords match</span>
                  </div>
                </div>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.div 
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {errorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="relative overflow-hidden w-full py-4 bg-copper-light text-charcoal rounded-xl font-bold tracking-[0.2em] hover:bg-copper-light/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  {status === 'submitting' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-charcoal/30 border-t-charcoal animate-spin rounded-full" />
                      FINALIZING...
                    </div>
                  ) : (
                    'FINISH SETUP'
                  )}
                </button>
              </form>
            </div>
            
            <p className="mt-8 text-center text-[10px] tracking-[0.1em] text-sand/20 uppercase font-medium">
              Secure Onboarding Phase • Taroudant Regional Council
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompleteAccount;
