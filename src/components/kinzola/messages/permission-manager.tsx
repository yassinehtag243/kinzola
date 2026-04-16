'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Mic, ShieldAlert, RotateCcw, X, ChevronRight } from 'lucide-react';

// ─── Types ───
type PermissionType = 'camera' | 'microphone' | 'gallery';

interface PermissionState {
  camera: 'undetermined' | 'granted' | 'denied';
  microphone: 'undetermined' | 'granted' | 'denied';
  gallery: 'undetermined' | 'granted' | 'denied';
}

// ─── Navigator permission name mapping ───
const NAV_PERMISSION_MAP: Record<PermissionType, string | null> = {
  camera: 'camera',
  microphone: 'microphone',
  gallery: null, // No navigator permission for gallery — maps to camera on mobile
};

// ─── Check navigator.permissions.query ───
async function queryNavigatorPermission(type: PermissionType): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  const name = NAV_PERMISSION_MAP[type];
  if (!name) return 'unsupported';

  // On mobile web, gallery maps to camera
  const permName = type === 'gallery' ? 'camera' : name;

  try {
    // @ts-expect-error — navigator.permissions is available in modern browsers
    const result = await navigator.permissions.query({ name: permName });
    return result.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    // Not supported in this browser or context
    return 'unsupported';
  }
}

// ─── Permission request functions ───
async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

async function requestGalleryPermission(): Promise<boolean> {
  return true;
}

// ─── Permission explanation messages ───
const PERMISSION_INFO: Record<PermissionType, {
  icon: typeof Camera;
  title: string;
  explanation: string;
  reason: string;
  color: string;
  gradientBg: string;
  deniedBannerText: string;
}> = {
  camera: {
    icon: Camera,
    title: 'Accès à la caméra',
    explanation: 'Kinzola a besoin d\'accéder à votre caméra pour prendre des photos et les envoyer dans vos conversations.',
    reason: 'Cela vous permet de partager des moments en temps réel avec vos matchs.',
    color: '#2B7FFF',
    gradientBg: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(43, 127, 255, 0.05))',
    deniedBannerText: 'Autorisez l\'accès à la caméra dans les paramètres de votre navigateur',
  },
  microphone: {
    icon: Mic,
    title: 'Accès au microphone',
    explanation: 'Kinzola a besoin d\'accéder à votre microphone pour enregistrer et envoyer des messages vocaux.',
    reason: 'Les messages vocaux sont un moyen rapide et personnel de communiquer.',
    color: '#FF4D8D',
    gradientBg: 'linear-gradient(135deg, rgba(255, 77, 141, 0.15), rgba(255, 77, 141, 0.05))',
    deniedBannerText: 'Autorisez l\'accès au microphone dans les paramètres de votre navigateur',
  },
  gallery: {
    icon: ImageIcon,
    title: 'Accès à la galerie',
    explanation: 'Kinzola a besoin d\'accéder à vos photos pour que vous puissiez les sélectionner et les envoyer.',
    reason: 'Partagez vos plus belles photos avec vos conversations.',
    color: '#a855f7',
    gradientBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))',
    deniedBannerText: 'Autorisez l\'accès à vos photos dans les paramètres de votre navigateur',
  },
};

