import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError('Unable to restore your session. Please sign in again.');
        return;
      }
      if (data.session) {
        navigate({ to: '/admin' });
      }
    }).catch(() => {
      setError('Unable to connect to the authentication service. Please check your connection and try again.');
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        if (signInError.code === 'email_not_confirmed') {
          setError('Your email is not confirmed. Confirm your email or ask your Supabase administrator to confirm the account.');
        } else if (signInError.status === 0 || signInError.name === 'AuthRetryableFetchError') {
          setError('Unable to connect to the authentication service. Please check your connection and the Supabase project configuration.');
        } else if (signInError.status === 429) {
          setError('Too many sign-in attempts. Please wait a few minutes and try again.');
        } else if (signInError.code === 'invalid_credentials') {
          setError('Invalid credentials. Please check your email and password.');
        } else {
          setError('Sign-in is currently unavailable. Please try again or contact your administrator.');
        }
        return;
      }
      navigate({ to: '/admin' });
    } catch {
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1a33] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#c9a227] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1e3a6f] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-12 h-12 rounded-lg bg-[#c9a227] flex items-center justify-center">
            <Shield className="w-7 h-7 text-[#0c1a33]" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-white">MeridianVault</span>
            <span className="text-[10px] text-[#c9a227] uppercase tracking-widest">Secure Logistics</span>
          </div>
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-[#112342] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#c9a227]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0c1a33]">Administrator Login</h1>
            <p className="text-sm text-slate-500 mt-1">Authorized personnel only</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="admin@meridianvault.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-navy w-full">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-[#c9a227] transition-colors">
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
