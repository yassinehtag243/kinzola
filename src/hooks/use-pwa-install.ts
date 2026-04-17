'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Hook pour capturer l'événement beforeinstallprompt et
 * fournir un bouton d'installation PWA personnalisé.
 *
 * Fonctionne sur Android Chrome, Edge, Opera...
 * iOS Safari n'emit pas cet événement (installation via le bouton de partage).
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Vérifier si l'utilisateur a déjà fermé le banner
    const wasDismissed = localStorage.getItem('kinzola-pwa-dismissed');
    const dismissedAt = wasDismissed ? parseInt(wasDismissed, 10) : 0;
    // Ne pas montrer le banner pendant 7 jours après dismissal
    if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    // Capturer le beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Écouter l'installation réussie
    const installedHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.removeItem('kinzola-pwa-dismissed');
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);

    if (outcome === 'accepted') {
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsInstallable(false);
    setDismissed(true);
    localStorage.setItem('kinzola-pwa-dismissed', String(Date.now()));
  }, []);

  return {
    isInstallable: isInstallable && !dismissed && !isInstalled,
    isInstalled,
    install,
    dismiss,
  };
}
