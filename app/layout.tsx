import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ClientErrorBoundary from '@/components/ClientErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Exam Strategy Engine - Universal Exam Preparation Platform',
  description: 'A strategic operating system for competitive exam preparation that transforms unstructured studying into a data-driven, adaptive process',
  keywords: 'exam preparation, competitive exams, UPSC, IBPS, SSC, GATE, CAT, study planner, mock tests, spaced repetition',
  authors: [{ name: 'Exam Strategy Engine Team' }],
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
        <ClientErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}