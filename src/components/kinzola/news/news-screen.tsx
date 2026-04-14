'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, MessageCircle, Eye, Clock, Send, Bell, X, Plane, Globe, Lock, Share2, Users, Image as ImageIcon, Check } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import StoryViewer from './story-viewer';
import NotificationPanel from './notification-panel';
import SharePanel from './share-panel';

// Client-only time functions — return stable placeholder on SSR
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

function getExpiresLabel(expiresAt: string, type: string, now: Date): string {
  const exp = new Date(expiresAt);
  const diffHours = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60));
  if (type === 'photo') {
    if (diffHours < 1) return `${Math.floor((exp.getTime() - now.getTime()) / (1000 * 60))}min restantes`;
    return `${diffHours}h restantes`;
  }
  return `${diffHours}h restantes`;
}

function CommentTimeAgo({ dateStr }: { dateStr: string }) {
  const clientNow = useClientTime();
  if (!clientNow) return <span className="text-[10px] text-kinzola-muted">...</span>;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return <span className="text-[10px] text-kinzola-muted">À l&apos;instant</span>;
  if (diffMinutes < 60) return <span className="text-[10px] text-kinzola-muted">{diffMinutes}min</span>;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return <span className="text-[10px] text-kinzola-muted">{diffHours}h</span>;
  const diffDays = Math.floor(diffHours / 24);
  return <span className="text-[10px] text-kinzola-muted">{diffDays}j</span>;
}

