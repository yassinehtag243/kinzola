'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useRef, useCallback } from 'react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

interface PhotoActionMenuProps {
  onSendImage: (file: File) => void;
  onClose: () => void;
  visible: boolean;
}

export default function PhotoActionMenu({ onSendImage, onClose, visible }: PhotoActionMenuProps) {
  const theme = useKinzolaStore((s) => s.theme);
  const isLight = theme === 'light';

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleGalleryClick = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onSendImage(file);
        onClose();
      }
      e.target.value = '';
    },
    [onSendImage, onClose],
  );

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key="photo-action-menu"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-full left-0 right-0 z-40"
          >
            <div
              className="glass-strong rounded-2xl overflow-hidden p-3 space-y-2"
              style={{
                boxShadow: isLight
                  ? '0 -8px 32px rgba(0, 0, 0, 0.12)'
                  : '0 -8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-xs font-semibold text-kinzola-muted uppercase tracking-wider">
                  Envoyer une photo
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={onClose}
                  onKeyDown={(e) => { if (e.key === 'Enter') onClose(); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-kinzola-muted" />
                </div>
              </div>

              {/* Camera option */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleCameraClick}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCameraClick(); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-all cursor-pointer group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.2), rgba(43, 127, 255, 0.05))',
                    border: '1px solid rgba(43, 127, 255, 0.2)',
                  }}
                >
                  <Camera className="w-5 h-5 text-kinzola-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Appareil photo</p>
                  <p className="text-xs text-kinzola-muted mt-0.5">Prendre une nouvelle photo</p>
                </div>
              </div>

              {/* Gallery option */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleGalleryClick}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGalleryClick(); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-all cursor-pointer group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 77, 141, 0.2), rgba(255, 77, 141, 0.05))',
                    border: '1px solid rgba(255, 77, 141, 0.2)',
                  }}
                >
                  <ImageIcon className="w-5 h-5 text-kinzola-pink" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Galerie</p>
                  <p className="text-xs text-kinzola-muted mt-0.5">Choisir dans la galerie</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
