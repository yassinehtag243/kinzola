'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

export default function EditPersonalInfo() {
  const { user, updateProfile, setShowEditPersonalInfo } = useKinzolaStore();

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [pseudo, setPseudo] = useState(user?.pseudo || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Pas besoin de mot de passe pour modifier le nom/pseudo
  const isFormValid = firstName.trim() && lastName.trim() && pseudo.trim();

  const handleSave = async () => {
    if (!isFormValid) return;
    setError('');
    setIsSaving(true);

    try {
      const result = await updateProfile({
        name: `${firstName.trim()} ${lastName.trim()}`,
        pseudo: pseudo.trim(),
      });

      if (!result.success) {
        setError(result.error || 'Erreur lors de la sauvegarde.');
        setIsSaving(false);
        return;
      }

      // Succès
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowEditPersonalInfo(false);
      }, 1200);
    } catch (err: any) {
      console.error('[EditPersonalInfo] Erreur:', err);
      setError(err?.message || 'Une erreur est survenue.');
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: '#0A1F3C' }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #2B7FFF 0%, transparent 70%)',
            animation: 'mesh-float-1 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #FF4D8D 0%, transparent 70%)',
            animation: 'mesh-float-2 10s ease-in-out infinite',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-5 pb-2 safe-top">
        <button
          onClick={() => setShowEditPersonalInfo(false)}
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-kinzola-muted">
            <span>Informations personnelles</span>
            <ChevronRightIcon />
            <span className="text-white font-medium">Modifier mon nom</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pt-6 pb-8 flex flex-col">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #C8D6F0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Modifier mon nom
          </h1>
          <p className="text-sm text-kinzola-muted leading-relaxed">
            Mettez à jour vos informations personnelles. Ces données sont visibles sur votre profil.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex-1"
          style={{
            background: 'rgba(15, 25, 50, 0.5)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px 20px',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="space-y-5">
            {/* Prénom */}
            <div>
              <label className="block text-xs font-semibold text-kinzola-muted uppercase tracking-wider mb-2 pl-1">
                Prénom
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Entrez votre prénom"
                  className="w-full h-[52px] rounded-2xl px-4 text-white text-sm outline-none transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: firstName ? '1px solid rgba(43, 127, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: firstName ? '0 0 20px rgba(43, 127, 255, 0.1)' : 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    if (!firstName) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    } else {
                      e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.1)';
                    }
                  }}
                />
                {firstName && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4" style={{ color: '#2B7FFF' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-kinzola-muted uppercase tracking-wider mb-2 pl-1">
                Nom
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Entrez votre nom de famille"
                  className="w-full h-[52px] rounded-2xl px-4 text-white text-sm outline-none transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: lastName ? '1px solid rgba(43, 127, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: lastName ? '0 0 20px rgba(43, 127, 255, 0.1)' : 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    if (!lastName) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    } else {
                      e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.1)';
                    }
                  }}
                />
                {lastName && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4" style={{ color: '#2B7FFF' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Pseudo */}
            <div>
              <label className="block text-xs font-semibold text-kinzola-muted uppercase tracking-wider mb-2 pl-1">
                Pseudo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="Choisissez un pseudo unique"
                  className="w-full h-[52px] rounded-2xl px-4 text-white text-sm outline-none transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: pseudo ? '1px solid rgba(43, 127, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: pseudo ? '0 0 20px rgba(43, 127, 255, 0.1)' : 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    if (!pseudo) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    } else {
                      e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.1)';
                    }
                  }}
                />
                {pseudo && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4" style={{ color: '#2B7FFF' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </motion.div>
          )}

          {/* Save Button */}
          <motion.button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            whileHover={{ scale: isFormValid ? 1.02 : 1 }}
            whileTap={{ scale: isFormValid ? 0.97 : 1 }}
            className="w-full h-[56px] rounded-2xl font-semibold text-[15px] text-white mt-8 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
            style={{
              background: isFormValid
                ? 'linear-gradient(135deg, #FF4D8D 0%, #FF6BA0 40%, #2B7FFF 100%)'
                : 'rgba(255, 255, 255, 0.06)',
              border: isFormValid ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: isFormValid
                ? '0 8px 32px rgba(255, 77, 141, 0.4), 0 4px 16px rgba(43, 127, 255, 0.3)'
                : 'none',
              opacity: isFormValid ? 1 : 0.5,
            }}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : showSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>Sauvegardé !</span>
              </>
            ) : (
              <span>Sauvegarder</span>
            )}
          </motion.button>

          <p className="text-[11px] text-kinzola-muted/60 text-center mt-4 leading-relaxed">
            Vos modifications seront visibles immédiatement sur votre profil.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-kinzola-muted/50 inline-block"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
