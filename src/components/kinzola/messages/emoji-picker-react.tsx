'use client';

import { memo, useState, useEffect } from 'react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { motion } from 'framer-motion';
import { useKinzolaStore } from '@/store/use-kinzola-store';

interface EmojiPickerReactProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default memo(function EmojiPickerReact({ onSelect, onClose }: EmojiPickerReactProps) {
  const theme = useKinzolaStore((s) => s.theme);
  const isLight = theme === 'light';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
  };

  if (!mounted) {
    // Return placeholder skeleton during SSR/hydration to avoid mismatch
    return (
      <>
        <div
          className="fixed inset-0 z-50"
          style={{ background: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)' }}
          onClick={onClose}
        />
        <div className="absolute bottom-full left-0 right-0 z-50">
          <div
            className="glass-strong rounded-t-2xl overflow-hidden flex items-center justify-center"
            style={{
              maxHeight: '280px',
              height: '280px',
              boxShadow: isLight
                ? '0 -8px 32px rgba(0, 0, 0, 0.12)'
                : '0 -8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span className={`text-sm ${isLight ? 'text-gray-400' : 'text-kinzola-muted'}`}>Chargement…</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      {/* Picker panel - positioned above the input bar */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-full left-0 right-0 z-50"
      >
        <div
          className="glass-strong rounded-t-2xl overflow-hidden"
          style={{
            maxHeight: '280px',
            boxShadow: isLight
              ? '0 -8px 32px rgba(0, 0, 0, 0.12)'
              : '0 -8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <style>{`
            .kinzola-emoji-picker .epr-main {
              background: transparent !important;
              border: none !important;
            }
            .kinzola-emoji-picker .epr-body {
              background: transparent !important;
            }
            .kinzola-emoji-picker .epr-scroll-wrapper {
              background: transparent !important;
            }
            .kinzola-emoji-picker .epr-search-container input {
              background: ${isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)'} !important;
              border: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'} !important;
              border-radius: 12px !important;
              color: ${isLight ? '#1a1a2e' : '#ffffff'} !important;
              font-size: 14px !important;
            }
            .kinzola-emoji-picker .epr-search-container input::placeholder {
              color: ${isLight ? 'rgba(100, 116, 139, 0.5)' : 'rgba(136, 153, 180, 0.5)'} !important;
            }
            .kinzola-emoji-picker .epr-search-container input:focus {
              border-color: rgba(43, 127, 255, 0.5) !important;
              box-shadow: 0 0 15px rgba(43, 127, 255, 0.15) !important;
            }
            .kinzola-emoji-picker .epr-category-nav {
              background: ${isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 20, 40, 0.95)'} !important;
              border-top: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)'} !important;
            }
            .kinzola-emoji-picker .epr-category-nav button {
              filter: none !important;
            }
            .kinzola-emoji-picker .epr-category-nav button:hover,
            .kinzola-emoji-picker .epr-category-nav button.active {
              filter: brightness(1.3) !important;
            }
            .kinzola-emoji-picker .epr-emoji-category-label {
              background: transparent !important;
              color: ${isLight ? 'rgba(100, 116, 139, 0.6)' : 'rgba(136, 153, 180, 0.6)'} !important;
            }
            .kinzola-emoji-picker {
              background: transparent !important;
            }
            .kinzola-emoji-picker::-webkit-scrollbar {
              width: 4px;
            }
            .kinzola-emoji-picker::-webkit-scrollbar-track {
              background: transparent;
            }
            .kinzola-emoji-picker::-webkit-scrollbar-thumb {
              background: rgba(43, 127, 255, 0.3);
              border-radius: 4px;
            }
          `}</style>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchPlaceholder="Rechercher..."
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            width="100%"
            height={280}
            theme={isLight ? 'light' : 'dark'}
            className="kinzola-emoji-picker"
            lazyLoadEmojis
          />
        </div>
      </motion.div>
    </>
  );
});
