import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import GlobalErrorBoundary from '@/components/error-handling/GlobalErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityChecker, SkipToContent } from '@/lib/accessibility-utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Exam Strategy Engine - Universal Exam Preparation Platform',
    template: '%s | Exam Strategy Engine',
  },
  description:
    'A strategic operating system for competitive exam preparation that transforms unstructured studying into a data-driven, adaptive process with AI-powered insights.',
  keywords: [
    'exam preparation',
    'competitive exams',
    'UPSC preparation',
    'IBPS banking exams',
    'SSC exams',
    'GATE preparation',
    'CAT coaching',
    'study planner',
    'mock tests',
    'spaced repetition',
    'AI tutoring',
    'adaptive learning',
    'exam strategy',
    'revision planner',
    'progress tracking',
  ],
  authors: [{ name: 'Exam Strategy Engine Team', url: 'https://examstrategyengine.com' }],
  creator: 'Exam Strategy Engine Team',
  publisher: 'Exam Strategy Engine',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://examstrategyengine.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://examstrategyengine.com',
    title: 'Exam Strategy Engine - Universal Exam Preparation Platform',
    description:
      'Transform your exam preparation with AI-powered adaptive learning, strategic planning, and data-driven insights.',
    siteName: 'Exam Strategy Engine',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Exam Strategy Engine - Strategic Exam Preparation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exam Strategy Engine - Universal Exam Preparation Platform',
    description:
      'Transform your exam preparation with AI-powered adaptive learning, strategic planning, and data-driven insights.',
    images: ['/twitter-image.png'],
    creator: '@examstrategyengine',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0066cc' },
    { media: '(prefers-color-scheme: dark)', color: '#1a365d' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Exam Strategy Engine" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Exam Strategy" />
        <meta name="msapplication-TileColor" content="#0066cc" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* App Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0066cc" />

        {/* Microsoft */}
        <meta name="msapplication-TileImage" content="/icons/mstile-150x150.png" />

        {/* Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.jpg" sizes="2048x2732" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2224.jpg" sizes="1668x2224" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.jpg" sizes="1536x2048" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.jpg" sizes="1125x2436" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2208.jpg" sizes="1242x2208" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.jpg" sizes="750x1334" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.jpg" sizes="640x1136" />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      // console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                      // console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <GlobalErrorBoundary level="global" showDetails={false}>
          <AccessibilityChecker>
            <SkipToContent targetId="main-content" />
            <AuthProvider>
              <main id="main-content" className="min-h-screen">
                {children}
              </main>
              <Toaster />
            </AuthProvider>
          </AccessibilityChecker>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