// ─── Permission Toast Component (brief notification) ───
function PermissionToast({
  type,
  onDismiss,
}: {
  type: PermissionType;
  onDismiss: () => void;
}) {
  const info = PERMISSION_INFO[type];
  const Icon = info.icon;

  // Auto-dismiss after 2.5 seconds
  // (handled by parent with useEffect)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -10, x: '-50%' }}
      transition={{ duration: 0.25 }}
      className="fixed top-4 left-1/2 z-[80] max-w-[calc(100vw-2rem)] w-[90vw]"
    >
      <div
        className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
        style={{
          border: `1px solid rgba(239, 68, 68, 0.2)`,
          background: 'rgba(239, 68, 68, 0.1)',
        }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239, 68, 68, 0.15)' }}
        >
          <Icon className="w-4 h-4" style={{ color: '#f87171' }} />
        </div>
        <p className="text-xs leading-relaxed flex-1 min-w-0" style={{ color: '#f87171' }}>
          {info.deniedBannerText}
        </p>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Permission Modal Component ───
function PermissionModal({
  type,
  onGranted,
  onDenied,
  onRetry,
}: {
  type: PermissionType;
  onGranted: () => void;
  onDenied: () => void;
  onRetry: () => void;
}) {
  const info = PERMISSION_INFO[type];
  const Icon = info.icon;
  const [requesting, setRequesting] = useState(false);

  const handleAllow = useCallback(async () => {
    setRequesting(true);
    let granted = false;

    switch (type) {
      case 'camera':
        granted = await requestCameraPermission();
        break;
      case 'microphone':
        granted = await requestMicrophonePermission();
        break;
      case 'gallery':
        granted = await requestGalleryPermission();
        break;
    }

    setRequesting(false);

    if (granted) {
      onGranted();
    } else {
      onDenied();
    }
  }, [type, onGranted, onDenied]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg safe-bottom"
      >
        <div className="glass-strong rounded-t-3xl p-6 space-y-5">
          {/* Icon + Title */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: info.gradientBg, border: `1px solid ${info.color}33` }}
            >
              <Icon className="w-7 h-7" style={{ color: info.color }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{info.title}</h3>
              <p className="text-xs text-kinzola-muted mt-0.5">Première utilisation</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              {info.explanation}
            </p>
            <p className="text-xs leading-relaxed text-kinzola-muted">
              {info.reason}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5">
            {/* Allow button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAllow}
              disabled={requesting}
              className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all text-white"
              style={{
                background: `linear-gradient(135deg, ${info.color}, ${info.color}CC)`,
                boxShadow: `0 4px 20px ${info.color}40`,
                opacity: requesting ? 0.7 : 1,
              }}
            >
              {requesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin-slow 0.6s linear infinite' }} />
                  <span>Demande en cours...</span>
                </>
              ) : (
                <>
                  <span> Autoriser l&apos;accès</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Deny button */}
            <button
              onClick={onDenied}
              disabled={requesting}
              className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center cursor-pointer transition-all text-kinzola-muted hover:bg-white/5"
            >
              Plus tard
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Permission Denied Banner Component ───
function PermissionDeniedBanner({
  type,
  onRetry,
  onDismiss,
}: {
  type: PermissionType;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const info = PERMISSION_INFO[type];
  const Icon = info.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: 10, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className="mx-4 mb-2 p-4 rounded-2xl flex items-start gap-3"
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
          <ShieldAlert className="w-5 h-5" style={{ color: '#f87171' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
            Accès {type === 'camera' ? 'caméra' : type === 'microphone' ? 'microphone' : 'galerie'} refusé
          </p>
          <p className="text-xs text-kinzola-muted mt-1 leading-relaxed">
            {info.deniedBannerText}
          </p>
          <button
            onClick={onRetry}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
            style={{ color: info.color }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 cursor-pointer"
        >
          <X className="w-4 h-4 text-kinzola-muted" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Hook: usePermission ───
export function usePermission() {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'undetermined',
    microphone: 'undetermined',
    gallery: 'undetermined',
  });

  const [showModal, setShowModal] = useState<PermissionType | null>(null);
  const [showDenied, setShowDenied] = useState<PermissionType | null>(null);
  const [showToast, setShowToast] = useState<PermissionType | null>(null);

  // Track whether we've already requested permission per type (first-use modal shown)
  const hasRequestedRef = useRef<Record<PermissionType, boolean>>({
    camera: false,
    microphone: false,
    gallery: false,
  });

  // Toast auto-dismiss timer
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToastBriefly = useCallback((type: PermissionType) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setShowToast(type);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(null);
      toastTimerRef.current = null;
    }, 2500);
  }, []);

  const requestPermission = useCallback(async (type: PermissionType): Promise<boolean> => {
    // 1. Check local state first
    const current = permissions[type];
    if (current === 'granted') return true;

    // 2. Check navigator.permissions API for real browser state
    const navState = await queryNavigatorPermission(type);

    // If browser reports granted (maybe user changed it in settings)
    if (navState === 'granted') {
      setPermissions(prev => ({ ...prev, [type]: 'granted' }));
      return true;
    }

    // If browser reports denied (user explicitly blocked in browser settings)
    if (navState === 'denied') {
      setPermissions(prev => ({ ...prev, [type]: 'denied' }));
      // First time we see this denial → show full banner, subsequent → brief toast
      if (!hasRequestedRef.current[type]) {
        hasRequestedRef.current[type] = true;
        setShowDenied(type);
      } else {
        showToastBriefly(type);
      }
      return false;
    }

    // 3. Browser says 'prompt' or 'unsupported' → first-use flow
    if (current === 'denied') {
      // Already denied locally from a previous modal attempt
      // Show banner, not modal
      if (!hasRequestedRef.current[type]) {
        hasRequestedRef.current[type] = true;
        setShowDenied(type);
      } else {
        showToastBriefly(type);
      }
      return false;
    }

    // 4. First time (undetermined) → show the permission modal
    hasRequestedRef.current[type] = true;
    setShowModal(type);
    return false;
  }, [permissions, showToastBriefly]);

  const handleGranted = useCallback((type: PermissionType) => {
    setPermissions(prev => ({ ...prev, [type]: 'granted' }));
    setShowModal(null);
  }, []);

  const handleDenied = useCallback((type: PermissionType) => {
    setPermissions(prev => ({ ...prev, [type]: 'denied' }));
    setShowModal(null);
    setShowDenied(type);
  }, []);

  const handleRetry = useCallback((type: PermissionType) => {
    setShowDenied(null);
    // Reset to undetermined so the modal shows again
    setPermissions(prev => ({ ...prev, [type]: 'undetermined' }));
    setShowModal(type);
  }, []);

  const dismissDenied = useCallback(() => {
    setShowDenied(null);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setShowToast(null);
  }, []);

  return {
    permissions,
    showModal,
    showDenied,
    showToast,
    requestPermission,
    handleGranted,
    handleDenied,
    handleRetry,
    dismissDenied,
    dismissToast,
  };
}

export { PermissionModal, PermissionDeniedBanner, PermissionToast, PERMISSION_INFO };
export type { PermissionType, PermissionState };
