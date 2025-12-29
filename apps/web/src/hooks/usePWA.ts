import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Service worker registration with auto-update
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registered:', swUrl);
      // Check for updates periodically
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      }
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = ('standalone' in window.navigator) && (window.navigator as { standalone?: boolean }).standalone;
      setIsInstalled(isStandalone || !!isIOSStandalone);
    };

    checkInstalled();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install the app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Dismiss update prompt
  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  // Apply update
  const applyUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    needRefresh,
    installApp,
    applyUpdate,
    dismissUpdate,
  };
}

// Offline detection hook for specific features
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
