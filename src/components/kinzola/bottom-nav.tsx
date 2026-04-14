'use client';

import { motion } from 'framer-motion';
import { Compass, Newspaper, MessageCircle, User } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import type { TabType } from '@/types';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'discover', label: 'Découvrir', icon: <Compass className="w-6 h-6" /> },
  { id: 'news', label: 'Actualité', icon: <Newspaper className="w-6 h-6" /> },
  { id: 'messages', label: 'Discussions', icon: <MessageCircle className="w-6 h-6" /> },
  { id: 'profile', label: 'Profil', icon: <User className="w-6 h-6" /> },
];

export default function BottomNav() {
  const { currentTab, setTab, conversations } = useKinzolaStore();

  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="w-full z-50 safe-bottom flex-shrink-0">
      <div className="glass-strong w-full">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className="relative flex flex-col items-center justify-center py-1 px-4 min-w-[72px] rounded-2xl transition-all duration-300"
              >
                {isActive && (
                  <motion.div
                    layoutId="navActiveIndicator"
                    className="absolute -bottom-0.5 w-8 h-[3px] rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 transition-colors duration-300">
                  {isActive ? (
                    <span className="gradient-text">{tab.icon}</span>
                  ) : (
                    <span className="text-[#8899B4]">{tab.icon}</span>
                  )}
                </span>
                <span
                  className={`relative z-10 text-[10px] mt-1 font-medium transition-colors duration-300 ${
                    isActive ? 'gradient-text' : 'text-[#8899B4]'
                  }`}
                >
                  {tab.label}
                </span>
                {tab.id === 'messages' && unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 right-2 z-20 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                    style={{
                      background: 'linear-gradient(135deg, #FF4D8D, #FF2D6D)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'white',
                      boxShadow: '0 0 12px rgba(255, 77, 141, 0.4)',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
