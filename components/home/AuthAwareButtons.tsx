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
        <Button className="text-sm gradient-primary text-white border-0">Go to Dashboard</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      <Link href="/login">
        <Button variant="ghost" className="text-sm">
          Sign In
        </Button>
      </Link>
      <Link href="/login">
        <Button className="text-sm gradient-primary text-white border-0">Get Started</Button>
      </Link>
    </div>
  );
}
