'use client';

import { motion } from 'framer-motion';
import { Sparkles, LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  badge?: string;
  priority: 'high' | 'medium' | 'low';
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
        <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
        Recommended Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          const ANIMATION_DELAY_INCREMENT = 0.1;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ANIMATION_DELAY_INCREMENT * index }}
            >
              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 h-full"
                onClick={() => (window.location.href = action.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    {action.badge && (
                      <Badge variant={action.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{action.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 group-hover:bg-blue-50 group-hover:border-blue-200"
                    
                  >
                    {action.priority === 'high' ? 'Start Now' : 'Explore'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
