'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Eye } from 'lucide-react';
import type { Story } from '@/types';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

// Client-only time — avoids hydration mismatch
function useClientTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function getTimeAgo(dateStr: string, now: Date): string {
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "À l'instant";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
}

const slideVariants = {
  enter: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? '100%' : '-100%',
    opacity: 1,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? '-100%' : '100%',
    opacity: 1,
  }),
};

const heartPopVariant = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.3, 1],
    opacity: [0, 1, 1],
    transition: { type: 'tween', duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    scale: 1,
    opacity: 0,
    transition: { duration: 0.3, delay: 0.5 },
  },
};

function ProgressBar({ progress, isActive }: { progress: number; isActive: boolean }) {
  return (
    <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}
        initial={{ width: isActive ? '0%' : '100%' }}
        animate={{ width: `${progress}%` }}
        transition={isActive ? { duration: STORY_DURATION / 1000, ease: 'linear' } : { duration: 0 }}
      />
    </div>
  );
}

function StoryContent({ story }: { story: Story }) {
  if (story.type === 'photo' && story.imageUrl) {
    return (
      <div className="absolute inset-0">
        <img
          src={story.imageUrl}
          alt={story.content}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-40" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 h-60" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)' }} />
      </div>
    );
  }

  // Text story with gradient background
  return (
    <div className="absolute inset-0 animate-gradient" style={{
      background: 'linear-gradient(135deg, #0A1F3C, #0D2847, #1A0A2E)',
      backgroundSize: '200% 200%',
    }}>
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(43, 127, 255, 0.1), transparent)',
        filter: 'blur(80px)',
      }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full" style={{
        background: 'radial-gradient(circle, rgba(255, 77, 141, 0.1), transparent)',
        filter: 'blur(60px)',
      }} />
      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-40" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
    </div>
  );
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [showHeart, setShowHeart] = useState(false);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const clientNow = useClientTime();

  const story = stories[currentIndex];

  const isLiked = story ? (likedStories[story.id] ?? false) : false;
  const likeCount = story ? story.likes + (isLiked ? 1 : 0) : 0;

  // Auto-advance timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= STORY_DURATION) {
        clearInterval(timerRef.current!);
        if (currentIndex < stories.length - 1) {
          setDirection('next');
          setCurrentIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, stories.length, onClose]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setDirection('next');
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const tapWidth = rect.width;

      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (!isLiked && story) {
          setLikedStories((prev) => ({ ...prev, [story.id]: true }));
          setShowHeart(true);
          setTimeout(() => setShowHeart(false), 800);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      setTimeout(() => {
        if (lastTapRef.current === 0) return;
        if (now !== lastTapRef.current) return;
        if (tapX < tapWidth * 0.3) {
          goToPrevious();
        } else {
          goToNext();
        }
      }, 310);
    },
    [goToPrevious, goToNext, isLiked, story],
  );

  const handleLike = useCallback(() => {
    if (!story) return;
    setLikedStories((prev) => {
      const isCurrentlyLiked = prev[story.id] ?? false;
      return { ...prev, [story.id]: !isCurrentlyLiked };
    });
  }, [story]);

  if (!story) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Story Background & Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={story.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <StoryContent story={story} />
        </motion.div>
      </AnimatePresence>

      {/* Header - Progress bars + Author info */}
      <div className="relative z-10 safe-top">
        {/* Progress bars - 2px height, gradient fill */}
        <div className="flex items-center gap-1 px-3 pt-3">
          {stories.map((_, index) => (
            <ProgressBar
              key={`progress-${index}`}
              progress={
                index < currentIndex
                  ? 100
                  : index === currentIndex
                    ? progress
                    : 0
              }
              isActive={index === currentIndex}
            />
          ))}
        </div>

        {/* Author bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full p-[2px]"
              style={{
                background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              }}
            >
              <div className="w-full h-full rounded-full p-[1.5px] bg-kinzola-bg">
                <img
                  src={story.authorPhoto}
                  alt={story.authorName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{story.authorName}</h3>
              <p className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{clientNow ? getTimeAgo(story.createdAt, clientNow) : '…'}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Tap zones - left 30% = prev, right 70% = next */}
      <div className="absolute inset-0 z-20 flex" onClick={handleTap}>
        <div className="w-[30%] h-full" />
        <div className="w-[70%] h-full" />
      </div>

      {/* Photo story text overlay */}
      {story.type === 'photo' && story.content && (
        <motion.div
          className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white text-lg font-medium leading-relaxed" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {story.content}
          </p>
        </motion.div>
      )}

      {/* Text story centered content */}
      {story.type === 'text' && (
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center px-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-2xl font-bold text-white text-center leading-relaxed">
            {story.content}
          </p>
        </motion.div>
      )}

      {/* Footer - only for text stories */}
      {story.type === 'text' && (
        <motion.div
          className="absolute bottom-0 inset-x-0 z-20 glass-strong"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 safe-bottom">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                <Eye className="w-3.5 h-3.5" />
                {story.views}
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                <Heart className="w-3.5 h-3.5" />
                {likeCount}
              </span>
            </div>
            <motion.button
              onClick={handleLike}
              whileTap={{ scale: 0.8 }}
              className="w-9 h-9 flex items-center justify-center rounded-full"
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ type: 'tween', duration: 0.3 }}
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    isLiked
                      ? 'text-kinzola-pink fill-kinzola-pink'
                      : 'text-white/60'
                  }`}
                />
              </motion.div>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            key="heart-pop"
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            variants={heartPopVariant}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Heart
              className="w-24 h-24 text-kinzola-pink fill-kinzola-pink"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(255, 77, 141, 0.5))' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
