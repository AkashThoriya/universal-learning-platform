'use client';

/**
 * @fileoverview Enhanced Navigation Component
 *
 * Enterprise-grade navigation with accessibility, responsive design,
 * and intelligent badge system.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  LogOut,
  Home,
  BookOpen,
  BarChart3,
  Target,
  Calendar,
  TestTube,
  User,
  Bell,
  Menu,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: string | number;
  description?: string;
}

export default function Navigation() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => pathname === path;
  const isActiveGroup = (paths: string[]) => paths.some(path => pathname.startsWith(path));

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside (desktop "More" menu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const nav = document.querySelector('[role="navigation"]');
      if (nav && !nav.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isMobileMenuOpen]);

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      isActive: isActive('/dashboard'),
      description: 'Overview and quick actions',
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      isActive: isActive('/analytics'),
      description: 'Performance insights and trends',
    },
    {
      href: '/missions',
      label: 'Missions',
      icon: Target,
      isActive: isActiveGroup(['/missions']),
      badge: 3,
      description: 'Daily and weekly goals',
    },
    {
      href: '/micro-learning',
      label: 'Micro-Learning',
      icon: Zap,
      isActive: isActive('/micro-learning'),
      description: 'Quick learning sessions',
    },
    {
      href: '/syllabus',
      label: 'Syllabus',
      icon: BookOpen,
      isActive: isActive('/syllabus'),
      description: 'Study material and topics',
    },
    {
      href: '/log/daily',
      label: 'Daily Log',
      icon: Calendar,
      isActive: isActive('/log/daily'),
      description: 'Track daily progress',
    },
    {
      href: '/log/mock',
      label: 'Mock Tests',
      icon: TestTube,
      isActive: isActiveGroup(['/log/mock', '/test-logger']),
      description: 'Practice tests and assessments',
    },
  ];

  const renderNavItem = ({ href, label, icon: Icon, isActive, badge, description }: NavItem) => (
    <Link
      key={href}
      href={href}
      className={cn(
        'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
      aria-label={`${label}: ${description}`}
    >
      <Icon
        className={cn('h-5 w-5 transition-transform duration-200', isActive ? 'text-primary' : 'group-hover:scale-110')}
      />
      <span className="font-medium">{label}</span>
      {badge && (
        <Badge variant={typeof badge === 'number' ? 'default' : 'secondary'} className="h-5 px-1.5 text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  );

  // Group navigation items for better organization
  const primaryNavItems = navItems.slice(0, 4); // Dashboard, Analytics, Missions, Micro-Learning
  const secondaryNavItems = navItems.slice(4); // Syllabus, Daily Log, Mock Tests

  return (
    <nav
      className="glass border-0 border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Simplified */}
          <div className="flex items-center flex-shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1"
              aria-label="Exam Strategy Engine - Go to dashboard"
            >
              <div className="relative flex-shrink-0">
                <Target className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-200" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <span className="text-lg font-bold text-gradient hidden sm:block">
                ESE
              </span>
            </Link>
          </div>

          {/* Primary Navigation - Only show most important items */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {primaryNavItems.map(item => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'relative transition-all duration-200 hover:scale-105',
                    item.isActive ? 'gradient-primary text-white shadow-lg' : 'hover:bg-white/10 hover:text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="xl:hidden">
                    {item.label === 'Micro-Learning' ? 'Micro' : item.label}
                  </span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-xs bg-orange-500 text-white"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Menu - Simplified */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* More Menu for Secondary Items - Desktop */}
            <div className="hidden lg:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-white/10"
              >
                <Menu className="h-4 w-4 mr-1" />
                <span className="hidden xl:inline">More</span>
              </Button>
            </div>

            {/* Notifications - Only show dot when there are actual notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden sm:flex relative h-8 w-8 rounded-full hover:bg-white/10"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {/* Only show notification dot if there are actual notifications - for now hiding it */}
              {false && (
                <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-background" />
              )}
            </Button>

            {/* User Profile - Minimal */}
            <div className="flex items-center space-x-1">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium truncate max-w-24">
                  {user?.displayName?.split(' ')[0] ?? 'User'}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </div>

            {/* Logout - Icon only on smaller screens */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-red-500/10 hover:text-red-500 h-8 w-8 rounded-full hidden sm:flex"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation + Desktop "More" menu */}
        {isMobileMenuOpen && (
          <div className="py-4 space-y-2 border-t border-white/10">
            {/* All nav items for mobile */}
            <div className="lg:hidden space-y-2">
              {navItems.map(renderNavItem)}
            </div>

            {/* Secondary nav items for desktop "More" menu */}
            <div className="hidden lg:block space-y-2">
              {secondaryNavItems.map(renderNavItem)}
            </div>

            {/* Mobile user actions */}
            <div className="lg:hidden pt-4 mt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center space-x-3 px-3 py-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{user?.displayName ?? 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-red-500 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
