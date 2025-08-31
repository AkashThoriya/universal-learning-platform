/**
 * @fileoverview Offline Page for PWA
 *
 * Provides a friendly offline experience when users lose internet connection
 * while navigating the app. Includes offline study features and sync status.
 */

'use client';

import {
  WifiOff,
  RefreshCw,
  BookOpen,
  Clock,
  Trophy,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setIsOnline(navigator.onLine);

    // Get last sync time from localStorage
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);

    if (navigator.onLine) {
      window.location.reload();
    } else {
      // Try to reconnect
      setTimeout(() => {
        if (navigator.onLine) {
          window.location.reload();
        }
      }, 1000);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const offlineFeatures = [
    {
      icon: BookOpen,
      title: 'Cached Content',
      description: 'Access previously viewed study materials and notes',
      available: true,
    },
    {
      icon: Clock,
      title: 'Study Timer',
      description: 'Continue timing your study sessions offline',
      available: true,
    },
    {
      icon: Trophy,
      title: 'Progress Tracking',
      description: "Your progress will sync when you're back online",
      available: true,
    },
    {
      icon: Activity,
      title: 'Analytics',
      description: 'View cached performance data and insights',
      available: true,
    },
  ];

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-900">Back Online!</CardTitle>
            <CardDescription>Your connection has been restored</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoHome} className="w-full">
              Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative">
            <WifiOff className="h-20 w-20 text-slate-400 mx-auto" />
            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">You're Offline</h1>
            <p className="text-slate-600 max-w-md mx-auto">
              No internet connection detected. Don't worry - you can still access many features!
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <Alert className="border-orange-200 bg-orange-50 max-w-2xl mx-auto">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Connection lost • {retryCount > 0 && `Retry attempt ${retryCount} • `}
            {lastSyncTime && `Last sync: ${lastSyncTime.toLocaleTimeString()}`}
          </AlertDescription>
        </Alert>

        {/* Available Features */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Smartphone className="h-5 w-5" />
              Available Offline Features
            </CardTitle>
            <CardDescription>These features work without an internet connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offlineFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-white/50">
                    <div className="flex-shrink-0">
                      <IconComponent className={`h-6 w-6 ${feature.available ? 'text-green-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">{feature.title}</h3>
                        <Badge variant={feature.available ? 'default' : 'secondary'} className="text-xs">
                          {feature.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button onClick={handleRetry} className="flex items-center gap-2" disabled={retryCount >= 5}>
            <RefreshCw className="h-4 w-4" />
            {retryCount >= 5 ? 'Max Retries Reached' : 'Try Again'}
          </Button>

          <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Offline
          </Button>
        </div>

        {/* Tips */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Offline Study Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600">
                Your study progress is automatically saved locally and will sync when you reconnect
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600">
                Previously viewed content remains accessible in your browser cache
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600">Study timers and local features continue to work normally</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>Exam Strategy Engine • Built for offline learning</p>
        </div>
      </div>
    </div>
  );
}
