'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, BookOpen, Target, X, LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface FloatingAction {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

interface FloatingActionButtonProps {
  className?: string;
}

export default function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: FloatingAction[] = [
    {
      icon: Zap,
      label: 'Plan Journey',
      href: '/journey',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      priority: 'high',
    },
    {
      icon: BookOpen,
      label: 'Study Materials',
      href: '/syllabus',
      color: 'bg-blue-500 hover:bg-blue-600',
      priority: 'medium',
    },
    {
      icon: Target,
      label: 'Take Test',
      href: '/test',
      color: 'bg-purple-500 hover:bg-purple-600',
      priority: 'high',
    },
  ];

  const handleActionClick = (href: string) => {
    setIsOpen(false);
    window.location.href = href;
  };

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actions.map((action, index) => {
              const IconComponent = action.icon;
              const ANIMATION_DELAY_INCREMENT = 0.1;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ delay: index * ANIMATION_DELAY_INCREMENT }}
                  className="flex items-center space-x-3"
                >
                  <span className="bg-black/80 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
                    {action.label}
                  </span>
                  <Button
                    size="sm"
                    className={cn('w-12 h-12 rounded-full shadow-lg text-white', action.color)}
                    onClick={() => handleActionClick(action.href)}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="lg"
          className={cn(
            'w-14 h-14 rounded-full shadow-xl',
            isOpen
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="h-6 w-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
