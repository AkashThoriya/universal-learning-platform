/**
 * @fileoverview PWA Registration and Management Component
 *
 * Handles service worker registration, updates, and PWA features:
 * - Service worker registration and updates
 * - Install prompt management
 * - Offline detection and sync
 * - Push notification setup
 * - Cache management
 *
 * @version 1.0.0
 */

'use client';

import { Download, Wifi, WifiOff, RefreshCw, Bell, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  platforms: string[];
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Interface for Service Worker Registration with Background Sync
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  isRegistered: boolean;
  notificationsEnabled: boolean;
  syncPending: boolean;
}

interface CacheStatus {
  [cacheName: string]: number;
}

export function PWAManager() {
  const { toast } = useToast();
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    hasUpdate: false,
    isRegistered: false,
    notificationsEnabled: false,
    syncPending: false,
  });

  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({});
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // SERVICE WORKER REGISTRATION
  // ============================================================================

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      // console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      // console.log('Service Worker registered:', registration);

      setPwaState(prev => ({ ...prev, isRegistered: true }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setPwaState(prev => ({ ...prev, hasUpdate: true }));

              toast({
                title: 'App Update Available',
                description: 'A new version is ready to install.',
                action: (
                  <Button size="sm" onClick={() => handleServiceWorkerUpdate(registration)} className="shrink-0">
                    Update
                  </Button>
                ),
              });
            }
          });
        }
      });

      // Listen to service worker messages
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // Check cache status
      await updateCacheStatus();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      toast({
        title: 'Setup Error',
        description: 'Failed to initialize offline features.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // ============================================================================
  // INSTALL PROMPT HANDLING
  // ============================================================================

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPrompt(promptEvent);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setPwaState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));

      toast({
        title: 'App Installed!',
        description: 'Universal Learning Platform is now installed on your device.',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallApp = async () => {
    if (!installPrompt) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await installPrompt.prompt();

      if (result.outcome === 'accepted') {
        toast({
          title: 'Installing App',
          description: 'The app is being installed to your device.',
        });
      }

      setInstallPrompt(null);
      setPwaState(prev => ({ ...prev, isInstallable: false }));
    } catch (error) {
      console.error('Install prompt failed:', error);
      toast({
        title: 'Install Failed',
        description: 'Could not install the app. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // ONLINE/OFFLINE DETECTION
  // ============================================================================

  useEffect(() => {
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }));
      toast({
        title: 'Back Online',
        description: 'Connection restored. Syncing data...',
      });

      // Trigger background sync
      triggerBackgroundSync();
    };

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "You're Offline",
        description: "Don't worry! You can continue using the app offline.",
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial state
    setPwaState(prev => ({ ...prev, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // ============================================================================
  // NOTIFICATION HANDLING
  // ============================================================================

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notifications Not Supported',
        description: "Your browser doesn't support notifications.",
        variant: 'destructive',
      });
      return;
    }

    if (Notification.permission === 'granted') {
      setPwaState(prev => ({ ...prev, notificationsEnabled: true }));
      return;
    }

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        setPwaState(prev => ({ ...prev, notificationsEnabled: true }));

        // Subscribe to push notifications
        await subscribeToPushNotifications();

        toast({
          title: 'Notifications Enabled',
          description: "You'll receive study reminders and updates.",
        });
      } else {
        toast({
          title: 'Notifications Blocked',
          description: 'Enable notifications in your browser settings for the best experience.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Notification permission failed:', error);
      toast({
        title: 'Permission Error',
        description: 'Failed to enable notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Replace with your VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        // console.warn('VAPID public key not configured');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Send subscription to your server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  // ============================================================================
  // SERVICE WORKER UPDATES
  // ============================================================================

  const handleServiceWorkerUpdate = async (registration: ServiceWorkerRegistration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        toast({
          title: 'Data Updated',
          description: 'Fresh content is now available.',
        });
        break;

      case 'SYNC_COMPLETE':
        setPwaState(prev => ({ ...prev, syncPending: false }));
        toast({
          title: 'Sync Complete',
          description: `${data} data has been synchronized.`,
        });
        break;

      case 'NAVIGATE':
        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        }
        break;

      default:
      // console.log('Unknown service worker message:', type);
    }
  };

  // ============================================================================
  // BACKGROUND SYNC
  // ============================================================================

  const triggerBackgroundSync = async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Type assertion for background sync support
        const syncRegistration = registration as ServiceWorkerRegistrationWithSync;

        await Promise.all([
          syncRegistration.sync.register('background-sync-missions'),
          syncRegistration.sync.register('background-sync-progress'),
          syncRegistration.sync.register('background-sync-analytics'),
        ]);

        setPwaState(prev => ({ ...prev, syncPending: true }));
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  };

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  const updateCacheStatus = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        if (registration.active) {
          const messageChannel = new MessageChannel();

          registration.active.postMessage({ type: 'GET_CACHE_STATUS' }, [messageChannel.port2]);

          messageChannel.port1.onmessage = event => {
            setCacheStatus(event.data);
          };
        }
      } catch (error) {
        console.error('Failed to get cache status:', error);
      }
    }
  };

  const clearAllCaches = async () => {
    setIsLoading(true);

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      setCacheStatus({});

      toast({
        title: 'Caches Cleared',
        description: 'All cached data has been removed.',
      });

      // Re-register service worker
      await registerServiceWorker();
    } catch (error) {
      console.error('Failed to clear caches:', error);
      toast({
        title: 'Clear Failed',
        description: 'Could not clear all caches.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    registerServiceWorker();

    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaState(prev => ({ ...prev, isInstalled: true }));
    }

    // Check notification permission
    if ('Notification' in window && Notification.permission === 'granted') {
      setPwaState(prev => ({ ...prev, notificationsEnabled: true }));
    }
  }, [registerServiceWorker]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={pwaState.isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        {pwaState.isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
        <AlertDescription className={pwaState.isOnline ? 'text-green-800' : 'text-red-800'}>
          {pwaState.isOnline ? 'Connected' : 'Offline - Some features may not be available'}
          {pwaState.syncPending && ' • Syncing data...'}
        </AlertDescription>
      </Alert>

      {/* Install Prompt */}
      {pwaState.isInstallable && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Install App</CardTitle>
            </div>
            <CardDescription className="text-blue-700">
              Install Universal Learning Platform for faster access and offline study
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInstallApp} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Install App
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PWA Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            App Status
          </CardTitle>
          <CardDescription>Progressive Web App features and capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Service Worker</span>
            <Badge variant={pwaState.isRegistered ? 'default' : 'destructive'}>
              {pwaState.isRegistered ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>App Installed</span>
            <Badge variant={pwaState.isInstalled ? 'default' : 'secondary'}>
              {pwaState.isInstalled ? 'Yes' : 'No'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              <Badge variant={pwaState.notificationsEnabled ? 'default' : 'secondary'}>
                {pwaState.notificationsEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {!pwaState.notificationsEnabled && (
                <Button size="sm" variant="outline" onClick={requestNotificationPermission} disabled={isLoading}>
                  <Bell className="mr-1 h-3 w-3" />
                  Enable
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>Updates Available</span>
            <Badge variant={pwaState.hasUpdate ? 'destructive' : 'default'}>
              {pwaState.hasUpdate ? 'Yes' : 'Up to date'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>Manage offline data and storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(cacheStatus).map(([cacheName, count]) => (
            <div key={cacheName} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{cacheName}</span>
              <Badge variant="outline">{count} items</Badge>
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={updateCacheStatus} disabled={isLoading}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={clearAllCaches} disabled={isLoading}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PWAManager;
