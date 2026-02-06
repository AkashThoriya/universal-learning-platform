'use client';

/**
 * @fileoverview Bottom Navigation Component
 *
 * Mobile-first bottom navigation bar with glassmorphism design.
 * Features 4 primary quick-access tabs and a "More" drawer for secondary items.
 * Handles active states, routing, and user actions.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  Home,
  Brain,

  Menu,
  BookOpen,
  Calendar,
  LogOut,
  User,
  Settings,
  HelpCircle,
  AlertTriangle,
  Layout,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { CourseSwitcher } from '@/components/courses';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils/utils';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  // Primary items shown in bottom bar: Dashboard, Concept Review, Test (3 items only for cleaner mobile UI)
  const primaryItems = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      activePath: '/dashboard',
    },
    {
      href: '/review',
      label: 'Review',
      icon: <AlertTriangle className="h-5 w-5" />,
      activePath: '/review',
    },
    {
      href: '/test',
      label: 'Test',
      icon: <Brain className="h-5 w-5" />,
      activePath: '/test',
    },
  ];

  // Secondary items in the "More" drawer
  const secondaryItems = [

    {
      href: '/syllabus',
      label: 'Syllabus',
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      description: 'Study materials and topics',
    },
    {
      href: '/log/daily',
      label: 'Daily Log',
      icon: <Calendar className="h-5 w-5 text-green-500" />,
      description: 'Track your daily progress',
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: <User className="h-5 w-5 text-purple-500" />,
      description: 'Manage settings & preferences',
    },
    {
      href: '/workspace',
      label: 'Workspace',
      icon: <Layout className="h-5 w-5 text-orange-500" />,
      description: 'Personal study space',
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const onNavClick = (href: string) => {
    if (href === pathname) {
      return;
    }
    // Drawer automatically closes when navigating if Link is used,
    // but explicit state management can ensure it behaves correctly
    setIsOpen(false);
  };

  return (
    <div className="xl:hidden fixed bottom-0 left-0 w-full z-50">
      {/* Glassmorphism Container */}
      <nav className="glass border-t border-white/20 bg-white/80 dark:bg-black/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
          {primaryItems.map(item => {
            const active = isActive(item.activePath || item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn('p-1.5 rounded-xl transition-all', active && 'bg-primary/10')}>{item.icon}</div>
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}

          {/* More Drawer Trigger */}
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95 text-muted-foreground hover:text-foreground',
                  isOpen && 'text-primary'
                )}
              >
                <div className={cn('p-1.5 rounded-xl transition-all', isOpen && 'bg-primary/10')}>
                  <Menu className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium leading-none">More</span>
              </button>
            </DrawerTrigger>

            <DrawerContent className="max-h-[85vh]">
              <div className="mx-auto w-full max-w-md">
                <DrawerHeader>
                  <DrawerTitle className="text-center">Menu</DrawerTitle>
                  <DrawerDescription className="text-center">Access all features and settings</DrawerDescription>
                </DrawerHeader>

                <ScrollArea className="p-4 h-full overflow-y-auto">
                  {/* User Profile Snippet */}
                  <div className="mb-4 bg-secondary/30 rounded-xl p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user?.displayName || 'Student'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild onClick={() => setIsOpen(false)}>
                      <Link href="/profile">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </Button>
                  </div>

                  {/* Course Switcher - Compact variant for mobile */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                      Active Course
                    </h4>
                    <CourseSwitcher variant="compact" showAddCourse={false} className="w-full justify-start" />
                  </div>

                  <div className="space-y-6">
                    {/* Secondary Navigation */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Learning Tools
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {secondaryItems.map(item => (
                          <Link key={item.href} href={item.href} onClick={() => onNavClick(item.href)}>
                            <div className="flex items-center p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50">
                              <div className="p-2 rounded-md bg-background shadow-sm mr-4">{item.icon}</div>
                              <div>
                                <p className="font-medium text-sm">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Support & Logout */}
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3" asChild>
                        <Link href="/help">
                          <HelpCircle className="h-5 w-5 text-muted-foreground" />
                          <span>Help & Support</span>
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                </ScrollArea>

                <DrawerFooter className="pt-2">
                  <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </nav>
    </div>
  );
}
