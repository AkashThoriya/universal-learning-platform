'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import Link from 'next/link';


import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HabitDocument } from '@/types/habit';

interface HistoryLayoutProps {
  habit: HabitDocument;
  children: React.ReactNode;
}

export function HistoryLayout({ habit, children }: HistoryLayoutProps) {


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-20">
      {/* Sticky Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full -ml-2"
              asChild
            >
              <Link href="/habits">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none flex items-center gap-2">
                {habit.title}
                {habit.type === 'SYSTEM' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium uppercase tracking-wide">
                    System
                  </span>
                )}
              </h1>
              <span className="text-xs text-muted-foreground mt-0.5">
                History & Analytics
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={habit.type === 'SYSTEM'}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Habit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {children}
      </main>
    </div>
  );
}
