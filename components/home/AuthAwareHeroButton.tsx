'use client';

import Link from 'next/link';
import { Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthAwareHeroButton() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-14 w-72 bg-primary/20 rounded-lg animate-pulse" />
    );
  }

  const href = user ? '/dashboard' : '/login';
  const text = user ? 'Go to Dashboard' : 'Start Your Learning Journey';

  return (
    <Link href={href} className="w-full sm:w-auto">
      <Button
        size="lg"
        className="w-full sm:w-auto gradient-primary text-white border-0 shadow-2xl hover:shadow-primary/25 transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold hover:-translate-y-0.5"
      >
        <Rocket className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
        {text}
        <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    </Link>
  );
}
