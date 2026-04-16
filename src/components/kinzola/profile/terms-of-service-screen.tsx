'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Shield, ShieldBan, UserX, EyeOff,
  MessageSquareWarning, Scale, Users, Check, X, Ban, AlertTriangle,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

// ═══════════════════════════════════════════════════════════════
//  Section Block — réutilisable
// ═══════════════════════════════════════════════════════════════
function SectionBlock({ icon: Icon, title, color, children, index }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  color: string;
  children: React.ReactNode;
  index: number;
}) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h3 className={`text-[13px] font-bold ${isLight ? 'text-gray-800' : 'text-white/90'}`}>{title}</h3>
      </div>

      {/* Section content */}
      <div className="px-4 py-3">
        {children}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Rule Item
// ═══════════════════════════════════════════════════════════════
function RuleItem({ icon: Icon, text, color, isLight }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  text: string;
  color: string;
  isLight: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}12` }}>
        <Icon className="w-3 h-3" style={{ color }} />
      </div>
      <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/60'}`}>{text}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TermsOfServiceScreen
// ═══════════════════════════════════════════════════════════════
export default function TermsOfServiceScreen({ onBack }: { onBack: () => void }) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  const [accepted, setAccepted] = useState(false);

  const handleAccept = useCallback(() => {
    setAccepted(true);
    setTimeout(() => onBack(), 800);
  }, [onBack]);

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
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)' }}
        >
          <ArrowLeft className={`w-5 h-5 ${isLight ? 'text-gray-700' : 'text-white/80'}`} />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74, 222, 128, 0.15)' }}>
            <FileText className="w-5 h-5" style={{ color: '#4ade80' }} />
          </div>
          <div>
            <h2 className={`text-[15px] font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Conditions d&apos;utilisation
            </h2>
            <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
              Dernière mise à jour : Avril 2025
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scroll-optimized">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 pb-6"
        >
          {/* Intro */}
          <div className="flex items-start gap-2.5 p-4 rounded-xl" style={{ background: 'rgba(43, 127, 255, 0.06)', border: '1px solid rgba(43, 127, 255, 0.12)' }}>
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2B7FFF' }} />
            <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
              En utilisant Kinzola, vous acceptez les présentes conditions d&apos;utilisation. Veuillez les lire attentivement avant de continuer à utiliser l&apos;application.
            </p>
          </div>

          {/* 1. Règles principales */}
          <SectionBlock icon={ShieldBan} title="Règles principales" color="#EF4444" index={1}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Pour garantir un environnement sûr et agréable pour tous les utilisateurs, les comportements suivants sont strictement interdits sur Kinzola :
            </p>
            <div className="space-y-1">
              <RuleItem icon={UserX} text="Faux profils — Créer un compte avec de fausses informations, utiliser des photos qui ne vous appartiennent pas, ou usurper l'identité d'une autre personne est strictement interdit." color="#EF4444" isLight={isLight} />
              <RuleItem icon={AlertTriangle} text="Harcèlement — Tout comportement intimidant, menaçant, abusif ou non respectueux envers un autre utilisateur entraînera un bannissement immédiat et permanent de la plateforme." color="#F59E0B" isLight={isLight} />
              <RuleItem icon={EyeOff} text="Contenu inapproprié — Les publications, messages ou photos à caractère sexuel explicite, violent, discriminatoire ou contraire aux bonnes mœurs sont interdits." color="#A855F7" isLight={isLight} />
              <RuleItem icon={Ban} text="Spam — L'envoi massif de messages non sollicités, de publicités ou de liens suspects est interdit. Chaque utilisateur doit avoir une communication authentique et respectueuse." color="#F97316" isLight={isLight} />
            </div>
          </SectionBlock>

          {/* 2. Responsabilité */}
          <SectionBlock icon={Scale} title="Responsabilité de l'utilisateur" color="#2B7FFF" index={2}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Chaque utilisateur est pleinement responsable de son comportement et du contenu qu'il publie sur la plateforme. Cela inclut :
            </p>
            <div className="space-y-2">
              {[
                'Les informations fournies lors de l\'inscription doivent être exactes et à jour. Un profil avec de fausses informations peut être supprimé sans préavis.',
                'Vous êtes responsable de la confidentialité de votre compte. Ne partagez jamais vos identifiants de connexion avec un tiers.',
                'Toute interaction avec d\'autres utilisateurs doit respecter les lois en vigueur en République Démocratique du Congo et les conventions internationales.',
                'Kinzola ne peut être tenu responsable des dommages directs ou indirects résultant de l\'utilisation de la plateforme.',
                'Les utilisateurs doivent signaler tout comportement suspect ou abusif en utilisant la fonctionnalité "Signaler un problème" dans les paramètres.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#2B7FFF' }} />
                  <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/60'}`}>{text}</p>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* 3. Suspension de compte */}
          <SectionBlock icon={Ban} title="Suspension et bannissement" color="#F97316" index={3}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Kinzola se réserve le droit de suspendre ou bannir définitivement tout compte en cas de violation des présentes conditions :
            </p>
            <div className="space-y-2">
              {[
                'Premier avertissement : notification de comportement inapproprié avec rappel des règles de la communauté.',
                'Deuxième avertissement : suspension temporaire du compte pour une durée de 7 jours. Pendant cette période, le profil ne sera pas visible par les autres utilisateurs.',
                'Troisième violation : bannissement permanent du compte. Toute tentative de recréer un compte après un bannissement sera bloquée automatiquement par notre système.',
                'Violation grave (harcèlement, faux profil vérifié, contenu illégal) : bannissement immédiat et permanent sans avertissement préalable.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold" style={{ background: 'rgba(249, 115, 22, 0.12)', color: '#F97316' }}>
                    {i + 1}
                  </div>
                  <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/60'}`}>{text}</p>
                </div>
              ))}
            </div>

            {/* Badge info */}
            <div className="flex items-start gap-2.5 mt-3 p-3 rounded-lg" style={{ background: 'rgba(43, 127, 255, 0.06)', border: '1px solid rgba(43, 127, 255, 0.1)' }}>
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2B7FFF' }} />
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/55'}`}>
                Le système de badge de vérification Kinzola a été mis en place pour garantir l&apos;authenticité des profils et lutter contre les faux comptes. Un profil vérifié indique que l&apos;utilisateur a été confirmé comme une personne réelle par notre équipe.
              </p>
            </div>
          </SectionBlock>

          {/* 4. Utilisation de l'app */}
          <SectionBlock icon={Users} title="Utilisation de l'application" color="#22C55E" index={4}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Kinzola est conçu pour un usage personnel et respectueux. Voici les règles d&apos;utilisation :
            </p>
            <div className="space-y-1">
              {[
                { icon: Check, text: 'L\'application est destinée exclusivement à un usage personnel. Toute utilisation commerciale, promotionnelle ou à des fins de réseau marketing est interdite.', color: '#22C55E' },
                { icon: Check, text: 'Le respect mutuel est la base de notre communauté. Chaque utilisateur doit traiter les autres avec courtoisie et considération, peu importe les différences de background, d\'opinion ou de préférence.', color: '#22C55E' },
                { icon: Check, text: 'Il est interdit d\'utiliser des bots, des scripts ou tout autre outil automatisé pour interagir avec la plateforme de manière non authentique.', color: '#22C55E' },
                { icon: Check, text: 'Les fonctionnalités de l\'application (matchs, messages, publications) doivent être utilisées conformément à leur finalité prévue et non de manière détournée.', color: '#22C55E' },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-2">
                    <ItemIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: item.color }} />
                    <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/60'}`}>{item.text}</p>
                  </div>
                );
              })}
            </div>
          </SectionBlock>

          {/* Accept button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAccept}
            disabled={accepted}
            className="w-full h-12 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 mt-2"
            style={{
              background: accepted
                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                : 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
            }}
          >
            {accepted ? (
              <>
                <Check className="w-4 h-4" />
                Conditions acceptées
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                J&apos;accepte les conditions
              </>
            )}
          </motion.button>

          <p className={`text-[10px] text-center ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
            En utilisant Kinzola, vous reconnaissez avoir lu et accepté ces conditions.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
