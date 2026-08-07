'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { TopGovBar } from '@/components/TopGovBar';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] font-sans">
      
      {/* ── TOP ACCESSIBILITY TOOLBAR ── */}
      <TopGovBar />

      <main id="main-content" className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[4px] border border-[var(--border)] p-8 shadow-xs">
            
            {/* Header */}
            <div className="flex flex-col items-center mb-6 text-center pb-6 border-b border-[var(--border)]">
              <div className="w-12 h-12 bg-[var(--primary)] text-white flex items-center justify-center font-extrabold rounded-[2px] text-xl mb-3">
                CP
              </div>
              <h1 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">{t('login_title')}</h1>
              <p className="text-[var(--muted-foreground)] text-xs font-semibold mt-1">{t('subtitle')}</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-[2px] bg-[#fee2e2] border border-[#b91c1c] text-[#991b1b] text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                  {t('email_label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[var(--border)] rounded-[2px] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-[var(--foreground)] text-xs font-medium placeholder-[#777777]"
                    placeholder="name@gov.in or citizen@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                  {t('password_label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[var(--border)] rounded-[2px] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-[var(--foreground)] text-xs font-medium placeholder-[#777777]"
                    placeholder="Enter security password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gov-btn-primary flex items-center justify-center gap-2 text-xs font-bold py-3 uppercase tracking-wider"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t('sign_in')} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
              <p className="text-[var(--muted-foreground)] text-xs font-medium mb-3">
                First time filing a grievance?{' '}
                <Link href="/register" className="text-[var(--primary)] underline font-bold hover:text-[var(--foreground)]">
                  {t('register_account')}
                </Link>
              </p>
              <div className="inline-flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)] bg-[var(--card)] border border-[var(--border)] px-2.5 py-1 rounded-[2px]">
                <ShieldCheck size={12} className="text-[var(--success)]" /> Protected by 256-Bit SSL Municipal Encryption
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="bg-[var(--primary)] text-[var(--muted-foreground)] text-[11px] py-4 text-center border-t border-[var(--primary)]">
        {t('footer_rights')}
      </footer>
    </div>
  );
}
