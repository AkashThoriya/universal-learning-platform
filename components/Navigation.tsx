'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Home, BookOpen, BarChart3, Target, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              War Room
            </Link>
            
            <div className="flex space-x-1">
              <Link href="/dashboard">
                <Button variant={isActive('/dashboard') ? 'default' : 'ghost'} size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/subjects">
                <Button variant={isActive('/subjects') ? 'default' : 'ghost'} size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Subjects
                </Button>
              </Link>
              <Link href="/test-logger">
                <Button variant={isActive('/test-logger') ? 'default' : 'ghost'} size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Test Logger
                </Button>
              </Link>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </nav>
  );
}