export default function NewsScreen() {
  const {
    posts,
    stories,
    matches,
    user,
    likePost,
    createPost,
    notifications,
    showNotifications,
    setShowNotifications,
    commentingPostId,
    addComment,
    setCommentingPostId,
  } = useKinzolaStore();

  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState<string | null>(null);
  const [showCommentBar, setShowCommentBar] = useState(false);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);

  // Inline compose state
  const [composeText, setComposeText] = useState('');
  const [composeImage, setComposeImage] = useState('');
  const postPhotoInputRef = useRef<HTMLInputElement>(null);
  const [composeVisibility, setComposeVisibility] = useState<'public' | 'friends'>('public');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);

  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentListRef = useRef<HTMLDivElement>(null);
  const postsListRef = useRef<HTMLDivElement>(null);
  const clientNow = useClientTime();
  const [composeOpacity, setComposeOpacity] = useState(1);

  const handleFeedScroll = useCallback(() => {
    if (!postsListRef.current) return;
    const scrollTop = postsListRef.current.scrollTop;
    // Start fading at 40px, fully hidden at 160px
    const fadeStart = 40;
    const fadeEnd = 160;
    if (scrollTop <= fadeStart) {
      setComposeOpacity(1);
    } else if (scrollTop >= fadeEnd) {
      setComposeOpacity(0);
    } else {
      const progress = (scrollTop - fadeStart) / (fadeEnd - fadeStart);
      setComposeOpacity(1 - progress);
    }
  }, []);
  const prevPostsLengthRef = useRef(posts.length);

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const commentingPost = posts.find(p => p.id === commentingPostId);

  // ─── Compute which posts the current user can see ───
  // Public posts: everyone sees them
  // Friends posts: only visible if the author is in the current user's matches
  // OR if the current user is the author
  const matchUserIds = useMemo(() => {
    const ids = new Set<string>();
    matches.forEach(m => {
      ids.add(m.user1Id);
      ids.add(m.user2Id);
      ids.add(m.profile.userId);
    });
    return ids;
  }, [matches]);

  const visiblePosts = useMemo(() => {
    return posts.filter(post => {
      if (post.authorId === user?.id) return true; // own posts always visible
      if (post.visibility === 'public') return true;
      // Friends only: check if author is in matches
      return matchUserIds.has(post.authorId);
    });
  }, [posts, user, matchUserIds]);

  // Scroll to top when a new post is published
  useEffect(() => {
    if (posts.length > prevPostsLengthRef.current && postsListRef.current) {
      postsListRef.current.scrollTop = 0;
    }
    prevPostsLengthRef.current = posts.length;
  }, [posts.length]);

  // Auto-focus comment input when comment bar appears
  useEffect(() => {
    if (showCommentBar && commentInputRef.current) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  }, [showCommentBar]);

  // Auto-scroll to bottom of comments when they open
  useEffect(() => {
    if (showCommentBar && commentListRef.current) {
      setTimeout(() => {
        if (commentListRef.current) {
          commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
        }
      }, 150);
    }
  }, [showCommentBar, commentingPostId, posts]);

  const handleOpenComments = (postId: string) => {
    setCommentingPostId(postId);
    setShowCommentBar(true);
    setShowAllComments(postId);
    setCommentText('');
  };

  const handleCloseCommentBar = () => {
    setShowCommentBar(false);
    setCommentingPostId(null);
    setCommentText('');
  };

  const handleSendPrivateComment = () => {
    if (!commentText.trim() || !commentingPostId) return;
    addComment(commentingPostId, commentText.trim(), false);
    setCommentText('');
  };

  const handleSendPublicComment = () => {
    if (!commentText.trim() || !commentingPostId) return;
    addComment(commentingPostId, commentText.trim(), true);
    setCommentText('');
  };

  const handlePublish = () => {
    if (!composeText.trim() && !composeImage.trim()) return;
    setIsPublishing(true);
    setTimeout(() => {
      createPost(composeText, composeImage || undefined, composeVisibility);
      setComposeText('');
      setComposeImage('');
      setComposeVisibility('public');
      setIsPublishing(false);
      setShowPublishSuccess(true);
      setTimeout(() => setShowPublishSuccess(false), 1500);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with title + notification bell */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-1">
        <h2 className="text-xl font-bold gradient-text">Actualité</h2>
        <motion.button
          onClick={() => setShowNotifications(true)}
          whileTap={{ scale: 0.9 }}
          className="relative w-10 h-10 rounded-full flex items-center justify-center glass hover:bg-white/10 transition-colors"
          style={{ boxShadow: unreadNotifCount > 0 ? '0 0 15px rgba(255, 77, 141, 0.2)' : 'none' }}
        >
          <motion.div
            animate={unreadNotifCount > 0 ? {
              rotate: [0, -12, 12, -8, 8, 0],
            } : {}}
            transition={{
              duration: 0.6,
              repeat: 0,
              ease: 'easeInOut',
            }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>
          {unreadNotifCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
              style={{
                background: 'linear-gradient(135deg, #FF4D8D, #FF2D6D)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'white',
                boxShadow: '0 0 12px rgba(255, 77, 141, 0.4)',
              }}
            >
              {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
            </motion.span>
          )}
          {/* Pulse ring animation for unread */}
          {unreadNotifCount > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(255, 77, 141, 0.3)' }}
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>
      </div>

      {/* Stories bar - horizontal scroll */}
      <div className="flex-shrink-0 px-5 pb-3 pt-2">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {stories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => setViewingStoryIndex(index)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div
                className="w-16 h-16 rounded-full p-[2px]"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                }}
              >
                <div className="w-full h-full rounded-full p-[2px] bg-kinzola-bg">
                  <img
                    src={story.authorPhoto}
                    alt={story.authorName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] text-kinzola-muted truncate w-16 text-center">
                {story.authorName.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Inline Compose Area (smooth fade + collapse on scroll) ─── */}
      <div className="flex-shrink-0" style={{
        opacity: composeOpacity,
        maxHeight: composeOpacity >= 0.99 ? '500px' : composeOpacity > 0 ? `${500 * composeOpacity}px` : '0px',
        overflow: 'hidden',
        transition: 'opacity 0.35s ease-out, max-height 0.4s ease-out',
        transform: composeOpacity < 1 ? `translateY(${-3 * (1 - composeOpacity)}px)` : 'none',
      }}>
        <div className="px-5 pb-3" style={{ pointerEvents: composeOpacity < 0.3 ? 'none' : 'auto' }}>
        <div className="glass-card overflow-hidden">
          {/* Text input */}
          <div className="px-4 pt-3 pb-2">
            <textarea
              placeholder="Quoi de neuf ? Partagez quelque chose..."
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full bg-transparent text-sm placeholder:text-kinzola-muted/50 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Image preview */}
          <AnimatePresence>
            {composeImage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 overflow-hidden"
              >
                <div className="relative rounded-xl overflow-hidden mb-2">
                  <img src={composeImage} alt="Aperçu" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => setComposeImage('')}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full glass flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom bar: actions + visibility + publish */}
          <div className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {/* Left: Add photo */}
            <input
              ref={postPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) setComposeImage(ev.target.result as string);
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = '';
              }}
            />
            <button
              onClick={() => postPhotoInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-kinzola-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs">Photo</span>
            </button>

            {/* Center: Visibility toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setComposeVisibility('public')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
                  composeVisibility === 'public'
                    ? 'text-white shadow-lg'
                    : 'text-kinzola-muted hover:text-white'
                }`}
                style={composeVisibility === 'public' ? {
                  background: 'linear-gradient(135deg, #2B7FFF, #1B5FCC)',
                  boxShadow: '0 2px 8px rgba(43, 127, 255, 0.3)',
                } : {
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Globe className="w-3 h-3" />
                Public
              </button>
              <button
                onClick={() => setComposeVisibility('friends')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
                  composeVisibility === 'friends'
                    ? 'text-white shadow-lg'
                    : 'text-kinzola-muted hover:text-white'
                }`}
                style={composeVisibility === 'friends' ? {
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  boxShadow: '0 2px 8px rgba(255, 77, 141, 0.3)',
                } : {
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Users className="w-3 h-3" />
                Amis
              </button>
            </div>

            {/* Right: Publish button */}
            <AnimatePresence mode="wait">
              {showPublishSuccess ? (
                <motion.button
                  key="published"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full text-[11px] font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Publié !
                </motion.button>
              ) : (
                <motion.button
                  key="publish"
                  onClick={handlePublish}
                  disabled={isPublishing || (!composeText.trim() && !composeImage.trim())}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full text-[11px] font-semibold text-white transition-all disabled:opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                    boxShadow: (composeText.trim() || composeImage.trim())
                      ? '0 2px 12px rgba(43, 127, 255, 0.3)'
                      : 'none',
                  }}
                >
                  {isPublishing ? (
                    <span className="flex items-center gap-1">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span className="text-[11px]">...</span>
                    </span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Publier
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Visibility info */}
          <div className="px-4 pb-2">
            <p className="text-[10px] text-kinzola-muted/60">
              {composeVisibility === 'public' ? (
                <span className="flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  Visible par tout le monde — expire dans 48h
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  Visible uniquement par vos matchs — expire dans 48h
                </span>
              )}
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* ─── Posts Feed (scrollable, with generous bottom spacing) ─── */}
      <div ref={postsListRef} onScroll={handleFeedScroll} className="flex-1 overflow-y-auto px-5 space-y-4 scroll-optimized" style={{ paddingBottom: '100px' }}>
        {visiblePosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="w-12 h-12 text-kinzola-muted/30 mb-3" />
            <p className="text-sm text-kinzola-muted text-center">Aucune publication pour le moment</p>
            <p className="text-xs text-kinzola-muted/50 mt-1">Soyez le premier à publier !</p>
          </div>
        ) : (
          visiblePosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card overflow-hidden"
            >
              {/* Author row */}
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorPhoto}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold">{post.authorName}</h4>
                      {post.visibility === 'friends' && (
                        <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255, 77, 141, 0.12)', color: '#FF4D8D' }}>
                          <Users className="w-2.5 h-2.5" />
                          Amis
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-kinzola-muted">{clientNow ? getTimeAgo(post.createdAt, clientNow) : '…'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-kinzola-muted">
                  <Clock className="w-3 h-3" />
                  {clientNow ? getExpiresLabel(post.expiresAt, post.type, clientNow) : '…'}
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-2">
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{post.content}</p>
              </div>

              {/* Image */}
              {post.imageUrl && (
                <div className="mx-4 mb-3 rounded-xl overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full object-cover"
                    style={{ height: '260px' }}
                  />
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 px-4 py-2">
                <span className="flex items-center gap-1 text-[11px] text-kinzola-muted">
                  <Eye className="w-3 h-3" />
                  {post.views} vues
                </span>
                <span className="flex items-center gap-1 text-[11px] text-kinzola-muted">
                  <Heart className="w-3 h-3" />
                  {post.likes} j&apos;aime
                </span>
                {post.comments.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-kinzola-muted">
                    <MessageCircle className="w-3 h-3" />
                    {post.comments.length} commentaires
                  </span>
                )}
              </div>

              {/* Action bar with glass dividers */}
              <div className="flex items-center px-4 py-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <button
                  onClick={() => likePost(post.id)}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm transition-colors ${
                    post.liked ? 'text-kinzola-pink' : 'text-kinzola-muted hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-kinzola-pink' : ''}`} />
                  J&apos;aime
                </button>
                <div className="w-px h-6" style={{ background: 'rgba(255, 255, 255, 0.05)' }} />
                <button
                  onClick={() => handleOpenComments(post.id)}
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm text-kinzola-muted hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Commenter
                </button>
                <div className="w-px h-6" style={{ background: 'rgba(255, 255, 255, 0.05)' }} />
                <button
                  onClick={() => setSharingPostId(post.id)}
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm text-kinzola-muted hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
              </div>

              {/* Comments Preview (collapsed) */}
              {post.comments.length > 0 && showAllComments !== post.id && (
                <div className="px-4 pb-3 pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  {post.comments.slice(0, 2).map(comment => (
                    <div key={comment.id} className="flex gap-2">
                      <img
                        src={comment.authorPhoto}
                        alt={comment.authorName}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                      <div className="rounded-xl px-3 py-1.5" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <p className="text-xs font-semibold">{comment.authorName}</p>
                        <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => handleOpenComments(post.id)}
                    className="text-xs text-kinzola-blue pl-8"
                  >
                    Voir les {post.comments.length} commentaire{post.comments.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Comment Bar (appears above bottom nav) */}
      <AnimatePresence>
        {showCommentBar && commentingPost && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-40"
          >
            {/* Semi-transparent backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0, 0, 0, 0.4)' }}
              onClick={handleCloseCommentBar}
            />

            {/* Comment panel */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative glass-strong rounded-t-2xl"
              style={{
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
                maxHeight: '55vh',
              }}
            >
              {/* Comment panel header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 gradient-text" />
                  <h4 className="text-sm font-bold">Commentaires</h4>
                  <span className="text-xs text-kinzola-muted">
                    ({commentingPost.comments.length})
                  </span>
                </div>
                <button
                  onClick={handleCloseCommentBar}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comments list */}
              <div
                ref={commentListRef}
                className="overflow-y-auto px-4 py-3 space-y-3"
                style={{ maxHeight: '35vh' }}
              >
                {commentingPost.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <MessageCircle className="w-10 h-10 text-kinzola-muted mb-2" />
                    <p className="text-xs text-kinzola-muted text-center">
                      Aucun commentaire pour le moment. Soyez le premier !
                    </p>
                  </div>
                ) : (
                  commentingPost.comments.map(comment => (
                    <div key={comment.id} className="flex gap-2.5">
                      <img
                        src={comment.authorPhoto}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold">{comment.authorName}</p>
                            <CommentTimeAgo dateStr={comment.createdAt} />
                            {comment.isPublic && (
                              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(43, 127, 255, 0.15)', color: '#2B7FFF' }}>
                                <Globe className="w-2.5 h-2.5" />
                                Public
                              </span>
                            )}
                            {!comment.isPublic && comment.authorId === 'user-me' && (
                              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.4)' }}>
                                <Lock className="w-2.5 h-2.5" />
                                Privé
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input bar */}
              <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendPrivateComment();
                        }
                      }}
                      placeholder="Écrire un commentaire..."
                      className="input-dark w-full pr-3 py-3 text-sm"
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                  {/* Send private (send icon) */}
                  <motion.button
                    onClick={handleSendPrivateComment}
                    disabled={!commentText.trim()}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                    style={{
                      background: commentText.trim() ? 'rgba(43, 127, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: commentText.trim() ? '#2B7FFF' : '#8899B4',
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                  {/* Send public (paper plane icon) */}
                  <motion.button
                    onClick={handleSendPublicComment}
                    disabled={!commentText.trim()}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                    style={{
                      background: commentText.trim()
                        ? 'linear-gradient(135deg, #2B7FFF, #1B5FCC)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: commentText.trim() ? 'white' : '#8899B4',
                      boxShadow: commentText.trim() ? '0 4px 12px rgba(43, 127, 255, 0.3)' : 'none',
                    }}
                    title="Commentaire public"
                  >
                    <Plane className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <p className="text-[10px] text-kinzola-muted">
                    <Send className="w-3 h-3 inline mr-1" style={{ color: '#2B7FFF' }} />
                    Privé
                    <span className="mx-2">·</span>
                    <Plane className="w-3 h-3 inline mr-1" style={{ color: '#2B7FFF' }} />
                    Public pour tous
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence mode="wait">
        {viewingStoryIndex !== null && (
          <StoryViewer
            key="story-viewer"
            stories={stories}
            initialIndex={viewingStoryIndex}
            onClose={() => setViewingStoryIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <NotificationPanel />

      {/* Share Panel */}
      <AnimatePresence mode="wait">
        {sharingPostId && (
          <SharePanel
            key="share-panel"
            post={posts.find(p => p.id === sharingPostId)!}
            onClose={() => setSharingPostId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
