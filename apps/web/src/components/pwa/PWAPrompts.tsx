import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePWA } from '../../hooks/usePWA';

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsDismissed(true);
    }
  };

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
      <div className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
            <ArrowDownTrayIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Instalar Dinheiro</h3>
            <p className="mt-1 text-sm text-gray-500">
              Instale o app para acesso rapido e funcionalidades offline
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="btn-primary py-2 text-sm"
              >
                Instalar
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="btn-secondary py-2 text-sm"
              >
                Agora nao
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function UpdatePrompt() {
  const { needRefresh, applyUpdate, dismissUpdate } = usePWA();

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
      <div className="rounded-xl bg-primary-600 p-4 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
            <ArrowPathIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Atualizacao disponivel</h3>
            <p className="mt-1 text-sm text-primary-100">
              Uma nova versao do Dinheiro esta disponivel
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={applyUpdate}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                Atualizar agora
              </button>
              <button
                type="button"
                onClick={dismissUpdate}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-400"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfflineBanner() {
  const { isOnline } = usePWA();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else {
      // Hide banner after a short delay when back online
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isOnline ? 'bg-success-500' : 'bg-warning-500'
      }`}
    >
      <div className="px-4 py-2 text-center text-sm font-medium text-white">
        {isOnline ? (
          'Conexao restaurada!'
        ) : (
          'Voce esta offline. Algumas funcionalidades podem estar limitadas.'
        )}
      </div>
    </div>
  );
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InstallPrompt />
      <UpdatePrompt />
      <OfflineBanner />
    </>
  );
}
