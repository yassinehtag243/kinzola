'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, ShieldCheck, Lock, Eye, Database,
  Server, Bell, User, MapPin, Heart, MessageSquare, ShieldAlert,
  BadgeCheck, Check, Info, Trash2,
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

// ═══════════════════════════════════════════════════════════════
//  Section Block
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
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h3 className={`text-[13px] font-bold ${isLight ? 'text-gray-800' : 'text-white/90'}`}>{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DataItem
// ═══════════════════════════════════════════════════════════════
function DataItem({ icon: Icon, label, description, color, isLight }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  description: string;
  color: string;
  isLight: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}12` }}>
        <Icon className="w-3 h-3" style={{ color }} />
      </div>
      <div className="flex-1">
        <p className={`text-[12px] font-semibold ${isLight ? 'text-gray-700' : 'text-white/75'}`}>{label}</p>
        <p className={`text-[11px] leading-relaxed ${isLight ? 'text-gray-500' : 'text-white/45'}`}>{description}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PrivacyPolicyScreen
// ═══════════════════════════════════════════════════════════════
export default function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
            <ShieldCheck className="w-5 h-5" style={{ color: '#a855f7' }} />
          </div>
          <div>
            <h2 className={`text-[15px] font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Politique de confidentialité
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
          <div className="flex items-start gap-2.5 p-4 rounded-xl" style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.12)' }}>
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#a855f7' }} />
            <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
              Chez Kinzola, la protection de vos données personnelles est notre priorité absolue. Cette politique explique quelles données nous collectons, comment nous les utilisons et les mesures que nous prenons pour les sécuriser.
            </p>
          </div>

          {/* 1. Données collectées */}
          <SectionBlock icon={Database} title="Données collectées" color="#2B7FFF" index={1}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Pour vous offrir la meilleure expérience possible, nous collectons les données suivantes lors de votre inscription et de votre utilisation de l&apos;application :
            </p>
            <div className="space-y-0.5">
              <DataItem
                icon={User}
                label="Identité"
                description="Votre nom, prénom, date de naissance et genre. Ces informations sont nécessaires pour créer votre profil et vérifier votre identité."
                color="#2B7FFF"
                isLight={isLight}
              />
              <DataItem
                icon={MapPin}
                label="Localisation"
                description="Votre ville et votre position géographique approximative pour afficher des profils proches de vous et calculer les distances de compatibilité."
                color="#22C55E"
                isLight={isLight}
              />
              <DataItem
                icon={Heart}
                label="Préférences"
                description="Vos centres d&apos;intérêt, critères de recherche (âge, distance, genre) et vos interactions (profils aimés, matchs) pour améliorer les suggestions."
                color="#FF4D8D"
                isLight={isLight}
              />
              <DataItem
                icon={MessageSquare}
                label="Messages"
                description="Le contenu de vos conversations est stocké de manière sécurisée et n&apos;est jamais partagé avec des tiers. Les messages sont chiffrés de bout en bout."
                color="#A855F7"
                isLight={isLight}
              />
              <DataItem
                icon={Bell}
                label="Données d&apos;utilisation"
                description="Fréquence d&apos;utilisation, fonctionnalités préférées, notifications activées et données de performance pour optimiser l&apos;application."
                color="#F59E0B"
                isLight={isLight}
              />
            </div>
          </SectionBlock>

          {/* 2. Utilisation des données */}
          <SectionBlock icon={Eye} title="Utilisation des données" color="#A855F7" index={2}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Vos données sont utilisées exclusivement pour les finalités suivantes :
            </p>
            <div className="space-y-2">
              {[
                {
                  title: 'Améliorer les suggestions de matching',
                  desc: 'Notre algorithme utilise vos préférences, interactions et données de localisation pour vous proposer des profils compatibles. Plus vous utilisez l\'application, plus les suggestions deviennent pertinentes.',
                },
                {
                  title: 'Faire fonctionner l\'application',
                  desc: 'Vos données sont essentielles au bon fonctionnement de Kinzola : création de profil, messagerie, notifications, affichage des profils proches et synchronisation entre appareils.',
                },
                {
                  title: 'Sécurité et prévention des abus',
                  desc: 'Nous utilisons vos données pour détecter et prévenir les comportements abusifs : faux profils, harcèlement, spam et autres violations de nos conditions d\'utilisation.',
                },
                {
                  title: 'Système de badge de vérification',
                  desc: 'Pour lutter contre les faux profils, nous avons mis en place un système de badge vérifié. Lors du processus de vérification, votre pièce d\'identité et selfie sont analysés et immédiatement supprimés après confirmation.',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#A855F7' }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className={`text-[12px] font-semibold mb-0.5 ${isLight ? 'text-gray-700' : 'text-white/75'}`}>{item.title}</p>
                    <p className={`text-[11px] leading-relaxed ${isLight ? 'text-gray-500' : 'text-white/45'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* 3. Protection des données */}
          <SectionBlock icon={Server} title="Protection et sécurité" color="#22C55E" index={3}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Nous prenons la sécurité de vos données très au sérieux. Voici les mesures que nous mettons en œuvre :
            </p>
            <div className="space-y-2">
              {[
                { icon: Lock, text: 'Chiffrement de bout en bout pour toutes les conversations — personne, ni même Kinzola, ne peut lire vos messages.', color: '#22C55E' },
                { icon: Server, text: 'Hébergement sécurisé sur des serveurs Supabase avec des protocoles de sécurité de niveau industriel et des sauvegardes automatiques régulières.', color: '#2B7FFF' },
                { icon: ShieldAlert, text: 'Le système de badge de vérification a été ajouté pour identifier et éliminer les faux profils, protégeant ainsi notre communauté contre les arnaques et l\'usurpation d\'identité.', color: '#F59E0B' },
                { icon: Trash2, text: 'Suppression immédiate des documents d\'identification après vérification. Nous ne conservons aucune copie de vos pièces d\'identité.', color: '#EF4444' },
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

          {/* 4. Vos droits */}
          <SectionBlock icon={Info} title="Vos droits" color="#F59E0B" index={4}>
            <p className={`text-[12px] leading-relaxed mb-3 ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
              Conformément aux lois en vigueur, vous disposez des droits suivants sur vos données personnelles :
            </p>
            <div className="space-y-1.5">
              {[
                'Droit d\'accès — Vous pouvez demander à tout moment une copie de l\'ensemble de vos données personnelles stockées par Kinzola.',
                'Droit de modification — Vous pouvez modifier vos informations personnelles directement depuis les paramètres de votre profil dans l\'application.',
                'Droit de suppression — Vous pouvez demander la suppression définitive de votre compte et de toutes vos données associées depuis les paramètres > Supprimer mon compte.',
                'Droit de portabilité — Vos données peuvent être exportées dans un format lisible et transférable si vous en faites la demande.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-yellow-500" />
                  <p className={`text-[12px] leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/60'}`}>{text}</p>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* Badge verification notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(43, 127, 255, 0.06)', border: '1px solid rgba(43, 127, 255, 0.12)' }}>
            <BadgeCheck className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#2B7FFF' }} />
            <div>
              <p className={`text-[12px] font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-white/75'}`}>
                Badge de vérification & Confiance
              </p>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-gray-500' : 'text-white/45'}`}>
                Pour renforcer la sécurité de notre communauté, Kinzola intègre un système de badge de vérification. Ce badge garantit qu&apos;un profil a été authentifié par notre équipe à l&apos;aide d&apos;une pièce d&apos;identité officielle et d&apos;un selfie en temps réel. Les documents sont traités de manière sécurisée et supprimés immédiatement après vérification.
              </p>
            </div>
          </div>

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
                : 'linear-gradient(135deg, #a855f7, #7C3AED)',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
            }}
          >
            {accepted ? (
              <>
                <Check className="w-4 h-4" />
                Politique acceptée
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                J&apos;accepte la politique
              </>
            )}
          </motion.button>

          <p className={`text-[10px] text-center ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
            Pour toute question, contactez-nous à privacy@kinzola.app
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
