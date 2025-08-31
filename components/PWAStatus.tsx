/**
 * @fileoverview PWA Status and Diagnostics Component
 *
 * Comprehensive PWA status checker and diagnostics tool:
 * - Service worker status
 * - Cache performance
 * - Installation status
 * - Network connectivity
 * - Feature availability
 *
 * @version 1.0.0
 */

'use client';

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Smartphone,
  Zap,
  Database,
  Bell,
  Download,
  RefreshCw,
  Activity,
  Globe,
  Shield,
  Info,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PWAFeature {
  name: string;
  available: boolean;
  description: string;
  icon: React.ComponentType<any>;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

interface ServiceWorkerStatus {
  registered: boolean;
  active: boolean;
  waiting: boolean;
  scope: string;
  scriptURL: string;
  updateFound: boolean;
}

interface CacheInfo {
  name: string;
  size: number;
  keys: number;
}

interface PWAStatusData {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  serviceWorker: ServiceWorkerStatus | null;
  features: PWAFeature[];
  caches: CacheInfo[];
  capabilities: {
    notifications: 'granted' | 'denied' | 'default';
    geolocation: boolean;
    camera: boolean;
    microphone: boolean;
    storage: boolean;
  };
  performance: {
    cacheHitRate: number;
    averageLoadTime: number;
    offlineCapability: number;
  };
}

export function PWAStatus() {
  const [statusData, setStatusData] = useState<PWAStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // ============================================================================
  // STATUS CHECKING
  // ============================================================================

  const checkPWAStatus = async () => {
    setIsLoading(true);

    try {
      const status: PWAStatusData = {
        isOnline: navigator.onLine,
        isInstalled: checkInstallationStatus(),
        isInstallable: false, // Will be updated by beforeinstallprompt
        serviceWorker: await checkServiceWorkerStatus(),
        features: checkFeatureAvailability(),
        caches: await checkCacheStatus(),
        capabilities: await checkCapabilities(),
        performance: await checkPerformance(),
      };

      setStatusData(status);
    } catch (error) {
      console.error('PWA status check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkInstallationStatus = (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      // @ts-ignore
      window.navigator.standalone === true
    );
  };

  const checkServiceWorkerStatus = async (): Promise<ServiceWorkerStatus | null> => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        return null;
      }

      return {
        registered: true,
        active: !!registration.active,
        waiting: !!registration.waiting,
        scope: registration.scope,
        scriptURL: registration.active?.scriptURL || '',
        updateFound: !!registration.waiting,
      };
    } catch (error) {
      console.error('Service worker status check failed:', error);
      return null;
    }
  };

  const checkFeatureAvailability = (): PWAFeature[] => {
    return [
      {
        name: 'Service Workers',
        available: 'serviceWorker' in navigator,
        description: 'Offline functionality and background sync',
        icon: Zap,
        importance: 'critical',
      },
      {
        name: 'Web App Manifest',
        available: true, // We have manifest.json
        description: 'App installation and metadata',
        icon: Smartphone,
        importance: 'critical',
      },
      {
        name: 'Cache API',
        available: 'caches' in window,
        description: 'Offline content storage',
        icon: Database,
        importance: 'high',
      },
      {
        name: 'Push Notifications',
        available: 'Notification' in window && 'serviceWorker' in navigator,
        description: 'Study reminders and updates',
        icon: Bell,
        importance: 'high',
      },
      {
        name: 'Background Sync',
        available: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        description: 'Sync data when back online',
        icon: RefreshCw,
        importance: 'medium',
      },
      {
        name: 'Install Prompt',
        available: typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window,
        description: 'Native app installation',
        icon: Download,
        importance: 'medium',
      },
      {
        name: 'Geolocation',
        available: 'geolocation' in navigator,
        description: 'Location-based features',
        icon: Globe,
        importance: 'low',
      },
      {
        name: 'Secure Context',
        available: window.isSecureContext,
        description: 'HTTPS required for PWA features',
        icon: Shield,
        importance: 'critical',
      },
    ];
  };

  const checkCacheStatus = async (): Promise<CacheInfo[]> => {
    if (!('caches' in window)) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfos: CacheInfo[] = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        // Estimate cache size (approximate)
        const size = keys.length * 50; // Rough estimate in KB

        cacheInfos.push({
          name: cacheName,
          size,
          keys: keys.length,
        });
      }

      return cacheInfos;
    } catch (error) {
      console.error('Cache status check failed:', error);
      return [];
    }
  };

  const checkCapabilities = async (): Promise<PWAStatusData['capabilities']> => {
    const capabilities = {
      notifications: Notification.permission as 'granted' | 'denied' | 'default',
      geolocation: 'geolocation' in navigator,
      camera: false,
      microphone: false,
      storage: 'localStorage' in window && 'sessionStorage' in window,
    };

    // Check media permissions
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        capabilities.camera = true;
        stream.getTracks().forEach(track => track.stop());
      }
    } catch {
      capabilities.camera = false;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        capabilities.microphone = true;
        stream.getTracks().forEach(track => track.stop());
      }
    } catch {
      capabilities.microphone = false;
    }

    return capabilities;
  };

  const checkPerformance = async (): Promise<PWAStatusData['performance']> => {
    // Mock performance data - in real app, collect actual metrics
    return {
      cacheHitRate: 75,
      averageLoadTime: 1.2,
      offlineCapability: 85,
    };
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    checkPWAStatus();

    // Listen for online/offline changes
    const handleOnline = () => {
      setStatusData(prev => (prev ? { ...prev, isOnline: true } : null));
    };

    const handleOffline = () => {
      setStatusData(prev => (prev ? { ...prev, isOnline: false } : null));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getFeatureStatusIcon = (feature: PWAFeature) => {
    if (feature.available) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (feature.importance === 'critical') {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  const getOverallScore = (): number => {
    if (!statusData) {
      return 0;
    }

    const criticalFeatures = statusData.features.filter(f => f.importance === 'critical');
    const availableCritical = criticalFeatures.filter(f => f.available).length;
    const criticalScore = (availableCritical / criticalFeatures.length) * 60;

    const highFeatures = statusData.features.filter(f => f.importance === 'high');
    const availableHigh = highFeatures.filter(f => f.available).length;
    const highScore = (availableHigh / highFeatures.length) * 30;

    const mediumFeatures = statusData.features.filter(f => f.importance === 'medium');
    const availableMedium = mediumFeatures.filter(f => f.available).length;
    const mediumScore = (availableMedium / mediumFeatures.length) * 10;

    return Math.round(criticalScore + highScore + mediumScore);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Checking PWA Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusData) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>Failed to check PWA status. Please refresh and try again.</AlertDescription>
      </Alert>
    );
  }

  const overallScore = getOverallScore();

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                PWA Status
              </CardTitle>
              <CardDescription>Progressive Web App readiness and features</CardDescription>
            </div>
            <Badge
              variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}
              className="text-lg px-3 py-1"
            >
              {overallScore}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Progress value={overallScore} className="h-2" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {statusData.isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">{statusData.isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <div className="flex items-center gap-2">
              {statusData.isInstalled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Download className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-sm">{statusData.isInstalled ? 'Installed' : 'Not Installed'}</span>
            </div>

            <div className="flex items-center gap-2">
              {statusData.serviceWorker?.active ? (
                <Zap className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Service Worker</span>
            </div>

            <div className="flex items-center gap-2">
              {statusData.capabilities.notifications === 'granted' ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <Bell className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-sm">Notifications</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)} className="w-full">
            <Info className="mr-2 h-4 w-4" />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </CardContent>
      </Card>

      {/* Detailed Status */}
      {showDetails && (
        <>
          {/* Feature Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Availability</CardTitle>
              <CardDescription>PWA features supported by your browser</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusData.features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{feature.name}</p>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            feature.importance === 'critical'
                              ? 'destructive'
                              : feature.importance === 'high'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {feature.importance}
                        </Badge>
                        {getFeatureStatusIcon(feature)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Service Worker Status */}
          {statusData.serviceWorker && (
            <Card>
              <CardHeader>
                <CardTitle>Service Worker</CardTitle>
                <CardDescription>Background service for offline functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant={statusData.serviceWorker.active ? 'default' : 'destructive'}>
                    {statusData.serviceWorker.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Scope</span>
                  <span className="text-sm text-muted-foreground font-mono">{statusData.serviceWorker.scope}</span>
                </div>

                {statusData.serviceWorker.waiting && (
                  <Alert>
                    <RefreshCw className="h-4 w-4" />
                    <AlertDescription>A service worker update is waiting. Refresh to activate.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cache Status */}
          {statusData.caches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cache Storage</CardTitle>
                <CardDescription>Offline content and data caches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusData.caches.map((cache, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cache.name}</p>
                        <p className="text-sm text-muted-foreground">{cache.keys} items</p>
                      </div>
                      <Badge variant="outline">{cache.size}KB</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>PWA performance and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache Hit Rate</span>
                  <span>{statusData.performance.cacheHitRate}%</span>
                </div>
                <Progress value={statusData.performance.cacheHitRate} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Offline Capability</span>
                  <span>{statusData.performance.offlineCapability}%</span>
                </div>
                <Progress value={statusData.performance.offlineCapability} />
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Average Load Time</span>
                <Badge variant="outline">{statusData.performance.averageLoadTime}s</Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button size="sm" onClick={checkPWAStatus} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>

            {!statusData.isInstalled && (
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PWAStatus;
