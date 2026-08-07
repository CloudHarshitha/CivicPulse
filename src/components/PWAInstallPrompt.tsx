'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Smartphone, Building2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'civicpulse-pwa-dismissed';
const DISMISS_EXPIRY_DAYS = 7;

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const expiry = DISMISS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < expiry) return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  }, []);

  if (isInstalled || !showBanner || !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install CivicPulse Portal App"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-[9999] font-sans"
    >
      <div className="bg-white rounded-[4px] border border-[var(--border)] shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs">
              CP
            </div>
            <div>
              <h4 className="font-bold text-xs text-[var(--foreground)] uppercase">CivicPulse Portal App</h4>
              <p className="text-[10px] text-[var(--muted-foreground)]">Official Municipal e-Governance PWA</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          Install the CivicPulse Government Portal app to access offline grievance filing and instant ward notifications.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleInstall}
            className="gov-btn-primary w-full text-xs font-bold uppercase py-2 flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> Install Portal App
          </button>
        </div>
      </div>
    </div>
  );
}

export function IOSInstallHint() {
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isIOS && !isStandalone) {
      const dismissed = localStorage.getItem('civicpulse-ios-hint-dismissed');
      if (!dismissed) {
        setShowIOSHint(true);
      }
    }
  }, []);

  if (!showIOSHint) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-[9999] bg-white border border-[var(--border)] rounded-[4px] p-4 shadow-lg text-xs space-y-2 font-sans">
      <div className="flex justify-between items-center">
        <span className="font-bold text-[var(--foreground)] uppercase flex items-center gap-1">
          <Smartphone size={14} /> iOS Portal Installation
        </span>
        <button
          onClick={() => {
            setShowIOSHint(false);
            localStorage.setItem('civicpulse-ios-hint-dismissed', 'true');
          }}
          className="text-[var(--muted-foreground)]"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-[var(--muted-foreground)]">
        Tap <strong>Share</strong> in Safari, then select <strong>Add to Home Screen</strong> to install the portal app.
      </p>
    </div>
  );
}
