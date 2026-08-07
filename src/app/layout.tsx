import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { SupabaseDataProvider } from '@/lib/supabase-data';
import { AccessibilityProvider } from '@/lib/accessibility-context';
import { I18nProvider } from '@/components/I18nProvider';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import PWAInstallPrompt, { IOSInstallHint } from '@/components/PWAInstallPrompt';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#000000' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'CivicPulse — Municipal Grievance & Civic Issue Portal',
    template: '%s | CivicPulse National Civic Portal',
  },
  description:
    'Official Crowdsourced Civic Issue Reporting & Resolution Platform for Municipal Corporations & Smart City Missions.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CivicPulse',
    startupImage: [
      { url: '/icon-512.png' },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'msapplication-TileImage': '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CivicPulse" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        <meta name="darkreader-lock" content="true" />
      </head>
      <body
        className="bg-[var(--background)] text-[var(--foreground)] min-h-[100dvh] flex flex-col font-sans"
        suppressHydrationWarning
      >
        <AccessibilityProvider>
          <I18nProvider>
            <AuthProvider>
              <SupabaseDataProvider>
                {children}
                <PWAInstallPrompt />
                <IOSInstallHint />
              </SupabaseDataProvider>
            </AuthProvider>
          </I18nProvider>
        </AccessibilityProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
