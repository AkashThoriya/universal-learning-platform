/**
 * @fileoverview PWA Install Banner Component
 *
 * Smart install banner that appears at the optimal time to encourage PWA installation:
 * - Engagement-based timing
 * - Platform-specific instructions
 * - Beautiful animations and design
 * - Dismissible with preferences
 *
 * @version 1.0.0
 */

'use client';

import { X, Download, Smartphone, Monitor, Rocket, ChevronRight, Share, Plus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { PWA_BENEFITS } from '@/lib/data/ui-content';

interface PWAInstallBannerProps {
  variant?: 'banner' | 'modal' | 'inline';
  autoShow?: boolean;
  showBenefits?: boolean;
  className?: string;
}

export function PWAInstallBanner({ variant = 'banner', showBenefits = true, className = '' }: PWAInstallBannerProps) {
  const {
    isInstalled,
    canAutoInstall,
    needsManualInstall,
    platform,
    promptInstall,
    dismissInstallPrompt,
    resetInstallPrompt,
    getManualInstallInstructions,
  } = usePWAInstall();

  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    if (canAutoInstall) {
      setIsInstalling(true);
      try {
        const result = await promptInstall();
        if (result.success) {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Install failed:', error);
      } finally {
        setIsInstalling(false);
      }
    } else if (needsManualInstall) {
      setShowInstructions(true);
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissInstallPrompt();
  };

  const handleDebugReset = () => {
    resetInstallPrompt();
  };

  const instructions = getManualInstallInstructions();

  // Banner variant
  if (variant === 'banner' && isVisible) {
    return (
      <div className={`fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top duration-500 ${className}`}>
        <Alert className="border-blue-200 bg-blue-50 shadow-lg">
          <Download className="h-4 w-4 text-blue-600" />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <AlertDescription className="text-blue-800 font-medium">
                🚀 Get faster access and study offline - Install our app!
              </AlertDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-blue-600 hover:text-blue-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Modal variant
  if (variant === 'modal' && isVisible) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
        <Card className="w-full max-w-lg animate-in zoom-in-95 duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100">
              {platform === 'ios' ? (
                <Smartphone className="h-6 w-6 text-blue-600" />
              ) : platform === 'desktop' ? (
                <Monitor className="h-6 w-6 text-blue-600" />
              ) : (
                <Download className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <CardTitle className="text-xl">Install Our App</CardTitle>
            <CardDescription>Get the best experience with our Progressive Web App</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {showBenefits && (
              <div className="grid grid-cols-2 gap-4">
                {PWA_BENEFITS.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div key={index} className="text-center p-3 rounded-lg bg-gray-50">
                      <IconComponent className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium text-sm">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {showInstructions && needsManualInstall && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{instructions.icon}</span>
                  <h3 className="font-semibold">{instructions.title}</h3>
                </div>
                <ol className="space-y-2">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5 min-w-[24px] h-6 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex gap-3">
              {canAutoInstall ? (
                <Button onClick={handleInstall} disabled={isInstalling} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  {isInstalling ? 'Installing...' : 'Install Now'}
                </Button>
              ) : (
                <Button onClick={() => setShowInstructions(!showInstructions)} className="flex-1">
                  <Rocket className="mr-2 h-4 w-4" />
                  Show Instructions
                </Button>
              )}

              <Button variant="outline" onClick={handleDismiss}>
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Inline variant
  if (variant === 'inline' && isVisible) {
    return (
      <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-blue-900">📱 Install Our App</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Get instant access, study offline, and receive smart notifications on your home screen.
                </p>
              </div>

              {showBenefits && (
                <div className="flex flex-wrap gap-2">
                  {PWA_BENEFITS.slice(0, 2).map((benefit, index) => {
                    const IconComponent = benefit.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full"
                      >
                        <IconComponent className="h-3 w-3" />
                        {benefit.title}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {canAutoInstall ? (
                    <>
                      <Download className="mr-1 h-3 w-3" />
                      Install
                    </>
                  ) : (
                    <>
                      <Share className="mr-1 h-3 w-3" />
                      Install Guide
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDebugReset}
                  className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                  title="Debug: Reset PWA state"
                >
                  Reset
                </Button>

                <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-blue-600 hover:text-blue-700">
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

// Platform-specific install guides
export function IOSInstallGuide() {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Smartphone className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="space-y-2">
          <p className="font-medium">Install on iOS:</p>
          <ol className="text-sm space-y-1 ml-4">
            <li className="flex items-center gap-2">
              <Share className="h-3 w-3" />
              Tap the Share button below
            </li>
            <li className="flex items-center gap-2">
              <Plus className="h-3 w-3" />
              Select "Add to Home Screen"
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" />
              Tap "Add" to confirm
            </li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function AndroidInstallGuide() {
  return (
    <Alert className="border-green-200 bg-green-50">
      <Smartphone className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="space-y-2">
          <p className="font-medium">Install on Android:</p>
          <ol className="text-sm space-y-1 ml-4">
            <li className="flex items-center gap-2">
              <MoreHorizontal className="h-3 w-3" />
              Tap the menu (⋮) in your browser
            </li>
            <li className="flex items-center gap-2">
              <Download className="h-3 w-3" />
              Select "Add to Home screen"
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3" />
              Tap "Add" to confirm
            </li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default PWAInstallBanner;
