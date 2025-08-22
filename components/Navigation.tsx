'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Home, 
  BookOpen, 
  BarChart3, 
  Target, 
  Settings, 
  Calendar, 
  TestTube,
  User,
  Bell,
  Menu,
  X,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;
  const isActiveGroup = (paths: string[]) => paths.some(path => pathname.startsWith(path));

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      isActive: isActive('/dashboard')
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      isActive: isActive('/analytics'),
      badge: 'New' // Highlight new feature
    },
    {
      href: '/missions',
      label: 'Missions',
      icon: Target,
      isActive: isActiveGroup(['/missions']),
      badge: '3' // Active missions count
    },
    {
      href: '/micro-learning',
      label: 'Micro-Learning',
      icon: Zap,
      isActive: isActive('/micro-learning')
    },
    {
      href: '/syllabus',
      label: 'Syllabus',
      icon: BookOpen,
      isActive: isActive('/syllabus')
    },
    {
      href: '/log/daily',
      label: 'Daily Log',
      icon: Calendar,
      isActive: isActive('/log/daily')
    },
    {
      href: '/log/mock',
      label: 'Mock Tests',
      icon: TestTube,
      isActive: isActiveGroup(['/log/mock', '/test-logger'])
    }
  ];

  return (
    <nav className="glass border-0 border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="relative">
                <Target className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-200" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">
                Exam Strategy Engine
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={item.isActive ? 'default' : 'ghost'} 
                    size="sm"
                    className={`
                      relative transition-all duration-200 hover:scale-105
                      ${item.isActive 
                        ? 'gradient-primary text-white shadow-lg' 
                        : 'hover:bg-white/10 hover:text-primary'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500 text-white"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.isActive && (
                      <div className="absolute inset-0 bg-white/20 rounded-md opacity-50"></div>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium">{user?.displayName || 'User'}</span>
                <span className="text-xs text-muted-foreground">Premium</span>
              </div>
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.displayName?.[0] || 'U'}
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 hover:opacity-20 transition-opacity duration-200"></div>
              </div>
            </div>

            {/* Logout */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exit</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      variant={item.isActive ? 'default' : 'ghost'} 
                      size="sm"
                      className={`
                        w-full justify-start transition-all duration-200
                        ${item.isActive 
                          ? 'gradient-primary text-white' 
                          : 'hover:bg-white/10 hover:text-primary'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500 text-white"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}