import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import GlobalErrorBoundary from '@/components/error-handling/GlobalErrorBoundary';
import { SkipToContent, AccessibilityChecker } from '@/lib/accessibility-utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Exam Strategy Engine - Universal Exam Preparation Platform',
    template: '%s | Exam Strategy Engine'
  },
  description: 'A strategic operating system for competitive exam preparation that transforms unstructured studying into a data-driven, adaptive process with AI-powered insights.',
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
    'progress tracking'
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
    description: 'Transform your exam preparation with AI-powered adaptive learning, strategic planning, and data-driven insights.',
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
    description: 'Transform your exam preparation with AI-powered adaptive learning, strategic planning, and data-driven insights.',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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