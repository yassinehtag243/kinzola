'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import type { Story } from '@/types';

interface StoryViewerModalProps {
  userId: string;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewerModal({ userId, onClose }: StoryViewerModalProps) {
  const stories = useKinzolaStore((s) => s.stories);
  const theme = useKinzolaStore((s) => s.theme);
  const isLight = theme === 'light';

  // Filter stories by author and group them
  const userStories = stories.filter((s) => s.authorId === userId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentStory = userStories[currentIndex] || null;
  const totalStories = userStories.length;

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= STORY_DURATION) {
        // Advance to next story or close
        if (currentIndex < totalStories - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, totalStories, onClose]);

  const goNext = useCallback(() => {
    if (currentIndex < totalStories - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, totalStories, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  if (!currentStory || totalStories === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: '#000' }}
    >
      {/* ─── Progress bars ─── */}
      <div className="flex gap-1 px-3 pt-3 safe-top absolute top-0 left-0 right-0 z-20">
        {userStories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.25)' }}>
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear"
              style={{
                background: i < currentIndex ? '#FFFFFF' : i === currentIndex ? '#FFFFFF' : 'transparent',
                width: i < currentIndex ? '100%' : `${progress}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 pt-8 pb-2 absolute top-0 left-0 right-0 z-20"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}>
        <div className="flex items-center gap-3">
          <img
            src={currentStory.authorPhoto}
            alt={currentStory.authorName}
            className="w-9 h-9 rounded-full object-cover"
            style={{ border: '2px solid rgba(255,255,255,0.3)' }}
          />
          <div>
            <p className="text-white text-sm font-semibold leading-tight">{currentStory.authorName}</p>
            <p className="text-white/50 text-[10px] leading-tight">
              {new Date(currentStory.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          aria-label="Fermer la story"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* ─── Story Content ─── */}
      <div className="flex-1 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {currentStory.type === 'photo' && currentStory.imageUrl ? (
              <img
                src={currentStory.imageUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              /* Text story */
              <div
                className="w-full h-full flex items-center justify-center px-8"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, #f8fafc, #e2e8f0)'
                    : 'linear-gradient(135deg, #1a1a2e, #16213e)',
                }}
              >
                <div className="max-w-md text-center">
                  {/* Decorative gradient ring */}
                  <div
                    className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #FF4D8D, #2B7FFF, #FF4D8D)',
                      backgroundSize: '200% 200%',
                      animation: 'gradient-rotate 3s ease infinite',
                    }}
                  >
                    <div
                      className="w-[88px] h-[88px] rounded-full flex items-center justify-center"
                      style={{
                        background: isLight ? '#f8fafc' : '#1a1a2e',
                      }}
                    >
                      <img
                        src={currentStory.authorPhoto}
                        alt={currentStory.authorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <p
                    className="text-2xl font-bold leading-relaxed"
                    style={{ color: isLight ? '#1a1a2e' : '#FFFFFF' }}
                  >
                    {currentStory.content}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ─── Tap zones ─── */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          style={{ background: 'transparent' }}
          aria-label="Story précédente"
        />
        <button
          onClick={goNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          style={{ background: 'transparent' }}
          aria-label="Story suivante"
        />

        {/* ─── Navigation arrows (visible on hover / multiple stories) ─── */}
        {totalStories > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10"
                style={{ background: 'rgba(0,0,0,0.3)' }}
                aria-label="Story précédente"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            {currentIndex < totalStories - 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-10"
                style={{ background: 'rgba(0,0,0,0.3)' }}
                aria-label="Story suivante"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}
          </>
        )}
      </div>

      {/* ─── Bottom gradient for text overlay ─── */}
      {currentStory.type === 'photo' && currentStory.imageUrl && (
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          }}
        />
      )}

      {/* ─── Story counter ─── */}
      {totalStories > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <span className="text-white text-xs font-medium">
              {currentIndex + 1} / {totalStories}
            </span>
          </div>
        </div>
      )}

      {/* Inline keyframe for gradient rotation */}
      <style jsx global>{`
        @keyframes gradient-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </motion.div>
  );
}
