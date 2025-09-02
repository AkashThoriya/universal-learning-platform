/**
 * @fileoverview PWA Install Hook
 *
 * Custom React hook for managing PWA installation:
 * - Install prompt detection
 * - Installation state management
 * - User engagement tracking
 * - Platform-specific install guidance
 *
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@/hooks/use-toast';
import { TIME_CONSTANTS } from '@/lib/constants';

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  showInstallPrompt: boolean;
  canInstall: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  installMethod: 'automatic' | 'manual' | 'unsupported';
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface InstallationResult {
  success: boolean;
  outcome?: 'accepted' | 'dismissed';
  error?: string;
}

export function usePWAInstall() {
  const { toast } = useToast();

  const [installState, setInstallState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    showInstallPrompt: false,
    canInstall: false,
    installPromptEvent: null,
    platform: 'unknown',
    installMethod: 'unsupported',
  });

  // ============================================================================
  // PLATFORM DETECTION
  // ============================================================================

  const detectPlatform = useCallback((): PWAInstallState['platform'] => {
    if (typeof window === 'undefined') {
      return 'unknown';
    }

    const { userAgent } = window.navigator;

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    }
    if (/Android/.test(userAgent)) {
      return 'android';
    }
    if (/Windows|Mac|Linux/.test(userAgent)) {
      return 'desktop';
    }

    return 'unknown';
  }, []);

  const getInstallMethod = useCallback((platform: PWAInstallState['platform']): PWAInstallState['installMethod'] => {
    switch (platform) {
      case 'android':
      case 'desktop':
        return 'automatic'; // beforeinstallprompt supported
      case 'ios':
        return 'manual'; // Manual install via Safari
      default:
        return 'unsupported';
    }
  }, []);

  // ============================================================================
  // INSTALLATION STATE DETECTION
  // ============================================================================

  const checkInstallationState = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      // @ts-ignore
      window.navigator.standalone === true;

    setInstallState(prev => ({
      ...prev,
      isInstalled,
    }));
  }, []);

  // ============================================================================
  // INSTALL PROMPT HANDLING
  // ============================================================================

  const handleBeforeInstallPrompt = useCallback((event: Event) => {
    const installEvent = event as BeforeInstallPromptEvent;
    // Prevent the mini-infobar from appearing on mobile
    installEvent.preventDefault();

    setInstallState(prev => ({
      ...prev,
      isInstallable: true,
      canInstall: true,
      installPromptEvent: installEvent,
      showInstallPrompt: true,
    }));

    // console.log('PWA install prompt available');
  }, []);

  const handleAppInstalled = useCallback(() => {
    setInstallState(prev => ({
      ...prev,
      isInstalled: true,
      isInstallable: false,
      showInstallPrompt: false,
      installPromptEvent: null,
    }));

    toast({
      title: 'App Installed Successfully! 🎉',
      description: 'Exam Strategy Engine is now available on your home screen.',
    });

    // Track installation
    trackInstallation('success');
  }, [toast]);

  // ============================================================================
  // INSTALLATION FUNCTIONS
  // ============================================================================

  const promptInstall = useCallback(async (): Promise<InstallationResult> => {
    if (!installState.installPromptEvent) {
      return {
        success: false,
        error: 'No install prompt available',
      };
    }

    try {
      // Show the install prompt
      await installState.installPromptEvent.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await installState.installPromptEvent.userChoice;

      setInstallState(prev => ({
        ...prev,
        installPromptEvent: null,
        showInstallPrompt: false,
      }));

      const result: InstallationResult = {
        success: choiceResult.outcome === 'accepted',
        outcome: choiceResult.outcome,
      };

      if (result.success) {
        toast({
          title: 'Installing App...',
          description: 'The app is being added to your device.',
        });

        trackInstallation('prompt_accepted');
      } else {
        trackInstallation('prompt_dismissed');
      }

      return result;
    } catch (error) {
      console.error('Install prompt failed:', error);

      setInstallState(prev => ({
        ...prev,
        installPromptEvent: null,
        showInstallPrompt: false,
      }));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Install failed',
      };
    }
  }, [installState.installPromptEvent, toast]);

  const dismissInstallPrompt = useCallback(() => {
    setInstallState(prev => ({
      ...prev,
      showInstallPrompt: false,
    }));
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_install_dismissed', 'true');
    }
  }, []);

  // ============================================================================
  // MANUAL INSTALL GUIDANCE
  // ============================================================================

  const getManualInstallInstructions = useCallback(() => {
    const { platform } = installState;

    switch (platform) {
      case 'ios':
        return {
          title: 'Install on iOS',
          steps: [
            'Tap the Share button in Safari',
            "Scroll down and tap 'Add to Home Screen'",
            "Tap 'Add' in the top right corner",
            'The app will appear on your home screen',
          ],
          icon: '📱',
        };

      case 'android':
        return {
          title: 'Install on Android',
          steps: [
            'Tap the menu (⋮) in your browser',
            "Select 'Add to Home screen' or 'Install app'",
            "Confirm by tapping 'Add' or 'Install'",
            'The app will appear in your app drawer',
          ],
          icon: '🤖',
        };

      case 'desktop':
        return {
          title: 'Install on Desktop',
          steps: [
            'Look for the install icon (⊕) in your address bar',
            'Click the install button',
            'Confirm installation in the popup',
            'The app will open in its own window',
          ],
          icon: '🖥️',
        };

      default:
        return {
          title: 'Installation Not Available',
          steps: [
            "Your browser doesn't support PWA installation",
            'You can still bookmark this page for quick access',
            'Consider using Chrome, Edge, or Safari for the best experience',
          ],
          icon: '❌',
        };
    }
  }, [installState.platform]);

  // ============================================================================
  // ANALYTICS & TRACKING
  // ============================================================================

  const trackInstallation = useCallback(
    (action: string) => {
      try {
        // Track with your analytics service
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as Window & { gtag: (event: string, action: string, params: Record<string, unknown>) => void }).gtag('event', 'pwa_install', {
            action,
            platform: installState.platform,
            timestamp: new Date().toISOString(),
          });
        }

        // Log to console for development
        // console.log('PWA Install Event:', { action, platform: installState.platform });
      } catch (error) {
        console.error('Failed to track installation:', error);
      }
    },
    [installState.platform]
  );

  // ============================================================================
  // ENGAGEMENT FEATURES
  // ============================================================================

  const shouldShowInstallPrompt = useCallback(() => {
    // Don't show if already installed or dismissed this session
    if (
      installState.isInstalled ||
      (typeof window !== 'undefined' && sessionStorage.getItem('pwa_install_dismissed'))
    ) {
      return false;
    }

    // Don't show immediately - wait for user engagement
    const pageLoadTime = typeof window !== 'undefined' ? sessionStorage.getItem('page_load_time') : null;
    if (pageLoadTime) {
      const timeOnPage = Date.now() - parseInt(pageLoadTime);
      if (timeOnPage < TIME_CONSTANTS.PWA_INSTALL_TIMEOUT) {
        // Wait at least 30 seconds
        return false;
      }
    }

    // Check if user has visited multiple pages
    // Check engagement metrics
    const pageCount = typeof window !== 'undefined' ? parseInt(sessionStorage.getItem('page_count') ?? '0') : 0;
    if (pageCount < 2) {
      return false;
    }

    return installState.canInstall && installState.showInstallPrompt;
  }, [installState]);

  const trackPageVisit = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentCount = parseInt(sessionStorage.getItem('page_count') ?? '0');
    sessionStorage.setItem('page_count', (currentCount + 1).toString());

    if (!sessionStorage.getItem('page_load_time')) {
      sessionStorage.setItem('page_load_time', Date.now().toString());
    }
  }, []);

  // ============================================================================
  // EFFECT HOOKS
  // ============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const platform = detectPlatform();
    const installMethod = getInstallMethod(platform);

    setInstallState(prev => ({
      ...prev,
      platform,
      installMethod,
    }));

    // Check initial installation state
    checkInstallationState();

    // Track page visit for engagement
    trackPageVisit();

    // Set up event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkInstallationState();
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [
    detectPlatform,
    getInstallMethod,
    checkInstallationState,
    trackPageVisit,
    handleBeforeInstallPrompt,
    handleAppInstalled,
  ]);

  // ============================================================================
  // RETURN HOOK API
  // ============================================================================

  return {
    // State
    ...installState,
    shouldShowPrompt: shouldShowInstallPrompt(),

    // Actions
    promptInstall,
    dismissInstallPrompt,

    // Utilities
    getManualInstallInstructions,
    trackPageVisit,

    // Helpers
    isSupported: installState.installMethod !== 'unsupported',
    canAutoInstall: installState.installMethod === 'automatic',
    needsManualInstall: installState.installMethod === 'manual',
  };
}

export default usePWAInstall;
