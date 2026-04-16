'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Check, Copy, MoreHorizontal } from 'lucide-react';

// ─── Types ───
interface SharePanelProps {
  post: {
    id: string;
    content: string;
    authorName: string;
    imageUrl?: string;
  };
  onClose: () => void;
}

// ─── Social platforms configuration ───
const SOCIAL_PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    bgGradient: 'linear-gradient(135deg, #25D366, #128C7E)',
    // SVG WhatsApp icon
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getShareUrl: (url: string, text: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + url)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    bgGradient: 'linear-gradient(135deg, #1877F2, #0D65D9)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getShareUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'messenger',
    name: 'Messenger',
    color: '#00B2FF',
    bgGradient: 'linear-gradient(135deg, #00B2FF, #006AFF)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
        <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.907 1.2 5.418 3.15 7.1.165.141.27.353.285.584l.06 1.828a.79.79 0 00.993.726l2.043-.494a.78.78 0 01.493.045c.908.37 1.9.575 2.946.575 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.362 12.338l-2.67-2.66a.75.75 0 010-1.06l.53-.53a.75.75 0 011.06 0l1.89 1.89 3.77-3.77a.75.75 0 011.06 0l.53.53a.75.75 0 010 1.06l-4.3 4.3a.75.75 0 01-1.17.14z" />
      </svg>
    ),
    getShareUrl: (url: string) =>
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=0&redirect_uri=${encodeURIComponent(url)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    bgGradient: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    getShareUrl: (url: string, _text: string) => url, // Instagram n'a pas de share URL, copie le lien
    useCopyOnly: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    bgGradient: 'linear-gradient(135deg, #25F4EE, #FE2C55)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16V11.7a4.83 4.83 0 01-3.77-1.83V6.69h3.77z" />
      </svg>
    ),
    getShareUrl: (url: string) => url, // TikTok n'a pas de share URL directe
    useCopyOnly: true,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    color: '#FFFC00',
    bgGradient: 'linear-gradient(135deg, #FFFC00, #FFD700)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.15.3.09.656.18 1.022.315.39.14.6.36.6.58 0 .12-.06.27-.195.435-.12.15-.36.285-.735.39-.39.12-.93.2-1.53.27a.44.44 0 00-.39.39.96.96 0 01-.04.17c-.07.21-.19.34-.38.4-.19.06-.46.06-.81-.03a4.3 4.3 0 00-.4-.08c-.57-.09-.94.08-1.18.54-.22.42-.39.93-.56 1.41-.15.42-.28.79-.42 1.08-.04.08-.09.15-.15.21-.19.2-.43.25-.71.25-.28 0-.58-.05-.87-.14-.3-.09-.6-.14-.87-.14-.12 0-.23.01-.33.03-.39.09-.73.24-1.1.24-.07 0-.14 0-.21-.01-.19-.02-.39-.06-.58-.12-.14-.04-.27-.06-.39-.06-.25 0-.48.08-.7.17-.22.09-.44.17-.66.17-.28 0-.52-.06-.71-.26a.72.72 0 01-.15-.21c-.14-.29-.27-.66-.42-1.08-.17-.48-.34-.99-.56-1.41-.24-.46-.61-.63-1.18-.54a4.3 4.3 0 00-.4.08c-.35.09-.62.09-.81.03-.19-.06-.31-.19-.38-.4a.96.96 0 01-.04-.17.44.44 0 00-.39-.39c-.6-.07-1.14-.15-1.53-.27-.375-.105-.615-.24-.735-.39-.135-.165-.195-.315-.195-.435 0-.22.21-.44.6-.58.366-.135.722-.225 1.022-.315.198-.06.326-.105.401-.15a10.2 10.2 0 01-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.853 1.069 11.216.793 12.206.793z" />
      </svg>
    ),
    getShareUrl: (url: string) => url, // Snapchat n'a pas de share URL directe
    useCopyOnly: true,
  },
];

// ─── Generate unique share link for a post ───
function generateShareLink(postId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kinzola.app';
  return `${baseUrl}/post/${postId}`;
}

// ─── Share Panel Component ───
export default function SharePanel({ post, onClose }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const shareLink = generateShareLink(post.id);

  const shareText = `Découvre cette publication de ${post.authorName} sur Kinzola 💙`;

  // ─── Primary platforms (Web Share URLs) ───
  const primaryPlatforms = SOCIAL_PLATFORMS.filter(p => !p.useCopyOnly);
  // ─── Secondary platforms (Copy link only) ───
  const secondaryPlatforms = SOCIAL_PLATFORMS.filter(p => p.useCopyOnly);

  // ─── Open share URL ───
  const handleShareToApp = useCallback((platform: typeof SOCIAL_PLATFORMS[0]) => {
    if (platform.useCopyOnly) {
      // Pour Instagram, TikTok, Snapchat → copier le lien
      copyToClipboard();
      return;
    }

    const url = platform.getShareUrl(shareLink, shareText);
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    onClose();
  }, [shareLink, shareText, onClose]);

  // ─── Copy link to clipboard ───
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback : sélectionner un input caché
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareLink]);

  // ─── Web Share API (mobile native) ───
  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title: 'Kinzola — Publication',
        text: shareText,
        url: shareLink,
      });
      onClose();
    } catch (err) {
      // L'utilisateur a annulé ou une erreur est survenue
      if ((err as Error).name !== 'AbortError') {
        console.warn('Web Share API error:', err);
      }
    }
  }, [shareLink, shareText, onClose]);

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{
          background: 'var(--card-bg, #0A1F3C)',
          maxHeight: '70vh',
        }}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-base font-bold">Partager la publication</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Post preview ─── */}
        <div className="mx-5 mt-4 mb-3 flex gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {post.imageUrl ? (
            <img src={post.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}>
              <span className="text-lg">✨</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">{post.authorName}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{post.content}</p>
          </div>
        </div>

        {/* ─── Primary platforms grid ─── */}
        <div className="px-5 py-2">
          <div className="grid grid-cols-4 gap-4">
            {primaryPlatforms.map((platform) => (
              <motion.button
                key={platform.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleShareToApp(platform)}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: platform.bgGradient }}
                >
                  {platform.icon}
                </div>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {platform.name}
                </span>
              </motion.button>
            ))}

            {/* More button (secondary platforms) */}
            {!showMore && (
              <motion.button
                key="more-btn"
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMore(true)}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <MoreHorizontal className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Plus</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* ─── Secondary platforms (shown after "Plus") ─── */}
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 py-2">
                <div className="grid grid-cols-4 gap-4">
                  {secondaryPlatforms.map((platform) => (
                    <motion.button
                      key={platform.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleShareToApp(platform)}
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                          background: platform.bgGradient,
                          boxShadow: platform.id === 'snapchat'
                            ? '0 4px 12px rgba(255, 252, 0, 0.3)'
                            : undefined,
                        }}
                      >
                        {platform.icon}
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {platform.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Copy Link ─── */}
        <div className="px-5 py-4 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl cursor-pointer transition-colors"
            style={{
              background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Lien copié !</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Copier le lien</span>
              </>
            )}
          </motion.button>

          {/* Link preview */}
          <div className="mt-2 px-3 py-2 rounded-lg truncate" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{shareLink}</p>
          </div>
        </div>

        {/* ─── Native Share button (mobile) ─── */}
        {hasNativeShare && (
          <div className="px-5 pb-6">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNativeShare}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
              }}
            >
              <Copy className="w-4 h-4" />
              Partager via…
            </motion.button>
          </div>
        )}

        {/* Safe area */}
        {!hasNativeShare && <div className="h-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />}
      </motion.div>
    </motion.div>
  );
}
