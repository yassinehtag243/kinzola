'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Clock, Check } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { uploadPostImage } from '@/lib/supabase/storage-service';

export default function CreatePost() {
  const { user, setShowNewPost, createPost } = useKinzolaStore();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSize, setImageSize] = useState<string>('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) return;

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setImageUrl('');
      setPendingImageFile(null);
      setImageSize('Fichier trop volumineux (max 15MB)');
      return;
    }

    // Format file size
    const sizeKB = file.size / 1024;
    const sizeMB = sizeKB / 1024;
    if (sizeMB >= 1) {
      setImageSize(`${sizeMB.toFixed(1)} MB`);
    } else {
      setImageSize(`${Math.round(sizeKB)} Ko`);
    }

    // Store the File object for Supabase upload
    setPendingImageFile(file);
    setUploadError(null);

    // Keep FileReader for instant local preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImageUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePublish = async () => {
    if (!content.trim() && !imageUrl.trim()) return;
    setIsPublishing(true);
    setUploadError(null);

    try {
      let finalImageUrl: string | undefined = undefined;

      // Upload image to Supabase Storage if a new file was selected
      if (pendingImageFile && user?.id) {
        const uploadResult = await uploadPostImage(user.id, pendingImageFile);
        if (uploadResult.error || !uploadResult.url) {
          console.error('[Post] Image upload failed:', uploadResult.error);
          setUploadError('Erreur lors de l\'envoi de l\'image. Veuillez réessayer.');
          setIsPublishing(false);
          return;
        }
        finalImageUrl = uploadResult.url;
        console.log('[Post] Image uploaded to:', finalImageUrl);
      } else if (imageUrl && !pendingImageFile) {
        // No new file — keep existing URL (shouldn't happen normally)
        finalImageUrl = imageUrl;
      }

      createPost(content, finalImageUrl, isPublic ? 'public' : 'friends');
      setContent('');
      setImageUrl('');
      setImageSize('');
      setPendingImageFile(null);
      setIsPublic(true);
      setIsPublishing(false);
      setShowSuccess(true);

      // Close modal after success animation
      setTimeout(() => {
        setShowNewPost(false);
      }, 600);
    } catch (err) {
      console.error('[Post] Publish failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Erreur lors de la publication');
      setIsPublishing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewPost(false)} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full rounded-t-3xl flex flex-col max-h-[85vh]"
        style={{
          background: 'rgba(10, 20, 40, 0.95)',
          backdropFilter: 'blur(30px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.2)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2">
          <button onClick={() => setShowNewPost(false)} className="p-1">
            <X className="w-6 h-6 text-white" />
          </button>
          <h3 className="text-lg font-bold">Nouvelle publication</h3>
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.button
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="px-4 py-1.5 rounded-full text-white text-sm font-semibold flex items-center gap-1.5"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                }}
              >
                <Check className="w-4 h-4" />
                Publié !
              </motion.button>
            ) : (
              <motion.button
                key="publish"
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handlePublish}
                disabled={isPublishing || (!content.trim() && !imageUrl.trim())}
                className="px-4 py-1.5 rounded-full text-white text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                }}
              >
                {isPublishing ? (
                  <span className="flex items-center gap-1.5">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' as const }}
                      className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Publication...
                  </span>
                ) : (
                  'Publier'
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Upload error toast */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-5 mt-1 px-4 py-2.5 rounded-xl text-xs text-red-300 flex items-center gap-2"
              style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <span>⚠️</span>
              <span className="flex-1">{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-red-300 hover:text-red-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          <textarea
            placeholder="Partagez quelque chose..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={500}
            className="w-full py-3 px-0 bg-transparent text-white text-base placeholder:text-kinzola-muted/50 focus:outline-none resize-none"
          />
          
          {/* Image preview */}
          {imageUrl && (
            <motion.div
              key="image-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-xl overflow-hidden"
            >
              <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover" />
              {/* Upload overlay during publishing */}
              {isPublishing && pendingImageFile && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' as const }}
                    className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full"
                  />
                </div>
              )}
              {!isPublishing && (
                <button
                  onClick={() => { setImageUrl(''); setImageSize(''); setPendingImageFile(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
              {imageSize && !imageSize.startsWith('Fichier') && (
                <div className="absolute bottom-2 left-2 glass px-2 py-1 rounded-full">
                  <span className="text-[10px] text-white/80">{imageSize}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Error message for file too large */}
          {!imageUrl && imageSize.startsWith('Fichier') && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-400"
            >
              {imageSize}
            </motion.p>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Add photo button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full glass text-sm text-kinzola-muted hover:text-white transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              Ajouter photo
            </button>
            <span className="text-[10px] text-kinzola-muted/50">Max 15MB</span>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div>
              <p className="text-sm font-medium">Visibilité</p>
              <p className="text-xs text-kinzola-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {'48h'} après publication
              </p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                isPublic ? 'text-white' : 'glass text-kinzola-muted'
              }`}
              style={isPublic ? {
                background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              } : {}}
            >
              {isPublic ? 'Public (48h)' : 'Amis (48h)'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
