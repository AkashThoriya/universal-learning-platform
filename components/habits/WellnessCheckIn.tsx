'use client';

import { motion } from 'framer-motion';
import { Heart, Zap, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils/utils';

interface WellnessCheckInProps {
  onSubmit: (mood: number, energy: number) => void;
  className?: string;
}

const MOOD_EMOJIS = [
  { value: 1, emoji: '😫', label: 'Rough', color: 'from-red-400 to-red-500' },
  { value: 2, emoji: '😐', label: 'Meh', color: 'from-orange-400 to-orange-500' },
  { value: 3, emoji: '🙂', label: 'Okay', color: 'from-yellow-400 to-yellow-500' },
  { value: 4, emoji: '😊', label: 'Good', color: 'from-green-400 to-green-500' },
  { value: 5, emoji: '🤩', label: 'Great', color: 'from-emerald-400 to-emerald-500' },
];

export function WellnessCheckIn({ onSubmit, className }: WellnessCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedMood === null) return;
    onSubmit(selectedMood, energy);
    setSubmitted(true);

    // Reset after 3 seconds to allow multiple check-ins
    setTimeout(() => {
      setSubmitted(false);
      setSelectedMood(null);
      setEnergy(5);
    }, 3000);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className={cn('items-center justify-center flex flex-col min-h-[200px] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-100 dark:border-green-900', className)}>
          <CardContent className="py-6 text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="h-6 w-6" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Check-in Complete</h3>
              <p className="text-sm text-green-700 dark:text-green-300/80 mt-1">
                Your wellness log has been recorded.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-500">
            <Heart className="h-3.5 w-3.5" />
          </div>
          Daily Wellness Check-in
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-5 pb-5">
        {/* Mood Selector */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">How are you feeling?</label>
          <div className="flex items-center justify-between gap-2">
            {MOOD_EMOJIS.map((item) => (
              <motion.button
                key={item.value}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(item.value)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 flex-1 group',
                  selectedMood === item.value
                    ? 'bg-gradient-to-br ring-2 ring-offset-2 ring-offset-background'
                    : 'hover:bg-muted'
                )}
              >
                {selectedMood === item.value && (
                  <motion.div
                    layoutId="mood-active-bg"
                    className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-10 dark:opacity-20", item.color)}
                  />
                )}
                <span className={cn(
                  "text-2xl transition-transform duration-300",
                  selectedMood === item.value ? "scale-110" : "grayscale-[0.5] group-hover:grayscale-0"
                )}>
                  {item.emoji}
                </span>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  selectedMood === item.value ? "text-foreground" : "text-muted-foreground"
                )}>{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Energy Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              Energy Level
            </span>
            <span className="font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px]">
              {energy}/10
            </span>
          </div>
          <div className="relative pt-1 px-1">
            <Slider
              value={[energy]}
              onValueChange={([v]) => setEnergy(v ?? 5)}
              min={1}
              max={10}
              step={1}
              className="w-full cursor-grab active:cursor-grabbing [&>span:first-child]:h-2 [&>span:first-child]:bg-slate-100 dark:[&>span:first-child]:bg-slate-800 [&>span:last-child]:bg-gradient-to-r [&>span:last-child]:from-yellow-400 [&>span:last-child]:to-orange-500 [&>span:last-child]:rounded-full"
            />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-0.5">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>

        <Button
          className={cn(
            "w-full h-9 text-xs font-semibold shadow-sm transition-all duration-300",
            selectedMood !== null
              ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              : "opacity-50 cursor-not-allowed"
          )}
          onClick={handleSubmit}
          disabled={selectedMood === null}
        >
          Save Check-in
        </Button>
      </CardContent>
    </Card>
  );
}
