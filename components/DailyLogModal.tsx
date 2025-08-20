'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Zap, Moon, Star } from 'lucide-react';
import { format } from 'date-fns';

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyLogModal({ isOpen, onClose }: DailyLogModalProps) {
  const { user } = useAuth();
  const [energyLevel, setEnergyLevel] = useState([7]);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState([7]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logData = {
        logId: today,
        date: Timestamp.now(),
        energyLevel: energyLevel[0],
        sleepHours,
        sleepQuality: sleepQuality[0],
        tasksCompleted: [],
        bufferUsed: false,
        note,
      };

      await setDoc(doc(db, 'users', user.uid, 'dailyLogs', today), logData);
      onClose();
    } catch (error) {
      console.error('Error saving daily log:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Daily Energy Log</span>
          </DialogTitle>
          <DialogDescription>
            Track your daily energy and sleep for better preparation insights
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Energy Level</label>
                <span className="text-sm text-muted-foreground">{energyLevel[0]}/10</span>
              </div>
              <Slider
                value={energyLevel}
                onValueChange={setEnergyLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Moon className="h-4 w-4 text-blue-500" />
                <label className="text-sm font-medium">Sleep Hours</label>
              </div>
              <Input
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                placeholder="Hours of sleep"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <label className="text-sm font-medium">Sleep Quality</label>
                </div>
                <span className="text-sm text-muted-foreground">{sleepQuality[0]}/10</span>
              </div>
              <Slider
                value={sleepQuality}
                onValueChange={setSleepQuality}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any thoughts about today's preparation..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}