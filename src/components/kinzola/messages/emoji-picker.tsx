'use client';

import { useState, memo } from 'react';
import { motion } from 'framer-motion';

interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😋',
      '😜', '🤪', '😎', '🤩', '😏', '😌', '🥺', '😢',
      '😭', '😤', '🤯', '😱', '🤗', '🤔', '🫡', '😴',
      '🥱', '😬', '🙄', '😏', '🤫', '🤭', '😈', '👻',
    ],
  },
  {
    id: 'gestes',
    label: 'Gestes',
    icon: '👋',
    emojis: [
      '👋', '🤚', '✋', '🖖', '👌', '🤌', '✌️', '🤞',
      '🫶', '🤝', '👍', '👎', '👏', '🙌', '🤦', '🫣',
      '💪', '🙏', '🤟', '✍️', '💅', '🤳', '💃', '🕺',
    ],
  },
  {
    id: 'coeurs',
    label: 'Cœurs',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘',
      '💝', '💟', '♥️', '🫀', '💋', '💘', '🥂', '✨',
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌸',
    emojis: [
      '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🍀', '🌿',
      '🌴', '🌊', '⭐', '🌙', '☀️', '🌈', '🔥', '💧',
      '❄️', '🦋', '🐝', '🐱', '🐶', '🦁', '🦊', '🐻',
    ],
  },
  {
    id: 'nourriture',
    label: 'Nourriture',
    icon: '🍕',
    emojis: [
      '🍕', '🍔', '🍟', '🌮', '🍣', '🍦', '🍩', '🍰',
      '🍫', '🍪', '☕', '🧋', '🍷', '🍹', '🥂', '🍻',
      '🍎', '🍉', '🥑', '🍿', '🧁', '🎂', '🍓', '🍒',
    ],
  },
  {
    id: 'objets',
    label: 'Objets',
    icon: '🎉',
    emojis: [
      '🎉', '🎊', '🎁', '🎈', '🔥', '⭐', '💎', '👑',
      '💰', '📱', '💻', '📷', '🎵', '🎶', '💪', '🏆',
      '🎯', '📍', '🔔', '💬', '💭', '💡', '🎮', '✈️',
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default memo(function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('smileys');

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
  };

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      {/* Picker panel - positioned above the input bar */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="absolute bottom-full left-0 right-0 z-50"
      >
        <div
          className="glass-strong rounded-t-2xl overflow-hidden max-h-[260px] flex flex-col"
          style={{
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Category tabs */}
          <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {EMOJI_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === category.id
                    ? ''
                    : 'text-kinzola-muted hover:bg-white/5 border border-transparent'
                }`}
                style={activeCategory === category.id ? {
                  background: 'rgba(43, 127, 255, 0.2)',
                  color: '#2B7FFF',
                  border: '1px solid rgba(43, 127, 255, 0.3)',
                } : {}}
              >
                <span className="text-sm">{category.icon}</span>
                <span className="hidden sm:inline">{category.label}</span>
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {currentCategory && (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-8 gap-0.5"
              >
                {currentCategory.emojis.map((emoji, index) => (
                  <motion.button
                    key={`${emoji}-${index}`}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleSelect(emoji)}
                    className="flex items-center justify-center w-full aspect-square rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors text-xl sm:text-2xl"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
});
