'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Bug, User, MessageSquare, FileQuestion,
  Camera, Upload, CheckCircle2, X, Loader2, Send,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

// ═══════════════════════════════════════════════════════════════
//  ReportProblemScreen
// ═══════════════════════════════════════════════════════════════
export default function ReportProblemScreen({ onBack }: { onBack: () => void }) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  // Form state
  const [problemType, setProblemType] = useState<'bug' | 'compte' | 'message' | 'autre' | null>(null);
  const [description, setDescription] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const problemTypes = [
    { id: 'bug' as const, label: 'Bug', icon: Bug, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
    { id: 'compte' as const, label: 'Compte', icon: User, color: '#2B7FFF', bg: 'rgba(43, 127, 255, 0.12)' },
    { id: 'message' as const, label: 'Message', icon: MessageSquare, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
    { id: 'autre' as const, label: 'Autre', icon: FileQuestion, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
  ];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!problemType || !description.trim()) return;

    setSending(true);

    // Simulate sending to Supabase
    await new Promise((r) => setTimeout(r, 1500));

    setSending(false);
    setSent(true);
  }, [problemType, description]);

  const handleReset = useCallback(() => {
    setProblemType(null);
    setDescription('');
    setScreenshotPreview(null);
    setSent(false);
  }, []);

  const inputStyle = {
    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(15, 25, 50, 0.6)',
    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
    color: isLight ? '#1a1a2e' : '#FFFFFF',
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="h-full w-full flex flex-col"
      style={{ background: isLight ? '#F5F6FA' : '#050E1F' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 sticky top-0 z-20"
        style={{
          background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5, 14, 31, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`,
        }}
      >
        <button
          onClick={sent ? handleReset : onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)' }}
        >
          <ArrowLeft className={`w-5 h-5 ${isLight ? 'text-gray-700' : 'text-white/80'}`} />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251, 146, 60, 0.15)' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#fb923c' }} />
          </div>
          <div>
            <h2 className={`text-[15px] font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Signaler un problème
            </h2>
            <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
              {sent ? 'Signalement envoyé' : 'Décrivez votre problème'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scroll-optimized">
        <AnimatePresence mode="wait">
          {/* ═══ FORM VIEW ═══ */}
          {!sent && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Type de problème */}
              <div>
                <label className={`text-[12px] font-semibold block mb-2.5 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                  Type de problème
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {problemTypes.map((type, i) => {
                    const Icon = type.icon;
                    const isSelected = problemType === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.04 * i, duration: 0.25 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setProblemType(type.id)}
                        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                          background: isSelected
                            ? type.bg
                            : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
                          border: isSelected
                            ? `1.5px solid ${type.color}40`
                            : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${type.color}18` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: type.color }} />
                        </div>
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: isSelected ? type.color : (isLight ? '#4B5563' : 'rgba(255,255,255,0.7)') }}
                        >
                          {type.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`text-[12px] font-semibold block mb-2.5 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                  Description <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le problème en détail..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none transition-all duration-200 leading-relaxed"
                  style={{
                    ...inputStyle,
                    borderColor: description.length > 0
                      ? (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')
                      : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                  }}
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                    {description.length} caractères
                  </span>
                </div>
              </div>

              {/* Screenshot */}
              <div>
                <label className={`text-[12px] font-semibold block mb-2.5 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                  Capture d&apos;écran <span className="font-normal opacity-50">(optionnel)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {screenshotPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={screenshotPreview}
                      alt="Capture d'écran"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setScreenshotPreview(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div
                      className="absolute bottom-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] text-white">Image ajoutée</span>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    style={{
                      border: `1.5px dashed ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                      background: isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }}
                    >
                      <Camera className={`w-4 h-4 ${isLight ? 'text-gray-300' : 'text-white/20'}`} />
                    </div>
                    <span className={`text-[12px] ${isLight ? 'text-gray-400' : 'text-white/35'}`}>
                      Appuyez pour ajouter une capture d&apos;écran
                    </span>
                  </motion.button>
                )}
              </div>

              {/* Submit button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!problemType || !description.trim() || sending}
                className="w-full h-12 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
                style={{
                  background: (problemType && description.trim() && !sending)
                    ? 'linear-gradient(135deg, #fb923c, #ef4444)'
                    : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
                  color: (problemType && description.trim() && !sending)
                    ? '#FFFFFF'
                    : (isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'),
                  boxShadow: (problemType && description.trim() && !sending)
                    ? '0 4px 20px rgba(251, 146, 60, 0.3)'
                    : 'none',
                }}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le signalement
                  </>
                )}
              </motion.button>

              {/* Info */}
              <p className={`text-[11px] text-center ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                Votre signalement sera traité avec la plus haute priorité par notre équipe.
              </p>
            </motion.div>
          )}

          {/* ═══ SUCCESS VIEW ═══ */}
          {sent && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex flex-col items-center py-10"
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
                  border: '2px solid rgba(34, 197, 94, 0.3)',
                  boxShadow: '0 0 40px rgba(34, 197, 94, 0.15)',
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}
              >
                Signalement envoyé !
              </motion.h3>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-[13px] text-center max-w-xs leading-relaxed mb-2 ${isLight ? 'text-gray-500' : 'text-white/50'}`}
              >
                Votre signalement a bien été envoyé. Notre équipe va l&apos;examiner et vous répondre dans les plus brefs délais.
              </motion.p>

              {/* Info card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-xs p-4 rounded-xl mt-4"
                style={{
                  background: 'rgba(43, 127, 255, 0.08)',
                  border: '1px solid rgba(43, 127, 255, 0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className={`text-[12px] font-semibold ${isLight ? 'text-blue-600' : 'text-blue-300'}`}>
                    Résumé du signalement
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className={`text-[11px] ${isLight ? 'text-gray-500' : 'text-white/40'}`}>Type</span>
                    <span className={`text-[11px] font-medium ${isLight ? 'text-gray-700' : 'text-white/70'}`}>
                      {problemTypes.find(t => t.id === problemType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-[11px] ${isLight ? 'text-gray-500' : 'text-white/40'}`}>Capture</span>
                    <span className={`text-[11px] font-medium ${isLight ? 'text-gray-700' : 'text-white/70'}`}>
                      {screenshotPreview ? 'Oui' : 'Non'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-[11px] ${isLight ? 'text-gray-500' : 'text-white/40'}`}>Statut</span>
                    <span className="text-[11px] font-medium text-green-400">En attente</span>
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-xs mt-6 space-y-2.5"
              >
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onBack}
                  className="w-full h-11 rounded-2xl font-semibold text-[13px] flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
                  }}
                >
                  Retour aux paramètres
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleReset}
                  className="w-full h-11 rounded-2xl font-semibold text-[13px] flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                    color: isLight ? 'text-gray-600' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  Signaler un autre problème
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
