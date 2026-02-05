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

import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Home,
  BookOpen,
  Target,
  Calendar,
  Menu,
  Brain,

  Sparkles,
  AlertTriangle,
  type LucideIcon,
  User,
  Layout,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: string | number;
  description?: string;
}

const MotivationalRotator = () => {
  const [index, setIndex] = useState(0);
  const messages = [
    'Focus on progress ⚡',
    'You got this! 🚀',
    'Stay consistent 💎',
    'Trust the process 🌱',
    'Dream big 🌟',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % messages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-6 relative w-full max-w-[200px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="absolute text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          {messages[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function Navigation() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const nav = document.querySelector('[role="navigation"]');
      if (nav && !nav.contains(event.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
    };

    if (isDesktopMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isDesktopMenuOpen]);

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

  const navItems: NavItem[] = [
    // Primary nav (visible in main nav bar)
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      isActive: isActive('/dashboard'),
      description: 'Overview and quick actions',
    },
    {
      href: '/review',
      label: 'Concept Review',
      icon: AlertTriangle,
      isActive: isActive('/review'),
      description: 'Topics and subtopics due for revision',
    },
    {
      href: '/test',
      label: 'Adaptive Testing',
      icon: Brain,
      isActive: isActiveGroup(['/test']),
      description: 'Intelligent personalized assessments',
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
      href: '/workspace',
      label: 'Workspace',
      icon: Layout,
      isActive: isActive('/workspace'),
      description: 'Your personal study space',
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
      <Icon className={cn('h-5 w-5 transition-transform duration-200', isActive ? 'text-primary' : '')} />
      <span className="font-medium">{label}</span>
      {badge && (
        <Badge variant={typeof badge === 'number' ? 'default' : 'secondary'} className="h-5 px-1.5 text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  );

  // Group navigation items for better organization
  const primaryNavItems = navItems.slice(0, 4); // Dashboard, Analytics, Adaptive Testing, Journey Planning
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
                <Target className="h-7 w-7 text-primary transition-transform duration-200" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <span className="text-lg font-bold text-gradient hidden sm:block">ESE</span>
            </Link>
          </div>

          {/* Primary Navigation - Only show most important items */}
          <div className="hidden xl:flex items-center space-x-1 flex-1 justify-center">
            {primaryNavItems.map(item => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'relative transition-all duration-200 hover:-translate-y-0.5',
                    item.isActive ? 'gradient-primary text-white shadow-lg' : 'hover:bg-white/10 hover:text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="xl:hidden">{item.label === 'Adaptive Testing' ? 'Testing' : item.label}</span>
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

          {/* Mobile/Tablet Motivational Text (Hidden on XL) */}
          <div className="flex xl:hidden flex-1 justify-center items-center px-4 overflow-hidden h-16">
            <MotivationalRotator />
          </div>

          {/* User Menu - Redesigned for better UX */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Notifications - Always visible */}

            {/* More Menu - Desktop (contains secondary items + user actions) */}
            <div className="hidden xl:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                className="hover:bg-white/10 flex items-center space-x-1"
              >
                <span className="text-sm font-medium max-w-20 truncate">
                  {user?.displayName?.split(' ')[0] ?? 'Menu'}
                </span>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop "More" menu dropdown - Revamped */}
        {isDesktopMenuOpen && (
          <div className="hidden xl:block absolute top-16 right-4 w-72 bg-white dark:bg-gray-900 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User Header */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
              {secondaryNavItems.map(renderNavItem)}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Account Section */}
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
              <Link href="/profile" onClick={() => setIsDesktopMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Settings</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
              >
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
