'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Camera, Brain, MapPin, ThumbsUp, Timer, ShieldCheck,
  ArrowRight, Activity, CheckCircle, Download, Smartphone,
  Building2, FileText, Lock, PhoneCall, ExternalLink, AlertCircle
} from 'lucide-react';
import { TopGovBar } from '@/components/TopGovBar';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const features = [
    { title: 'Citizen Grievance Docketing', icon: Camera, desc: 'Capture photographic evidence with precise GPS coordinates for official municipal action.' },
    { title: 'AI Automated Triage', icon: Brain, desc: 'Smart categorization and SLA severity indexing powered by machine learning algorithms.' },
    { title: 'Geospatial Deduplication', icon: MapPin, desc: 'Automated merging of duplicate public complaints within a 30-meter municipal radius.' },
    { title: 'Citizen Priority Upvoting', icon: ThumbsUp, desc: 'Democratized public voting system to flag critical community infrastructure defects.' },
    { title: 'SLA Accountability Tracking', icon: Timer, desc: 'Mandatory resolution deadlines enforced for ward officers and municipal departments.' },
    { title: 'DigiLocker Identity Verification', icon: ShieldCheck, desc: 'Tamper-proof citizen identity verification ensuring genuine, spam-free reporting.' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">

      {/* ── 1. TOP OFFICIAL STRIP ── */}
      <TopGovBar />

      {/* ── 2. HEADER ── */}
      <header className="sticky top-0 w-full z-50 bg-white border-b border-[var(--border)] shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-[72px] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] text-white flex items-center justify-center font-black rounded-[2px] text-lg">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">CivicPulse</span>
                <span className="text-[10px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-[2px] uppercase font-bold tracking-wider">
                  {t('official_portal')}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] font-medium">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstall}
                id="landing-install-btn"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[var(--primary)] text-white hover:bg-[var(--dark-grey)] transition-colors"
              >
                <Download size={14} />
                Install Portal App
              </button>
            )}
            <Link
              href="/login"
              className="px-4 py-2 rounded-[3px] text-xs font-bold text-[var(--foreground)] border border-[#111111] bg-white hover:bg-[var(--background)] transition-colors"
            >
              {t('sign_in')}
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-[3px] text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--dark-grey)] transition-colors"
            >
              {t('officer_portal')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ── 3. HERO BANNER ── */}
        <section className="bg-white border-b border-[var(--border)] py-16 lg:py-20 px-4 lg:px-8">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] px-3 py-1 text-xs font-bold text-[#1a1a2e] uppercase tracking-wider mb-6">
                <Building2 size={14} className="text-[#1f4e79]" />
                SMART CITIES MISSION &bull; PUBLIC GRIEVANCE REDRESSAL
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] mb-6 leading-tight tracking-tight">
                CivicPulse
              </h1>

              <p className="text-base sm:text-lg text-[var(--muted-foreground)] mb-8 font-medium max-w-3xl leading-relaxed">
                {t('subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/login"
                  id="hero-report-cta"
                  className="gov-btn-primary flex items-center justify-center gap-2 text-sm font-bold shadow-xs text-center"
                >
                  {t('nav_report')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard/feed"
                  id="hero-authority-cta"
                  className="gov-btn-secondary flex items-center justify-center gap-2 text-sm font-bold text-center"
                >
                  <FileText className="w-4 h-4" />
                  {t('all_dockets')}
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--muted-foreground)] font-semibold pt-4 border-t border-[var(--border)]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[var(--success)]" /> DigiLocker Verified
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock size={16} className="text-[#1f4e79]" /> 256-Bit SSL Encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-[var(--success)]" /> CPGRAMS Integrated
                </span>
              </div>
            </div>

            {/* Official Portal Notice Card */}
            <div className="lg:col-span-4 bg-[var(--card)] border border-[var(--border)] p-6 rounded-[4px]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
                <AlertCircle size={18} className="text-[#a16207]" />
                <h3 className="font-bold text-sm text-[var(--foreground)] uppercase tracking-wide">Public Notice & Advisory</h3>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4">
                Citizens can register complaints regarding Road Potholes, Water Leaks, Garbage Dumps, Streetlight Failures, and Sewage Overflow. All filings receive a unique 10-digit Grievance Tracking Number (GTN).
              </p>
              <div className="bg-white border border-[var(--border)] p-3 rounded-[2px] mb-4 text-xs font-mono">
                <span className="text-[var(--muted-foreground)] block text-[10px] font-sans uppercase font-bold">Official Hotline:</span>
                <span className="font-bold text-[var(--foreground)] text-sm">1800-11-2026 (Toll-Free)</span>
              </div>
              <Link href="/login" className="block text-center text-xs font-bold bg-[var(--primary)] text-white py-2 px-4 rounded-[2px] hover:bg-[var(--dark-grey)]">
                Lodge Grievance Online &rarr;
              </Link>
            </div>

          </div>
        </section>

        {/* ── 4. PUBLIC GRIEVANCE STATISTICS ── */}
        <section className="bg-[var(--background)] border-b border-[var(--border)] py-10 px-4 lg:px-8">
          <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '10,240+', label: 'Registered Grievance Dockets' },
              { value: '8,450+', label: 'Municipal Issues Resolved' },
              { value: '2.4 Days', label: 'Average SLA Resolution Time' },
              { value: '50,000+', label: 'Verified Citizen Users' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-[var(--border)] p-5 rounded-[4px]">
                <div className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mb-1 font-mono">{stat.value}</div>
                <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. SYSTEM ARCHITECTURE & FEATURES ── */}
        <section className="max-w-[1400px] mx-auto py-16 px-4 lg:px-8">
          <div className="mb-12 border-b border-[var(--border)] pb-4">
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">E-GOVERNANCE FRAMEWORK</span>
            <h2 className="text-2xl font-extrabold text-[var(--foreground)] mt-1">Grievance Redressal Architecture</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-6 border border-[var(--border)] rounded-[4px]"
              >
                <div className="w-10 h-10 bg-[var(--primary)] text-white flex items-center justify-center rounded-[2px] mb-4">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold mb-2 text-[var(--foreground)]">{feature.title}</h3>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── 6. FOOTER ── */}
      <footer className="bg-[var(--primary)] text-[#d9d9d9] border-t-4 border-[var(--primary)] text-xs py-10 px-4 lg:px-8 mt-auto">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-[#2f2f2f]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-white text-[var(--primary)] font-bold flex items-center justify-center text-xs">CP</div>
              <span className="font-bold text-white text-sm">CivicPulse Portal</span>
            </div>
            <p className="text-[#9ca3af] text-[11px] leading-relaxed">
              Official Crowdsourced Civic Grievance Reporting & Resolution System operated under National e-Governance Services.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-[11px] text-[#cfcfcf]">
              <li><Link href="/login" className="hover:underline">{t('sign_in')}</Link></li>
              <li><Link href="/login" className="hover:underline">{t('officer_portal')}</Link></li>
              <li><Link href="/dashboard/feed" className="hover:underline">{t('nav_feed')}</Link></li>
              <li><Link href="/dashboard/map" className="hover:underline">{t('nav_map')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">e-Governance Links</h4>
            <ul className="space-y-2 text-[11px] text-[#cfcfcf]">
              <li><a href="https://cpgrams.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">CPGRAMS Portal <ExternalLink size={10} /></a></li>
              <li><a href="https://india.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">National Portal of India <ExternalLink size={10} /></a></li>
              <li><a href="https://smartcities.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">Smart Cities Mission <ExternalLink size={10} /></a></li>
              <li><a href="https://digilocker.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">DigiLocker Identity <ExternalLink size={10} /></a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Helpline & Support</h4>
            <p className="text-[11px] text-[#cfcfcf] mb-2 font-mono">{t('helpline')}</p>
            <p className="text-[11px] text-[#cfcfcf] mb-3">Email: support-civicpulse@gov.in</p>
            <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--dark-grey)] text-white px-2 py-1 font-bold">
              <CheckCircle size={12} className="text-[var(--success)]" /> WCAG 2.1 AA ACCESSIBLE
            </span>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center text-[11px] text-[var(--muted-foreground)] gap-4">
          <p>{t('footer_rights')}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">{t('privacy_policy')}</a>
            <span>|</span>
            <a href="#" className="hover:underline">{t('terms_of_service')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
