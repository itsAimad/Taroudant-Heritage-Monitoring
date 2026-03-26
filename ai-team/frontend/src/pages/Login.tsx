import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, error, clearError, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return (
    <div className="min-h-screen bg-charcoal flex
                    items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2
                      border-sand/10 border-t-copper-light
                      animate-spin" />
    </div>
  )

  if (isAuthenticated) { navigate('/dashboard'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    clearError();
    try {
      await login(email, password);
      // navigation handled inside AuthContext.login()
    } catch {
      // error already set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 px-4">
      {/* Subtle texture bg */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to the Heritage Monitoring System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-md
                           bg-red-950/40 border border-red-800/40
                           px-4 py-3 text-sm text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-copper-light text-charcoal
                         font-medium rounded-md transition
                         hover:bg-copper-light/90
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-charcoal/30
                                   border-t-charcoal rounded-full
                                   animate-spin" />
                  Signing in...
                </span>
              ) : 'Enter System'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Demo credentials:</p>
            <div className="grid gap-2">
              {[
                { role: 'Admin',     user: 'admin@heritage-taroudant.ma',     pass: 'Heritage2026!' },
                { role: 'Inspector', user: 'inspector@heritage-taroudant.ma', pass: 'Heritage2026!' },
                { role: 'Authority', user: 'authority@heritage-taroudant.ma', pass: 'Heritage2026!' },
              ].map(c => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => { setEmail(c.user); setPassword(c.pass); }}
                  className="text-left px-3 py-2 rounded border border-border hover:bg-muted transition-colors text-xs"
                >
                  <span className="font-medium text-foreground">{c.role}:</span>{' '}
                  <span className="font-mono text-muted-foreground">{c.user}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate('/monuments')} className="text-sm">
                Continue as Guest
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
