'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, PenTool, Camera, ChevronRight,
  Shield, MapPin, EyeOff,
  Bell, MessageCircle, Heart, Sparkles,
  Sun, Moon, Type,
  HelpCircle, AlertTriangle, FileText, ShieldCheck,
  Info, Star, Share2, Lock, Award, Check, X,
  LogOut, Trash2, Eye, EyeOff as EyeHidden, CameraOff,
  Loader2, Clock, CheckCircle2, XCircle,
  Volume2, Play, Star as StarFilled, Heart as HeartFilled,
  MessageCircle as MessageFilled, Award as AwardFilled,
  Download, Users, Plus, Image,
} from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import VerifiedBadge, { VerifiedBadgeStatic } from '@/components/kinzola/shared/verified-badge';
import HelpCenterScreen from './help-center-screen';
import ReportProblemScreen from './report-problem-screen';
import TermsOfServiceScreen from './terms-of-service-screen';
import PrivacyPolicyScreen from './privacy-policy-screen';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import type { NotificationSoundType } from '@/hooks/use-notification-sound';

// ─── Animated Toggle Switch ───
function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  return (
    <button
      onClick={onToggle}
      className="relative w-[48px] h-[28px] rounded-full transition-all duration-300 cursor-pointer flex-shrink-0"
      style={enabled
        ? { background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }
        : { background: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }
      }
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-[3px] w-[22px] h-[22px] rounded-full shadow-md"
        style={{
          left: enabled ? '23px' : '3px',
          background: '#fff',
        }}
      />
    </button>
  );
}

// ─── Section Wrapper ───
function SettingsSection({ title, subtitle, children, index }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  index: number;
}) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' as const }}
    >
      <div className="mb-2 px-1">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
          {title}
        </p>
        {subtitle && (
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-gray-300/80' : 'text-kinzola-muted/70'}`}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="glass-card overflow-hidden rounded-2xl">
        {children}
      </div>
    </motion.div>
  );
}

// ─── Navigation Item ───
function NavItem({ icon: Icon, label, description, iconBg, iconColor, onClick }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  description?: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      {...(onClick ? { onClick } : {})}
      className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-200 ${onClick ? 'cursor-pointer hover:bg-white/5 active:bg-white/10' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div className="text-left min-w-0">
          <span className={`text-sm block ${isLight ? 'text-gray-800' : 'text-white'}`}>{label}</span>
          {description && (
            <p className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>{description}</p>
          )}
        </div>
      </div>
      {onClick && (
        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-gray-300' : 'text-kinzola-muted'}`} />
      )}
    </Component>
  );
}

// ─── Toggle Row ───
function ToggleRow({ icon: Icon, label, iconBg, iconColor, enabled, onToggle }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  iconBg: string;
  iconColor: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <span className={`text-sm ${isLight ? 'text-gray-800' : 'text-white/90'}`}>{label}</span>
      </div>
      <ToggleSwitch enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

// ─── Divider ───
function SectionDivider() {
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  return (
    <div className="mx-4" style={{ height: '1px', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }} />
  );
}

// ─── Sound Test Panel ───
const SOUNDS_LIST: { type: NotificationSoundType; label: string; description: string; color: string; bg: string; icon: React.ReactNode }[] = [
  {
    type: 'match',
    label: 'Nouveau match',
    description: 'Mélodie quand vous matchez avec quelqu\'un',
    color: '#FFD84D',
    bg: 'rgba(255, 216, 77, 0.12)',
    icon: <StarFilled className="w-4 h-4" />,
  },
  {
    type: 'like',
    label: 'J\'aime',
    description: 'Ding court quand quelqu\'un aime votre post',
    color: '#FF4D8D',
    bg: 'rgba(255, 77, 141, 0.12)',
    icon: <HeartFilled className="w-4 h-4" />,
  },
  {
    type: 'message',
    label: 'Message / Mention',
    description: 'Double ping quand vous recevez un message',
    color: '#2B7FFF',
    bg: 'rgba(43, 127, 255, 0.12)',
    icon: <MessageFilled className="w-4 h-4" />,
  },
  {
    type: 'badge',
    label: 'Badge obtenu',
    description: 'Petit fanfare quand un badge est approuvé',
    color: '#4DFFB4',
    bg: 'rgba(77, 255, 180, 0.12)',
    icon: <AwardFilled className="w-4 h-4" />,
  },
  {
    type: 'default',
    label: 'Notification générale',
    description: 'Carillon doux pour les autres alertes',
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.12)',
    icon: <Bell className="w-4 h-4" />,
  },
];

