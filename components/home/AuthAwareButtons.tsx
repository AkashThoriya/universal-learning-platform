'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthAwareButtons() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-9 w-24 bg-primary/20 rounded animate-pulse" />
      </div>
    );
  }

  if (user) {
    return (
      <Link href="/dashboard">
        <Button className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-md hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-0.5">Go to Dashboard</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      <Link href="/login">
        <Button variant="ghost" className="text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          Sign In
        </Button>
      </Link>
      <Link href="/login">
        <Button className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-md hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-0.5">Get Started</Button>
      </Link>
    </div>
  );
}
