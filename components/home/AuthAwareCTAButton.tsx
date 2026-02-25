'use client';

import { Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthAwareCTAButton() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-16 w-80 bg-primary/20 rounded-lg animate-pulse" />;
  }

  const href = user ? '/dashboard' : '/login';
  const text = user ? 'Go to Dashboard' : 'Start Your Learning Journey';

  return (
    <Link href={href}>
      <Button
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-2xl hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-300 px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg font-bold hover:-translate-y-0.5"
      >
        <Rocket className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
        {text}
        <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </Link>
  );
}