function SoundTestPanel() {
  const { playSound } = useNotificationSound();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  const handlePlay = useCallback((type: NotificationSoundType) => {
    setPlayingId(type);
    playSound(type, 0.7);
    setTimeout(() => setPlayingId(null), 1500);
  }, [playSound]);

  return (
    <div className="px-4 py-4">
      {/* Volume info */}
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-4 h-4" style={{ color: '#4DFFB4' }} />
        <span className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
          Appuyez sur un son pour l&apos;écouter
        </span>
      </div>

      {/* Sound buttons list */}
      <div className="space-y-2">
        {SOUNDS_LIST.map((sound) => (
          <motion.button
            key={sound.type}
            onClick={() => handlePlay(sound.type)}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
            style={{
              background: playingId === sound.type
                ? sound.bg
                : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${playingId === sound.type ? sound.color + '30' : 'transparent'}`,
            }}
          >
            {/* Icon */}
            <motion.div
              animate={playingId === sound.type ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4, repeat: playingId === sound.type ? 3 : 0 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: sound.bg, color: sound.color }}
            >
              {playingId === sound.type ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                sound.icon
              )}
            </motion.div>

            {/* Text */}
            <div className="flex-1 text-left min-w-0">
              <p className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>{sound.label}</p>
              <p className={`text-[10px] truncate ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>{sound.description}</p>
            </div>

            {/* Play button */}
            <motion.div
              animate={playingId === sound.type ? { scale: [1, 0.85, 1] } : {}}
              transition={{ duration: 0.3, repeat: playingId === sound.type ? 4 : 0 }}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: playingId === sound.type
                  ? `linear-gradient(135deg, ${sound.color}40, ${sound.color}20)`
                  : isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                color: sound.color,
              }}
            >
              <Play className="w-3.5 h-3.5" style={{ marginLeft: '1px' }} />
            </motion.div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Toast Notification ───
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  const bgColor = type === 'success' ? 'rgba(34, 197, 94, 0.15)' : type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(43, 127, 255, 0.15)';
  const borderColor = type === 'success' ? 'rgba(34, 197, 94, 0.3)' : type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(43, 127, 255, 0.3)';
  const iconColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#2B7FFF';
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: bgColor,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />
      <p className={`flex-1 text-sm ${type === 'success' ? 'text-green-300' : type === 'error' ? 'text-red-300' : 'text-blue-300'}`}>
        {message}
      </p>
      <button onClick={onClose} className="flex-shrink-0 cursor-pointer">
        <X className="w-4 h-4 text-white/50" />
      </button>
    </motion.div>
  );
}

// ─── Password Change Modal ───
function PasswordChangeModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const { user, changePassword } = useKinzolaStore();
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = (hasError: boolean) => ({
    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(15, 25, 50, 0.6)',
    border: hasError
      ? '1.5px solid rgba(239, 68, 68, 0.6)'
      : isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
    color: isLight ? '#1a1a2e' : '#FFFFFF',
  });

  const handleSubmit = async () => {
    setError('');

    // Validate fields filled
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Validate new password === confirm
    if (newPassword !== confirmPassword) {
      setError('Le nouveau mot de passe et la confirmation ne correspondent pas');
      return;
    }

    if (!user) return;
    setLoading(true);

    try {
      const result = await changePassword(user.id, oldPassword, newPassword);
      setLoading(false);

      if (result.success) {
        onToast('Mot de passe modifié avec succès !', 'success');
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  // Real-time validation indicators
  const hasDigit = /[0-9]/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
        style={{
          background: isLight ? '#FFFFFF' : '#0A1F3C',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
              <Lock className="w-5 h-5" style={{ color: '#2B7FFF' }} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Modifier le mot de passe</h3>
              <p className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
                Votre mot de passe est unique et sécurisé
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center cursor-pointer">
            <X className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Old Password */}
          <div>
            <label className={`text-xs font-medium block mb-1.5 ${isLight ? 'text-gray-500' : 'text-kinzola-muted'}`}>
              Ancien mot de passe
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Entrez l'ancien mot de passe"
                className="w-full h-12 px-4 pr-12 rounded-xl text-sm outline-none transition-all duration-300"
                style={inputStyle(error.includes('Ancien') || error.includes('incorrect'))}
              />
              <button
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1"
              >
                {showOld
                  ? <EyeOff className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />
                  : <Eye className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />
                }
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className={`text-xs font-medium block mb-1.5 ${isLight ? 'text-gray-500' : 'text-kinzola-muted'}`}>
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères + 1 chiffre"
                className="w-full h-12 px-4 pr-12 rounded-xl text-sm outline-none transition-all duration-300"
                style={inputStyle(false)}
              />
              <button
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1"
              >
                {showNew
                  ? <EyeOff className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />
                  : <Eye className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />
                }
              </button>
            </div>
            {/* Password strength indicators */}
            {newPassword.length > 0 && (
              <div className="flex gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full transition-colors" style={{ background: hasMinLength ? '#22c55e' : isLight ? '#d1d5db' : 'rgba(255,255,255,0.15)' }} />
                  <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>8+ car.</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full transition-colors" style={{ background: hasLetter ? '#22c55e' : isLight ? '#d1d5db' : 'rgba(255,255,255,0.15)' }} />
                  <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>Lettre</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full transition-colors" style={{ background: hasDigit ? '#22c55e' : isLight ? '#d1d5db' : 'rgba(255,255,255,0.15)' }} />
                  <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>Chiffre</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={`text-xs font-medium block mb-1.5 ${isLight ? 'text-gray-500' : 'text-kinzola-muted'}`}>
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le nouveau mot de passe"
                className="w-full h-12 px-4 pr-12 rounded-xl text-sm outline-none transition-all duration-300"
                style={inputStyle(error.includes('correspondent') && confirmPassword.length > 0)}
              />
              <button
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1"
              >
                {showConfirm
                  ? <EyeOff className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />
                  : <Eye className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />
                }
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                {passwordsMatch
                  ? <Check className="w-3 h-3 text-green-400" />
                  : <X className="w-3 h-3 text-red-400" />
                }
                <span className={`text-[10px] ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                </span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
            style={{
              background: loading
                ? 'rgba(43, 127, 255, 0.3)'
                : 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              color: '#FFFFFF',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(43, 127, 255, 0.3)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Enregistrer le mot de passe
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Badge Verification Modal ───
function BadgeVerificationModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const { user, badgeStatus, setBadgeStatus } = useKinzolaStore();
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  const [step, setStep] = useState<'intro' | 'upload_id' | 'upload_selfie' | 'processing' | 'result'>('intro');
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'success' | 'fail'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileGalleryRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const selfieGalleryRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIdPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelfiePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVerifyID = async () => {
    if (!idPreview || !user) return;
    // Simulate ID verification against user info
    await new Promise((r) => setTimeout(r, 1500));

    // In demo: 85% chance of matching
    const match = Math.random() < 0.85;
    if (match) {
      setStep('upload_selfie');
    } else {
      setResultType('fail');
      onToast('Les informations de votre pièce d\'identité ne correspondent pas à votre profil', 'error');
      setStep('result');
    }
  };

  const handleVerifySelfie = async () => {
    if (!selfiePreview) return;
    setStep('processing');
    setBadgeStatus('processing');
    onToast('Demande de badge envoyée ! Vérification en cours...', 'info');

    // Simulate processing (1 hour in real, 5 seconds in demo)
    await new Promise((r) => setTimeout(r, 5000));

    // In demo: 90% chance of approval
    const approved = Math.random() < 0.9;
    if (approved) {
      setBadgeStatus('approved');
      setResultType('success');
    } else {
      setBadgeStatus('rejected');
      setResultType('fail');
    }
    setStep('result');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
        style={{
          background: isLight ? '#FFFFFF' : '#0A1F3C',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
              <Award className="w-5 h-5" style={{ color: '#2B7FFF' }} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Badge officiel
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
                {step === 'intro' && 'Obtenez votre badge de vérification'}
                {step === 'upload_id' && 'Étape 1 : Pièce d\'identité'}
                {step === 'upload_selfie' && 'Étape 2 : Selfie en temps réel'}
                {step === 'processing' && 'Analyse en cours...'}
                {step === 'result' && resultType === 'success' && 'Félicitations !'}
                {step === 'result' && resultType === 'fail' && 'Vérification échouée'}
              </p>
            </div>
          </div>
          {step !== 'processing' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center cursor-pointer">
              <X className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {['intro', 'upload_id', 'upload_selfie', 'processing', 'result'].map((s, i) => {
            const steps = ['intro', 'upload_id', 'upload_selfie', 'processing', 'result'];
            const currentIndex = steps.indexOf(step);
            const isActive = i <= currentIndex;
            return (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #2B7FFF, #FF4D8D)'
                      : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                    flex: 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* INTRO STEP */}
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Badge Preview */}
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ type: 'tween' as const, duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(43, 127, 255, 0.05))',
                    border: '2px solid rgba(43, 127, 255, 0.3)',
                  }}
                >
                  <VerifiedBadgeStatic size="lg" />
                </motion.div>
              </div>

              <p className={`text-sm text-center leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
                Le badge officiel Kinzola prouve que votre profil est authentique.
                Il permet aux autres utilisateurs de savoir que vous êtes une personne réelle.
              </p>

              <div className="space-y-2">
                {[
                  '📸 Prenez une photo de votre pièce d\'identité',
                  '🤳 Prenez un selfie en temps réel',
                  '⏳ Attendez la vérification (environ 1h)',
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${isLight ? 'text-gray-700' : 'text-white/80'}`}
                    style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}
                  >
                    {text}
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('upload_id')}
                className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #1B5FCC)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
                }}
              >
                <Camera className="w-4 h-4" />
                Commencer la vérification
              </motion.button>
            </motion.div>
          )}

          {/* UPLOAD ID STEP */}
          {step === 'upload_id' && (
            <motion.div key="upload_id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
                Prenez une photo claire de votre carte d'identité, passeport ou permis de conduire.
                Les informations doivent correspondre à votre profil Kinzola.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileGalleryRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {idPreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={idPreview} alt="Pièce d'identité" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => { setIdPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
                    <span className="text-[11px] text-white">Pièce d'identité</span>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2xl overflow-hidden" style={{ border: `2px dashed ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Camera className={`w-10 h-10 ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
                    <span className={`text-sm ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
                      Ajouter votre pièce d'identité
                    </span>
                  </div>
                  <div className="flex">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer transition-colors"
                      style={{ background: 'rgba(43, 127, 255, 0.08)', borderRight: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <Camera className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/50'}`} />
                      <span className={`text-xs font-medium ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Appareil photo</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fileGalleryRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer transition-colors"
                    >
                      <Image className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/50'}`} />
                      <span className={`text-xs font-medium ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Galerie</span>
                    </motion.button>
                  </div>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleVerifyID}
                disabled={!idPreview}
                className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                style={{
                  background: idPreview
                    ? 'linear-gradient(135deg, #2B7FFF, #1B5FCC)'
                    : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
                  color: idPreview ? '#FFFFFF' : (isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)'),
                  boxShadow: idPreview ? '0 4px 20px rgba(43, 127, 255, 0.3)' : 'none',
                }}
              >
                <ShieldCheck className="w-4 h-4" />
                Vérifier la pièce d'identité
              </motion.button>
            </motion.div>
          )}

          {/* UPLOAD SELFIE STEP */}
          {step === 'upload_selfie' && (
            <motion.div key="upload_selfie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Pièce d'identité vérifiée avec succès</span>
              </div>

              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
                Prenez maintenant un selfie en temps réel. Votre visage doit être clairement visible.
                Nous le comparerons avec votre pièce d'identité.
              </p>

              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieSelect}
                className="hidden"
              />
              <input
                ref={selfieGalleryRef}
                type="file"
                accept="image/*"
                onChange={handleSelfieSelect}
                className="hidden"
              />

              {selfiePreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={selfiePreview} alt="Selfie" className="w-full h-48 object-cover" />
                  <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
                    <span className="text-[11px] text-white">Selfie</span>
                  </div>
                  <button
                    onClick={() => { setSelfiePreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-full rounded-2xl overflow-hidden" style={{ border: `2px dashed ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ type: 'tween' as const, duration: 1.5, repeat: Infinity }}
                    >
                      <Camera className={`w-10 h-10 ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
                    </motion.div>
                    <span className={`text-sm ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
                      Ajouter votre selfie
                    </span>
                  </div>
                  <div className="flex">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selfieInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer transition-colors"
                      style={{ background: 'rgba(43, 127, 255, 0.08)', borderRight: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <Camera className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/50'}`} />
                      <span className={`text-xs font-medium ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Selfie</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selfieGalleryRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 cursor-pointer transition-colors"
                    >
                      <Image className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/50'}`} />
                      <span className={`text-xs font-medium ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Galerie</span>
                    </motion.button>
                  </div>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleVerifySelfie}
                disabled={!selfiePreview}
                className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                style={{
                  background: selfiePreview
                    ? 'linear-gradient(135deg, #2B7FFF, #FF4D8D)'
                    : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
                  color: selfiePreview ? '#FFFFFF' : (isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)'),
                  boxShadow: selfiePreview ? '0 4px 20px rgba(43, 127, 255, 0.3)' : 'none',
                }}
              >
                <Award className="w-4 h-4" />
                Envoyer pour vérification
              </motion.button>
            </motion.div>
          )}

          {/* PROCESSING STEP */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' as const }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.1), rgba(255, 77, 141, 0.1))',
                  border: '2px solid rgba(43, 127, 255, 0.2)',
                }}
              >
                <Loader2 className="w-8 h-8" style={{ color: '#2B7FFF' }} />
              </motion.div>
              <h4 className={`text-lg font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Vérification en cours...
              </h4>
              <p className={`text-sm text-center max-w-xs ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
                Notre système analyse vos documents. Cela peut prendre quelques instants.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Clock className="w-4 h-4" style={{ color: '#fbbf24' }} />
                <span className="text-xs" style={{ color: '#fbbf24' }}>Temps estimé : environ 1 heure</span>
              </div>
            </motion.div>
          )}

          {/* RESULT STEP */}
          {step === 'result' && resultType === 'success' && (
            <motion.div key="result-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(34, 197, 94, 0.15))',
                  border: '2px solid rgba(43, 127, 255, 0.3)',
                  boxShadow: '0 0 40px rgba(43, 127, 255, 0.2)',
                }}
              >
                <span className="text-4xl">☑️</span>
              </motion.div>
              <motion.h4
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-xl font-bold mb-2 gradient-text`}
              >
                Badge obtenu !
              </motion.h4>
              <p className={`text-sm text-center max-w-xs ${isLight ? 'text-gray-500' : 'text-kinzola-muted'}`}>
                Votre profil est maintenant vérifié. Le badge bleu s&apos;affiche sur votre profil.
              </p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="mt-6 h-12 px-8 rounded-2xl font-semibold text-sm cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
                }}
              >
                Fermer
              </motion.button>
            </motion.div>
          )}

          {/* RESULT STEP — FAIL */}
          {step === 'result' && resultType === 'fail' && (
            <motion.div key="result-fail" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <XCircle className="w-10 h-10 text-red-400" />
              </motion.div>
              <motion.h4
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-lg font-bold mb-2 text-red-400`}
              >
                Vérification échouée
              </motion.h4>
              <p className={`text-sm text-center max-w-xs ${isLight ? 'text-gray-500' : 'text-kinzola-muted'}`}>
                Les informations fournies ne correspondent pas. Veuillez vérifier vos documents et réessayer.
              </p>
              <div className="flex gap-3 mt-6">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="h-12 px-6 rounded-2xl font-medium text-sm cursor-pointer"
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: isLight ? '#6b7280' : '#8899B4',
                  }}
                >
                  Fermer
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setStep('upload_id'); setIdPreview(null); setSelfiePreview(null); setBadgeStatus('none'); }}
                  className="h-12 px-6 rounded-2xl font-semibold text-sm cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #1B5FCC)',
                    color: '#FFFFFF',
                  }}
                >
                  Réessayer
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── PWA INSTALL SETTINGS ITEM ───
// ═══════════════════════════════════════════════════════════════
function PwaInstallSettingsItem() {
  const { isInstallable, isInstalled, install } = usePwaInstall();
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  if (isInstalled) {
    return (
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
            <Check className="w-4 h-4" style={{ color: '#22c55e' }} />
          </div>
          <div className="text-left min-w-0">
            <span className={`text-sm block ${isLight ? 'text-gray-800' : 'text-white'}`}>Application installée</span>
            <p className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>Kinzola est installée sur votre appareil</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isInstallable) {
    return (
      <button
        onClick={() => {
          // Guide vers l'installation manuelle
          if (typeof window !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
            // Android Chrome: essayer l'API native
            window.open('https://kinzola.vercel.app', '_blank');
          }
        }}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-200 cursor-pointer hover:bg-white/5 active:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
            <Download className="w-4 h-4" style={{ color: '#2B7FFF' }} />
          </div>
          <div className="text-left min-w-0">
            <span className={`text-sm block ${isLight ? 'text-gray-800' : 'text-white'}`}>Installer l'application</span>
            <p className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
              Ouvrez dans Chrome puis menu &gt; &quot;Installer l&apos;application&quot; ou &quot;Ajouter à l&apos;écran d&apos;accueil&quot;
            </p>
          </div>
        </div>
        <div
          className="text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #2B7FFF, #1a5fd4)',
          }}
        >
          Guide
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={install}
      className="w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-200 cursor-pointer hover:bg-white/5 active:bg-white/10"
    >
      <div className="flex items-center gap-3 min-w-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ type: 'tween', duration: 2, repeat: Infinity }}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.2), rgba(255, 77, 141, 0.2))' }}
        >
          <Download className="w-4 h-4" style={{ color: '#2B7FFF' }} />
        </motion.div>
        <div className="text-left min-w-0">
          <span className={`text-sm block font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>Installer l'application</span>
          <p className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
            Accès rapide depuis l'écran d'accueil
          </p>
        </div>
      </div>
      <div
        className="text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #2B7FFF, #1a5fd4)',
          boxShadow: '0 0 15px rgba(43, 127, 255, 0.3)',
        }}
      >
        Installer
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── DELETE ACCOUNT MODAL ───
// ═══════════════════════════════════════════════════════════════
function DeleteAccountModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const { user } = useKinzolaStore();
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  const [step, setStep] = useState<'reason' | 'password' | 'confirm'>('reason');
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Je ne trouve pas de match',
    'Je reçois trop de notifications',
    'Je veux supprimer mes données',
    "J'ai trouvé l'amour",
    'Autre raison',
  ];

  const handleReasonNext = () => {
    if (!reason) return;
    if (reason === 'Autre raison' && !otherReason.trim()) {
      setError('Veuillez préciser votre raison');
      return;
    }
    setError('');
    setStep('password');
  };

  const handlePasswordNext = async () => {
    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setError('Session expirée, reconnectez-vous');
        setLoading(false);
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password,
      });
      if (authError) {
        setError('Mot de passe incorrect');
        setLoading(false);
        return;
      }
      setStep('confirm');
      setLoading(false);
    } catch {
      setError('Erreur lors de la vérification');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Récupérer le token d'authentification actuel
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Session expirée, reconnectez-vous');
        setLoading(false);
        return;
      }

      // Appeler l'API côté serveur (qui a la clé service_role)
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Erreur lors de la suppression');
        setLoading(false);
        return;
      }

      // Déconnecter localement
      await supabase.auth.signOut();
      onToast('Compte supprimé avec succès', 'success');

      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.replace('/?t=' + Date.now());
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
        style={{
          background: isLight ? '#FFFFFF' : '#0A1F3C',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
              <Trash2 className="w-5 h-5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Supprimer mon compte</h3>
              <p className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
                {step === 'reason' && 'Étape 1 : Pourquoi partir ?'}
                {step === 'password' && 'Étape 2 : Vérification'}
                {step === 'confirm' && 'Étape 3 : Confirmation finale'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center cursor-pointer">
            <X className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
          </button>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-6">
          {['reason', 'password', 'confirm'].map((s, i) => {
            const steps = ['reason', 'password', 'confirm'];
            const currentIndex = steps.indexOf(step);
            const isActive = i <= currentIndex;
            return (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                    flex: 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* REASON STEP */}
        {step === 'reason' && (
          <div className="space-y-3">
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
              Nous sommes triste de vous voir partir. Aidez-nous à améliorer Kinzola en nous donnant votre raison.
            </p>
            {reasons.map(r => (
              <button
                key={r}
                onClick={() => { setReason(r); setError(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left cursor-pointer transition-all duration-200`}
                style={{
                  background: reason === r
                    ? 'rgba(239, 68, 68, 0.1)'
                    : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                  border: reason === r
                    ? '1.5px solid rgba(239, 68, 68, 0.4)'
                    : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                  style={{
                    borderColor: reason === r ? '#ef4444' : (isLight ? '#d1d5db' : 'rgba(255,255,255,0.2)'),
                    background: reason === r ? '#ef4444' : 'transparent',
                  }}
                >
                  {reason === r && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${reason === r ? 'text-red-400 font-medium' : (isLight ? 'text-gray-700' : 'text-white/80')}`}>
                  {r}
                </span>
              </button>
            ))}

            {reason === 'Autre raison' && (
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Précisez votre raison..."
                className="w-full h-12 px-4 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(15, 25, 50, 0.6)',
                  border: error.includes('préciser') ? '1.5px solid rgba(239, 68, 68, 0.6)' : `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  color: isLight ? '#1a1a2e' : '#FFFFFF',
                }}
              />
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleReasonNext} className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)' }}>
              Continuer
            </motion.button>
          </div>
        )}

        {/* PASSWORD STEP */}
        {step === 'password' && (
          <div className="space-y-4">
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
              Pour confirmer votre identité, veuillez entrer votre mot de passe.
            </p>
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${isLight ? 'text-gray-500' : 'text-kinzola-muted'}`}>Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="w-full h-12 px-4 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(15, 25, 50, 0.6)',
                    border: error ? '1.5px solid rgba(239, 68, 68, 0.6)' : `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    color: isLight ? '#1a1a2e' : '#FFFFFF',
                  }}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} /> : <Eye className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />}
                </button>
              </div>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handlePasswordNext} disabled={loading} className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{ background: loading ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFFFFF', boxShadow: loading ? 'none' : '0 4px 20px rgba(239, 68, 68, 0.3)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Vérification...' : 'Vérifier mon identité'}
            </motion.button>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === 'confirm' && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h4 className={`text-lg font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>Action irréversible</h4>
              <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
                Cette action est irréversible. Toutes vos données seront supprimées définitivement : profil, messages, matchs, photos et publications.
              </p>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleDelete} disabled={loading} className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{ background: loading ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #EF4444, #991B1B)', color: '#FFFFFF', boxShadow: loading ? 'none' : '0 4px 20px rgba(239, 68, 68, 0.4)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {loading ? 'Suppression en cours...' : 'Supprimer définitivement mon compte'}
            </motion.button>
            <button onClick={onClose} className="w-full h-12 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{ color: isLight ? '#6b7280' : 'text-white/50' }}>
              Annuler
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── ACCOUNT SWITCHER MODAL ───
// ═══════════════════════════════════════════════════════════════
function AccountSwitcherModal({ onClose, onToast, onSwitchAccount, showLogout = false, onLogout }: { onClose: () => void; onToast: (msg: string, type: 'success' | 'error' | 'info') => void; onSwitchAccount: (email: string) => void; showLogout?: boolean; onLogout?: () => void }) {
  const { user } = useKinzolaStore();
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  const [accounts, setAccounts] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem('kinzola-known-accounts') || '[]');
      setAccounts(saved);
    } catch {}
  }, []);

  const handleRemoveAccount = (email: string) => {
    const updated = accounts.filter(a => a !== email);
    localStorage.setItem('kinzola-known-accounts', JSON.stringify(updated));
    setAccounts(updated);
    setRemoved(email);
    setTimeout(() => setRemoved(null), 2000);
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return local[0] + '***' + local.slice(-1) + '@' + domain;
  };

  const handleAddAccount = () => {
    onClose();
    // Nettoyer les données de l'utilisateur courant avant de naviguer vers login
    useKinzolaStore.setState({
      currentScreen: 'login',
      conversations: [],
      matches: [],
      messages: [],
      profiles: [],
      posts: [],
      notifications: [],
      likesReceived: [],
      profileVisitors: [],
      _fetchingAll: false,
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
        style={{ background: isLight ? '#FFFFFF' : '#0A1F3C' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
              <Users className="w-5 h-5" style={{ color: '#2B7FFF' }} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Autres comptes</h3>
              <p className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>{accounts.length} compte(s) enregistré(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center cursor-pointer">
            <X className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
          </button>
        </div>

        {/* Current account */}
        {user && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(43, 127, 255, 0.08)', border: '1px solid rgba(43, 127, 255, 0.2)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}>
                    <span className="text-white font-bold text-sm">{user.name?.[0]}</span>
                  </div>
                )}
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{user.name}</p>
                  <p className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>{user.email}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                Connecté
              </span>
            </div>
          </div>
        )}

        {/* Other accounts */}
        <div className="space-y-2 mb-4">
          {accounts.filter(a => a !== user?.email).map(email => (
            <div key={email} className="flex items-center justify-between p-3.5 rounded-xl transition-all" style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                  <User className="w-4 h-4" style={{ color: isLight ? '#9ca3af' : '#8899B4' }} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm truncate ${isLight ? 'text-gray-700' : 'text-white/80'}`}>{maskEmail(email)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onSwitchAccount(email)} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)', color: '#FFFFFF' }}>
                  Connecter
                </button>
                <button onClick={() => handleRemoveAccount(email)} className="p-1.5 rounded-lg cursor-pointer transition-all" style={{ background: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.1)' }}>
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
          {accounts.filter(a => a !== user?.email).length === 0 && (
            <p className={`text-center text-sm py-6 ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
              Aucun autre compte enregistré
            </p>
          )}
        </div>

        {/* Add account button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddAccount} className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)' }}>
          <Plus className="w-4 h-4" />
          Ajouter un nouveau compte
        </motion.button>

        {/* Logout button — only visible when opened from the logout button */}
        {showLogout && onLogout && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all mt-3"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
            }}
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN SETTINGS SCREEN ───
// ═══════════════════════════════════════════════════════════════
export default function SettingsScreen() {
  const {
    setShowSettings, setShowEditPersonalInfo, setShowEditProfile,
    logout, theme, setTheme,
    textSize, setTextSize,
    badgeStatus,
  } = useKinzolaStore();

  const isLight = theme === 'light';

  // Local text size selection (applied only on save)
  const [pendingTextSize, setPendingTextSize] = useState(textSize);
  const [textSizeSaved, setTextSizeSaved] = useState(true);

  // Privacy state
  const [profileVisible, setProfileVisible] = useState(true);
  const [showDistance, setShowDistance] = useState(false);
  const [hideAge, setHideAge] = useState(false);

  // Notification state
  const [notifNewMatches, setNotifNewMatches] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSuperLikes, setNotifSuperLikes] = useState(true);
  const [notifSuggestions, setNotifSuggestions] = useState(false);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showAboutPanel, setShowAboutPanel] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [logoutMode, setLogoutMode] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Handlers ───
  const handleEditPersonalInfo = useCallback(() => {
    setShowEditPersonalInfo(true);
    setShowSettings(false);
  }, [setShowEditPersonalInfo, setShowSettings]);

  const handleEditProfile = useCallback(() => {
    setShowEditProfile(true);
    setShowSettings(false);
  }, [setShowEditProfile, setShowSettings]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleChangePhoto = useCallback(async () => {
    if (!user) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingPhoto(true);
      try {
        const { updateProfilePhoto } = await import('@/lib/supabase/storage-service');
        const result = await updateProfilePhoto(user.id, file);
        if (result.url) {
          useKinzolaStore.setState(s => ({
            user: s.user ? { ...s.user, photoUrl: result.url! } : s.user,
          }));
          showToast('Photo de profil mise à jour !', 'success');
        } else {
          showToast(result.error || 'Erreur lors du téléchargement', 'error');
        }
      } catch (err: any) {
        showToast(err?.message || 'Erreur', 'error');
      } finally {
        setUploadingPhoto(false);
      }
    };
    input.click();
  }, [user, showToast]);

  const handleChangeCoverPhoto = useCallback(async () => {
    if (!user) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingPhoto(true);
      try {
        const { uploadCoverPhoto } = await import('@/lib/supabase/storage-service');
        const result = await uploadCoverPhoto(user.id, file);
        if (result.url) {
          // Store cover photo in photo_gallery[0] position
          const currentGallery = user.photoGallery || [];
          const updatedGallery = [result.url, ...currentGallery.filter(u => !u.includes('/cover.'))];
          const { supabase } = await import('@/lib/supabase/client');
          await (supabase.from('profiles') as any).update({ photo_gallery: updatedGallery }).eq('id', user.id);
          useKinzolaStore.setState(s => ({
            user: s.user ? { ...s.user, photoGallery: updatedGallery } : s.user,
          }));
          showToast('Photo de couverture ajoutée !', 'success');
        } else {
          showToast(result.error || 'Erreur', 'error');
        }
      } catch (err: any) {
        showToast(err?.message || 'Erreur', 'error');
      } finally {
        setUploadingPhoto(false);
      }
    };
    input.click();
  }, [user, showToast]);

  const handleSupportAction = useCallback((label: string) => {
    if (label === "Centre d'aide") {
      setShowHelpCenter(true);
    } else if (label === 'Signaler un problème') {
      setShowReportProblem(true);
    } else if (label === "Conditions d'utilisation") {
      setShowTerms(true);
    } else if (label === 'Politique de confidentialité') {
      setShowPrivacy(true);
    } else if (label === 'Supprimer mon compte') {
      setShowDeleteModal(true);
    } else {
      alert(`${label} — fonctionnalité à venir`);
    }
  }, []);

  // Handle switch to another account
  const handleSwitchAccount = useCallback((targetEmail: string) => {
    // Pré-remplir l'email pour le login + nettoyer les données
    if (typeof window !== 'undefined') {
      localStorage.setItem('kinzola-switch-to-account', targetEmail);
    }
    useKinzolaStore.setState({
      currentScreen: 'login',
      conversations: [],
      matches: [],
      messages: [],
      profiles: [],
      posts: [],
      notifications: [],
      likesReceived: [],
      profileVisitors: [],
      _fetchingAll: false,
    });
    showToast(`Connectez-vous à ${targetEmail}`, 'info');
  }, [showToast]);

  const handleSaveTextSize = useCallback(() => {
    setTextSize(pendingTextSize);
    setTextSizeSaved(true);
    showToast(`Taille du texte : ${pendingTextSize}px appliquée à toute l'application`, 'success');
  }, [pendingTextSize, setTextSize, showToast]);

  const handleTextSizeChange = useCallback((value: number) => {
    setPendingTextSize(value);
    // Mark as unsaved if different from current store value
    setTextSizeSaved(value === textSize);
  }, [textSize]);

  // Badge status text
  const getBadgeStatusText = () => {
    switch (badgeStatus) {
      case 'approved': return 'Badge obtenu';
      case 'processing': return 'Vérification en cours...';
      case 'rejected': return 'Vérification échouée — Réessayer';
      default: return 'Non vérifié';
    }
  };

  const getBadgeStatusColor = () => {
    switch (badgeStatus) {
      case 'approved': return '#2B7FFF';
      case 'processing': return '#fbbf24';
      case 'rejected': return '#ef4444';
      default: return isLight ? '#9ca3af' : '#8899B4';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: isLight ? '#FFFFFF' : '#060E1A' }}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(false)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className={`w-5 h-5 ${isLight ? 'text-gray-700' : 'text-white'}`} />
        </motion.button>
        <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Paramètres
        </h2>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5" style={{ scrollbarWidth: 'thin' }}>

        {/* ═══ SECTION 1: Compte ═══ */}
        <SettingsSection title="Compte" subtitle="Gestion de votre profil" index={0}>
          <NavItem
            icon={User}
            label="Modifier mes informations"
            description="Nom, pseudo, email"
            iconBg="rgba(43, 127, 255, 0.15)"
            iconColor="#2B7FFF"
            onClick={handleEditPersonalInfo}
          />
          <SectionDivider />
          <NavItem
            icon={PenTool}
            label="Modifier mon profil"
            description="Bio, intérêts, photos"
            iconBg="rgba(255, 77, 141, 0.15)"
            iconColor="#FF4D8D"
            onClick={handleEditProfile}
          />
          <SectionDivider />
          <NavItem
            icon={Camera}
            label={uploadingPhoto ? "Téléchargement..." : "Changer la photo de profil"}
            description="Mettre à jour votre photo"
            iconBg="rgba(168, 85, 247, 0.15)"
            iconColor="#a855f7"
            onClick={uploadingPhoto ? undefined : handleChangePhoto}
          />
          <SectionDivider />
          <NavItem
            icon={Image as any}
            label={uploadingPhoto ? "Téléchargement..." : "Photo de couverture"}
            description="Ajouter une photo de couverture"
            iconBg="rgba(43, 127, 255, 0.15)"
            iconColor="#2B7FFF"
            onClick={uploadingPhoto ? undefined : handleChangeCoverPhoto}
          />
        </SettingsSection>

        {/* ═══ SECTION 2: Sécurité ═══ */}
        <SettingsSection title="Sécurité" subtitle="Protégez votre compte" index={1}>
          {/* Change Password */}
          <NavItem
            icon={Lock}
            label="Modifier le mot de passe"
            description="Changer votre mot de passe de connexion"
            iconBg="rgba(251, 191, 36, 0.15)"
            iconColor="#fbbf24"
            onClick={() => setShowPasswordModal(true)}
          />
          <SectionDivider />
          {/* Badge Verification */}
          <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setShowBadgeModal(true)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
                <Award className="w-4 h-4" style={{ color: '#2B7FFF' }} />
              </div>
              <div className="text-left">
                <span className={`text-sm block ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  Obtenir le badge officiel
                </span>
                <span className="text-[11px] mt-0.5 block" style={{ color: getBadgeStatusColor() }}>
                  {getBadgeStatusText()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {badgeStatus === 'approved' && (
                <VerifiedBadge size="sm" />
              )}
              <ChevronRight className={`w-4 h-4 ${isLight ? 'text-gray-300' : 'text-kinzola-muted'}`} />
            </div>
          </div>
        </SettingsSection>

        {/* ═══ SECTION 3: Confidentialité ═══ */}
        <SettingsSection title="Confidentialité" subtitle="Contrôlez votre visibilité" index={2}>
          <ToggleRow
            icon={Shield}
            label="Rendre mon profil visible"
            iconBg="rgba(43, 127, 255, 0.15)"
            iconColor="#2B7FFF"
            enabled={profileVisible}
            onToggle={() => setProfileVisible(!profileVisible)}
          />
          <SectionDivider />
          <ToggleRow
            icon={MapPin}
            label="Afficher ma distance"
            iconBg="rgba(74, 222, 128, 0.15)"
            iconColor="#4ade80"
            enabled={showDistance}
            onToggle={() => setShowDistance(!showDistance)}
          />
          <SectionDivider />
          <ToggleRow
            icon={EyeOff}
            label="Masquer mon âge"
            iconBg="rgba(251, 191, 36, 0.15)"
            iconColor="#fbbf24"
            enabled={hideAge}
            onToggle={() => setHideAge(!hideAge)}
          />
        </SettingsSection>

        {/* ═══ SECTION 4: Notifications ═══ */}
        <SettingsSection title="Notifications" subtitle="Gérez vos alertes" index={3}>
          <ToggleRow
            icon={Bell}
            label="Nouveaux matchs"
            iconBg="rgba(43, 127, 255, 0.15)"
            iconColor="#2B7FFF"
            enabled={notifNewMatches}
            onToggle={() => setNotifNewMatches(!notifNewMatches)}
          />
          <SectionDivider />
          <ToggleRow
            icon={MessageCircle}
            label="Messages reçus"
            iconBg="rgba(255, 77, 141, 0.15)"
            iconColor="#FF4D8D"
            enabled={notifMessages}
            onToggle={() => setNotifMessages(!notifMessages)}
          />
          <SectionDivider />
          <ToggleRow
            icon={Heart}
            label="Super likes"
            iconBg="rgba(168, 85, 247, 0.15)"
            iconColor="#a855f7"
            enabled={notifSuperLikes}
            onToggle={() => setNotifSuperLikes(!notifSuperLikes)}
          />
          <SectionDivider />
          <ToggleRow
            icon={Sparkles}
            label="Suggestions de profils"
            iconBg="rgba(251, 191, 36, 0.15)"
            iconColor="#fbbf24"
            enabled={notifSuggestions}
            onToggle={() => setNotifSuggestions(!notifSuggestions)}
          />
          <SectionDivider />
        </SettingsSection>

        {/* ═══ SECTION 5: Apparence ═══ */}
        <SettingsSection title="Apparence" subtitle="Personnalisez l'affichage" index={5}>
          {/* Theme selector */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              {isLight
                ? <Sun className="w-4 h-4 text-amber-500" />
                : <Moon className="w-4 h-4 text-kinzola-muted" />
              }
              <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-white'}`}>
                Thème
              </span>
            </div>
            <div className="flex gap-3">
              {/* Light option */}
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 relative overflow-hidden p-4 flex flex-col items-center gap-2 rounded-2xl transition-all duration-300 cursor-pointer ${
                  isLight ? 'ring-2' : ''
                }`}
                style={{
                  background: isLight ? 'rgba(43, 127, 255, 0.08)' : 'rgba(255,255,255,0.04)',
                  border: isLight
                    ? '2px solid rgba(43, 127, 255, 0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isLight
                    ? '0 0 25px rgba(43, 127, 255, 0.15)'
                    : 'none',
                }}
              >
                <div className="w-full h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-500" />
                </div>
                <span className={`text-xs font-semibold ${isLight ? 'text-kinzola-blue' : 'text-gray-400'}`}>
                  Clair
                </span>
                {isLight && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}
                  >
                    <span className="text-[10px] text-white">✓</span>
                  </motion.div>
                )}
              </button>

              {/* Dark option */}
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 relative overflow-hidden p-4 flex flex-col items-center gap-2 rounded-2xl transition-all duration-300 cursor-pointer ${
                  !isLight ? 'ring-2' : ''
                }`}
                style={{
                  background: !isLight ? 'rgba(43, 127, 255, 0.08)' : 'rgba(255,255,255,0.04)',
                  border: !isLight
                    ? '2px solid rgba(43, 127, 255, 0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: !isLight
                    ? '0 0 25px rgba(43, 127, 255, 0.15)'
                    : 'none',
                }}
              >
                <div className="w-full h-12 rounded-xl bg-[#0A1F3C] border border-white/10 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs font-semibold ${!isLight ? 'text-kinzola-blue' : 'text-gray-400'}`}>
                  Sombre
                </span>
                {!isLight && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}
                  >
                    <span className="text-[10px] text-white">✓</span>
                  </motion.div>
                )}
              </button>
            </div>
          </div>

          <SectionDivider />

          {/* Text size with slider + SAVE button */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Type className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`} />
                <span className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-white'}`}>
                  Taille du texte
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: '#2B7FFF' }}>
                  {pendingTextSize}px
                </span>
                {!textSizeSaved && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}
                  >
                    Non enregistré
                  </motion.span>
                )}
                {textSizeSaved && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                    style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                  >
                    <Check className="w-3 h-3" />
                    Enregistré
                  </motion.span>
                )}
              </div>
            </div>

            {/* Preview text */}
            <div
              className="rounded-xl px-4 py-3 mb-3 transition-all duration-200"
              style={{
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <p
                className="leading-relaxed transition-all duration-150"
                style={{
                  fontSize: `${pendingTextSize}px`,
                  color: isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
                }}
              >
                Bonjour, ceci est un aperçu de la taille du texte. Ajustez le curseur pour trouver la taille idéale.
              </p>
            </div>

            {/* Slider */}
            <div className="relative mb-3">
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={pendingTextSize}
                onChange={(e) => handleTextSizeChange(parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #2B7FFF 0%, #2B7FFF ${((pendingTextSize - 12) / 12) * 100}%, ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'} ${((pendingTextSize - 12) / 12) * 100}%, ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'} 100%)`,
                }}
              />
              {/* Custom thumb */}
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #2B7FFF, #FF4D8D);
                  box-shadow: 0 2px 8px rgba(43, 127, 255, 0.4);
                  cursor: pointer;
                  border: 3px solid white;
                }
                input[type="range"]::-moz-range-thumb {
                  width: 22px;
                  height: 22px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #2B7FFF, #FF4D8D);
                  box-shadow: 0 2px 8px rgba(43, 127, 255, 0.4);
                  cursor: pointer;
                  border: 3px solid white;
                }
              `}</style>
              {/* Scale labels */}
              <div className="flex justify-between mt-1.5 px-0.5">
                {[12, 14, 16, 18, 20, 22, 24].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleTextSizeChange(val)}
                    className="transition-colors duration-200 cursor-pointer"
                  >
                    <span
                      className={`text-[9px] font-semibold transition-colors ${
                        pendingTextSize === val
                          ? (isLight ? 'text-blue-500' : 'text-kinzola-blue')
                          : (isLight ? 'text-gray-300' : 'text-white/20')
                      }`}
                    >
                      {val}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SAVE BUTTON */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveTextSize}
              disabled={textSizeSaved}
              className="w-full h-10 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
              style={{
                background: textSizeSaved
                  ? (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)')
                  : 'linear-gradient(135deg, #2B7FFF, #1B5FCC)',
                color: textSizeSaved
                  ? (isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)')
                  : '#FFFFFF',
                boxShadow: textSizeSaved ? 'none' : '0 4px 15px rgba(43, 127, 255, 0.25)',
              }}
            >
              <Check className="w-3.5 h-3.5" />
              {textSizeSaved ? 'Enregistré' : 'Enregistrer la taille'}
            </motion.button>
          </div>
        </SettingsSection>

        {/* ═══ SECTION 6: Support ═══ */}
        <SettingsSection title="Support" subtitle="Aide et informations" index={5}>
          <NavItem
            icon={HelpCircle}
            label="Centre d'aide"
            iconBg="rgba(43, 127, 255, 0.15)"
            iconColor="#2B7FFF"
            onClick={() => handleSupportAction("Centre d'aide")}
          />
          <SectionDivider />
          <NavItem
            icon={AlertTriangle}
            label="Signaler un problème"
            iconBg="rgba(251, 146, 60, 0.15)"
            iconColor="#fb923c"
            onClick={() => handleSupportAction('Signaler un problème')}
          />
          <SectionDivider />
          <NavItem
            icon={FileText}
            label="Conditions d'utilisation"
            iconBg="rgba(74, 222, 128, 0.15)"
            iconColor="#4ade80"
            onClick={() => handleSupportAction("Conditions d'utilisation")}
          />
          <SectionDivider />
          <NavItem
            icon={ShieldCheck}
            label="Politique de confidentialité"
            iconBg="rgba(168, 85, 247, 0.15)"
            iconColor="#a855f7"
            onClick={() => handleSupportAction('Politique de confidentialité')}
          />
        </SettingsSection>

        {/* ═══ SECTION 7: À propos ═══ */}
        <SettingsSection title="À propos" index={6}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowAboutPanel(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') setShowAboutPanel(true); }}
            className="w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-200 cursor-pointer hover:bg-white/5 active:bg-white/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
                <Info className="w-4 h-4" style={{ color: '#2B7FFF' }} />
              </div>
              <div className="text-left min-w-0">
                <span className={`text-sm block ${isLight ? 'text-gray-800' : 'text-white'}`}>À propos de Kinzola</span>
                <p className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>Description, version et copyright</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-gray-300' : 'text-kinzola-muted'}`} />
          </div>
          <SectionDivider />
          <NavItem
            icon={Star}
            label="Évaluer l'application"
            description="Donnez votre avis sur l'App Store"
            iconBg="rgba(251, 191, 36, 0.15)"
            iconColor="#fbbf24"
            onClick={() => handleSupportAction('Évaluer l\'application')}
          />
          <SectionDivider />
          <NavItem
            icon={Share2}
            label="Partager Kinzola"
            description="Invitez vos amis"
            iconBg="rgba(255, 77, 141, 0.15)"
            iconColor="#FF4D8D"
            onClick={() => handleSupportAction('Partager Kinzola')}
          />
          <SectionDivider />
          <PwaInstallSettingsItem />
        </SettingsSection>

        {/* ═══ About Panel ═══ */}
        <AnimatePresence>
          {showAboutPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-end justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowAboutPanel(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
                style={{
                  background: isLight ? '#FFFFFF' : '#0A1F3C',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
                      <Info className="w-5 h-5" style={{ color: '#2B7FFF' }} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>À propos de Kinzola</h3>
                      <p className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>Version 1.0.0</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAboutPanel(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center cursor-pointer">
                    <X className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
                  </button>
                </div>

                {/* App icon + name */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)', boxShadow: '0 8px 32px rgba(43, 127, 255, 0.3)' }}>
                    <span className="text-3xl font-bold text-white">K</span>
                  </div>
                  <h4 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Kinzola</h4>
                  <span className="text-xs font-medium px-3 py-0.5 rounded-full mt-1" style={{ background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(255, 77, 141, 0.15))', color: '#2B7FFF' }}>v1.0.0</span>
                </div>

                {/* Description */}
                <div className="rounded-2xl p-4 mb-4" style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}>
                  <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
                    Kinzola est une application de rencontre axée sur les relations amicale et amoureuse sérieuses, la compatibilité et l&apos;authenticité, adaptée à la culture congolaise. L&apos;expérience doit être fluide, sécurisée, élégante et sans interactions superficielles.
                  </p>
                </div>

                {/* Copyright */}
                <div className="text-center py-3 rounded-xl" style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
                  <p className={`text-xs ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>
                    Copyright©2026 by YASSINE H-TAG BUTSHIEMUNI
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ SECTION 8: Déconnexion ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 7 * 0.06, duration: 0.4, ease: 'easeOut' as const }}
          className="space-y-3 pb-4"
        >
          {/* ═══ Autres comptes ═══ */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setLogoutMode(false);
              setShowAccountSwitcher(true);
            }}
            className="w-full h-12 rounded-2xl font-medium text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300"
            style={{
              background: isLight ? 'rgba(43, 127, 255, 0.08)' : 'rgba(43, 127, 255, 0.1)',
              border: '1px solid rgba(43, 127, 255, 0.2)',
              color: '#2B7FFF',
            }}
          >
            <Users className="w-4 h-4" />
            Autres comptes
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setLogoutMode(true);
              setShowAccountSwitcher(true);
            }}
            disabled={false}
            className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
            }}
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDeleteModal(true)}
            className="w-full h-12 rounded-2xl font-medium text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 hover:bg-red-500/5"
            style={{
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
            }}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </motion.button>
        </motion.div>

      </div>

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal
            onClose={() => setShowDeleteModal(false)}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccountSwitcher && (
          <AccountSwitcherModal
            onClose={() => { setShowAccountSwitcher(false); setLogoutMode(false); }}
            onToast={showToast}
            onSwitchAccount={handleSwitchAccount}
            showLogout={logoutMode}
            onLogout={async () => {
              try {
                showToast('Déconnexion en cours...', 'info');
                await new Promise(r => setTimeout(r, 400));
                setShowAccountSwitcher(false);
                await logout();
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('kinzola-splash-seen');
                  window.location.replace('/?t=' + Date.now());
                }
              } catch (err) {
                showToast('Erreur lors de la déconnexion', 'error');
                console.error('[Logout] Erreur:', err);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <PasswordChangeModal
            onClose={() => setShowPasswordModal(false)}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBadgeModal && (
          <BadgeVerificationModal
            onClose={() => setShowBadgeModal(false)}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* ═══ Help Center Screen ═══ */}
      <AnimatePresence>
        {showHelpCenter && (
          <HelpCenterScreen onBack={() => setShowHelpCenter(false)} />
        )}
      </AnimatePresence>

      {/* ═══ Report Problem Screen ═══ */}
      <AnimatePresence>
        {showReportProblem && (
          <ReportProblemScreen onBack={() => setShowReportProblem(false)} />
        )}
      </AnimatePresence>

      {/* ═══ Terms of Service Screen ═══ */}
      <AnimatePresence>
        {showTerms && (
          <TermsOfServiceScreen onBack={() => setShowTerms(false)} />
        )}
      </AnimatePresence>

      {/* ═══ Privacy Policy Screen ═══ */}
      <AnimatePresence>
        {showPrivacy && (
          <PrivacyPolicyScreen onBack={() => setShowPrivacy(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
