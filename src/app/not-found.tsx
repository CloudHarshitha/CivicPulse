'use client';

import Link from 'next/link';
import { TopGovBar } from '@/components/TopGovBar';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] font-sans">
      <TopGovBar />

      <main id="main-content" className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="gov-card p-8 max-w-md w-full space-y-4">
          <div className="w-12 h-12 bg-[#fee2e2] text-[var(--destructive)] border border-[#b91c1c] rounded-[2px] flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <span className="font-mono text-xs font-bold text-[var(--muted-foreground)] block">404 ERROR &bull; RECORD NOT FOUND</span>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">Requested Page Does Not Exist</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            The portal URL or grievance record you accessed could not be located in the municipal index.
          </p>

          <div className="pt-4 border-t border-[var(--border)]">
            <Link href="/dashboard" className="gov-btn-primary text-xs font-bold uppercase inline-flex items-center gap-2">
              <ArrowLeft size={14} /> Return to Dashboard
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-[var(--primary)] text-[var(--muted-foreground)] text-[11px] py-4 text-center border-t border-[var(--primary)]">
        {t('footer_rights')}
      </footer>
    </div>
  );
}
