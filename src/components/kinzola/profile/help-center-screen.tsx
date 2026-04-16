'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, ChevronUp, HelpCircle, BookOpen,
  MessageSquare, Mail, Compass, Cpu, UserCog, Camera, Mic,
  Shield, MessageCircle, Search, Lightbulb, Send, X,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

// ═══════════════════════════════════════════════════════════════
//  FAQ Item — Accordéon
// ═══════════════════════════════════════════════════════════════
function FaqItem({ question, answer, isOpen, onToggle, index }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onToggle}
      className="w-full text-left cursor-pointer"
    >
      <div
        className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200"
        style={{
          background: isOpen
            ? (isLight ? 'rgba(43, 127, 255, 0.08)' : 'rgba(43, 127, 255, 0.12)')
            : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
          border: isOpen
            ? '1px solid rgba(43, 127, 255, 0.25)'
            : `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
        }}
      >
        <span className={`text-[13px] font-medium flex-1 pr-3 ${isLight ? 'text-gray-800' : 'text-white/90'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          {isOpen
            ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#2B7FFF' }} />
            : <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
          }
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 mx-1 mt-1 rounded-xl text-[13px] leading-relaxed"
              style={{
                background: isLight ? 'rgba(43, 127, 255, 0.04)' : 'rgba(43, 127, 255, 0.06)',
                color: isLight ? '#4B5563' : 'rgba(255,255,255,0.65)',
              }}
            >
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Guide Card
// ═══════════════════════════════════════════════════════════════
function GuideCard({ icon: Icon, title, description, color, index }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  color: string;
  index: number;
}) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{
        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-[13px] font-semibold mb-1 ${isLight ? 'text-gray-800' : 'text-white/90'}`}>
          {title}
        </h4>
        <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-500' : 'text-white/55'}`}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HelpCenterScreen
// ═══════════════════════════════════════════════════════════════
export default function HelpCenterScreen({ onBack }: { onBack: () => void }) {
  const isLight = useKinzolaStore((s) => s.theme === 'light');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'contact'>('faq');

  const toggleFaq = useCallback((question: string) => {
    setOpenFaq(prev => prev === question ? null : question);
  }, []);

  const faqItems = [
    {
      question: 'Comment créer un profil ?',
      answer: 'Pour créer votre profil Kinzola, inscrivez-vous avec votre numéro de téléphone ou email. Ajoutez une photo de profil, renseignez votre nom, âge et une courte bio. Plus votre profil est complet, plus vous avez de chances de matcher ! Vous pouvez ajouter jusqu\'à 5 photos pour montrer votre personnalité.',
    },
    {
      question: 'Comment matcher quelqu\'un ?',
      answer: 'Allez dans l\'onglet "Découvrir" et parcourez les profils suggérés. Si un profil vous plaît, appuyez sur le cœur ou glissez vers la droite. Si l\'autre personne fait de même avec votre profil, c\'est un match ! Vous pouvez ensuite commencer à discuter ensemble.',
    },
    {
      question: 'Pourquoi je ne reçois pas de messages ?',
      answer: 'Assurez-vous d\'abord que vos notifications sont activées dans les paramètres de votre téléphone et dans l\'app Kinzola (Réglages > Notifications). Vérifiez aussi que votre profil est complet et attractif avec de bonnes photos. Plus vous êtes actif sur l\'app, plus vous apparaissez dans les suggestions des autres utilisateurs.',
    },
    {
      question: 'Comment envoyer une photo ou audio ?',
      answer: 'Dans une conversation, appuyez sur l\'icône "+ " à côté du champ de saisie. Vous pouvez choisir entre : prendre une photo, sélectionner une photo dans votre galerie, ou enregistrer un message vocal en maintenant le bouton microphone. Les messages vocaux sont parfaits pour des échanges plus naturels et rapides.',
    },
    {
      question: 'Comment bloquer une personne ?',
      answer: 'Si vous souhaitez bloquer quelqu\'un, ouvrez la conversation avec cette personne, appuyez sur le nom en haut de l\'écran pour accéder aux détails du contact, puis sélectionnez "Bloquer". La personne bloquée ne pourra plus vous envoyer de messages ni voir votre profil. Vous pouvez la débloquer à tout moment depuis les mêmes options.',
    },
  ];

  const guides = [
    {
      icon: Compass,
      title: 'Comment utiliser "Découvrir"',
      description: 'L\'onglet Découvrir vous présente des profils compatibles. Glissez à droite pour liker, à gauche pour passer. Utilisez les filtres pour affiner vos préférences : âge, distance, centres d\'intérêt. Vous recevez une notification à chaque nouveau match.',
      color: '#2B7FFF',
    },
    {
      icon: Cpu,
      title: 'Comment fonctionne l\'algorithme',
      description: 'Notre algorithme de matching analyse vos préférences, vos interactions (likes, messages) et votre localisation pour vous proposer les profils les plus compatibles. Plus vous utilisez l\'app, plus les suggestions s\'améliorent et s\'adaptent à vos goûts.',
      color: '#A855F7',
    },
    {
      icon: UserCog,
      title: 'Comment modifier son profil',
      description: 'Rendez-vous sur votre profil en cliquant sur l\'onglet "Profil". Appuyez sur l\'icône crayon pour modifier vos informations personnelles (bio, nom, âge). Vous pouvez aussi changer vos photos en appuyant sur l\'icône appareil photo sur la couverture ou la photo de profil.',
      color: '#22C55E',
    },
  ];

  const tabs = [
    { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
    { id: 'guides' as const, label: 'Guides', icon: BookOpen },
    { id: 'contact' as const, label: 'Support', icon: MessageSquare },
  ];

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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
            <HelpCircle className="w-5 h-5" style={{ color: '#2B7FFF' }} />
          </div>
          <div>
            <h2 className={`text-[15px] font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Centre d&apos;aide</h2>
            <p className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/40'}`}>Questions fréquentes et guides</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 mx-4 mt-3 p-1 rounded-xl"
        style={{
          background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
        }}
      >
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-200"
              style={{
                background: isActive
                  ? (isLight ? '#FFFFFF' : 'rgba(43, 127, 255, 0.2)')
                  : 'transparent',
                color: isActive ? '#2B7FFF' : (isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'),
                boxShadow: isActive && isLight ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pt-4 scroll-optimized">
        <AnimatePresence mode="wait">
          {/* ═══ TAB: FAQ ═══ */}
          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Search className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  Questions fréquentes
                </span>
              </div>
              <div className="space-y-2">
                {faqItems.map((faq, i) => (
                  <FaqItem
                    key={i}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaq === faq.question}
                    onToggle={() => toggleFaq(faq.question)}
                    index={i}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: Guides ═══ */}
          {activeTab === 'guides' && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  Guides rapides
                </span>
              </div>
              <div className="space-y-2.5">
                {guides.map((guide, i) => (
                  <GuideCard key={i} {...guide} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: Contact Support ═══ */}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Illustration */}
              <div className="flex flex-col items-center py-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(255, 77, 141, 0.15))',
                    border: '2px solid rgba(43, 127, 255, 0.2)',
                  }}
                >
                  <MessageSquare className="w-8 h-8" style={{ color: '#2B7FFF' }} />
                </div>
                <h3 className={`text-base font-bold mb-1.5 ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  Notre équipe est là pour vous
                </h3>
                <p className={`text-[12px] text-center max-w-xs leading-relaxed ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                  Vous ne trouvez pas la réponse à votre question ? Contactez notre support technique. Nous répondons généralement sous 24 heures.
                </p>
              </div>

              {/* Contact methods */}
              <div className="space-y-2.5">
                {/* Email */}
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(43, 127, 255, 0.15)' }}>
                    <Mail className="w-5 h-5" style={{ color: '#2B7FFF' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[13px] font-semibold ${isLight ? 'text-gray-800' : 'text-white/90'}`}>Email</h4>
                    <p className="text-[12px]" style={{ color: '#2B7FFF' }}>support@kinzola.app</p>
                  </div>
                </div>

                {/* Formulaire */}
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 77, 141, 0.15)' }}>
                    <Send className="w-5 h-5" style={{ color: '#FF4D8D' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[13px] font-semibold ${isLight ? 'text-gray-800' : 'text-white/90'}`}>Formulaire de contact</h4>
                    <p className={`text-[12px] ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                      Utilisez le bouton ci-dessous
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full h-12 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer mt-5"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
                }}
                onClick={() => {
                  window.open('mailto:support@kinzola.app?subject=Besoin d\'aide - Kinzola', '_self');
                }}
              >
                <Mail className="w-4 h-4" />
                Contacter le support
              </motion.button>

              {/* Info bottom */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-white/40'}`}>
                  Support disponible 24h/24, 7j/7
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
