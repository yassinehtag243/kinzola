'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Mic, Send, Camera, Trash2, Loader2 } from 'lucide-react';
import { usePermission, PermissionModal, PermissionDeniedBanner, PermissionToast } from './permission-manager';
import dynamic from 'next/dynamic';

const EmojiPickerReact = dynamic(() => import('./emoji-picker-react'), { ssr: false });

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  onSendVoice: (content: string) => void; // format: "duration|dataUrl"
  onSendImage: (base64DataUrl: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Utility: Convert blob to data URL
// ═══════════════════════════════════════════════════════════════════════════

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string' && reader.result.length > 50) {
        resolve(reader.result);
      } else {
        reject(new Error('Invalid data URL produced'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Utility: Convert any audio blob to WAV PCM (universally supported)
// ═══════════════════════════════════════════════════════════════════════════

function convertToWav(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const ctx = new AudioContext();
        const arrayBuffer = reader.result as ArrayBuffer;
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        ctx.close();

        // Encode as WAV PCM 16-bit mono
        const numChannels = 1;
        const sampleRate = audioBuffer.sampleRate;
        const bitsPerSample = 16;
        const bytesPerSample = bitsPerSample / 8;
        const blockAlign = numChannels * bytesPerSample;
        const dataLength = audioBuffer.length * blockAlign;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset: number, str: string) => {
          for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // chunk size
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        // Interleave and write PCM data (mono: just copy channel 0)
        const channelData = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
          const sample = Math.max(-1, Math.min(1, channelData[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }

        resolve(new Blob([buffer], { type: 'audio/wav' }));
      } catch (err) {
        console.warn('[Voice] WAV conversion failed, using original blob:', err);
        // Fallback: return original blob if AudioContext can't decode
        resolve(blob);
      }
    };
    reader.onerror = () => reject(new Error('FileReader failed for WAV conversion'));
    reader.readAsArrayBuffer(blob);
  });
}

export default memo(function ChatInputBar({ onSendMessage, onSendVoice, onSendImage }: ChatInputBarProps) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const audioChunksRef = useRef<Blob[]>([]);

  // Image preview
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const pendingUrlRef = useRef<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const micBtnRef = useRef<HTMLButtonElement>(null);

  // ─── Permission system ───
  const {
    permissions,
    showModal,
    showDenied,
    showToast,
    requestPermission,
    handleGranted,
    handleDenied,
    handleRetry,
    dismissDenied,
    dismissToast,
  } = usePermission();

  const pendingActionRef = useRef<'camera' | 'gallery' | 'microphone' | null>(null);

  // Stable refs for parent callbacks
  const onSendMessageRef = useRef(onSendMessage);
  const onSendVoiceRef = useRef(onSendVoice);
  const onSendImageRef = useRef(onSendImage);
  useEffect(() => { onSendMessageRef.current = onSendMessage; }, [onSendMessage]);
  useEffect(() => { onSendVoiceRef.current = onSendVoice; }, [onSendVoice]);
  useEffect(() => { onSendImageRef.current = onSendImage; }, [onSendImage]);

  const isRecordingRef = useRef(false);
  const recordingTimeRef = useRef(0);
  const startRecordingInternalRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // ─── Handle permission grant ───
  useEffect(() => {
    if (permissions.camera === 'granted' && pendingActionRef.current === 'camera') {
      pendingActionRef.current = null;
      cameraInputRef.current?.click();
    }
    if (permissions.gallery === 'granted' && pendingActionRef.current === 'gallery') {
      pendingActionRef.current = null;
      galleryInputRef.current?.click();
    }
    if (permissions.microphone === 'granted' && pendingActionRef.current === 'microphone') {
      pendingActionRef.current = null;
      startRecordingInternalRef.current();
    }
  }, [permissions]);

  // ═══════════════════════════════════════════════════════════
  //  VOICE RECORDING — cancelRecording FIRST (no forward references)
  // ═══════════════════════════════════════════════════════════

  const cancelRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setRecordingTime(0);
  }, []);

  const startRecordingInternal = useCallback(async () => {
    // NOTE: isRecordingRef + setIsRecording(true) already set by handleMicDown for instant feedback.
    // This function handles the actual getUserMedia + MediaRecorder setup.
    try {
      // Simple constraints — no sampleRate/channelCount (causes failures on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Pick the best MIME type the browser supports natively
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
      ];
      let mimeType = '';
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
          mimeType = mt;
          break;
        }
      }
      const options: MediaRecorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 128000 }
        : { audioBitsPerSecond: 128000 };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect chunks as they arrive (every 200ms + final on stop)
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('[Voice] MediaRecorder error:', e);
        cancelRecording();
      };

      // Collect data every 200ms to ensure chunks are available
      mediaRecorder.start(200);
      recordingStartTimeRef.current = Date.now();
      recordingTimeRef.current = 0;
      setRecordingTime(0);

      recordingInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        recordingTimeRef.current = elapsed;
        setRecordingTime(elapsed);
      }, 200);

      console.log('[Voice] Recording started, MIME:', mediaRecorder.mimeType);
    } catch (err) {
      console.error('[Voice] Microphone access failed:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [cancelRecording]);

  useEffect(() => { startRecordingInternalRef.current = startRecordingInternal; }, [startRecordingInternal]);

  const stopAndSend = useCallback(async () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    const elapsed = recordingTimeRef.current;
    const recorder = mediaRecorderRef.current;
    const stream = mediaStreamRef.current;

    if (!recorder || recorder.state === 'inactive') {
      if (stream) { stream.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
      mediaRecorderRef.current = null;
      setRecordingTime(0);
      return;
    }

    // Show processing state
    setIsProcessing(true);

    // When stop() fires: one last ondataavailable, THEN onstop.
    // We create the blob inside onstop to capture ALL chunks including the final one.
    recorder.onstop = async () => {
      // Now ALL chunks have been collected
      const allChunks = [...audioChunksRef.current];
      audioChunksRef.current = [];

      // Stop media stream
      if (stream) { stream.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
      mediaRecorderRef.current = null;

      // Validate: minimum 1 second
      if (elapsed < 1) {
        console.log('[Voice] Recording too short, discarded');
        setIsProcessing(false);
        setRecordingTime(0);
        return;
      }

      // Create blob from ALL collected chunks
      const blob = new Blob(allChunks, { type: recorder.mimeType || 'audio/webm' });
      console.log('[Voice] Blob created, size:', blob.size, 'type:', blob.type, 'chunks:', allChunks.length);

      if (blob.size < 100) {
        console.warn('[Voice] Blob too small, discarding');
        setIsProcessing(false);
        setRecordingTime(0);
        return;
      }

      try {
        // Convert to WAV PCM for universal browser compatibility
        const wavBlob = await convertToWav(blob);
        const dataUrl = await blobToDataUrl(wavBlob);
        console.log('[Voice] Converted to WAV, size:', wavBlob.size, 'type:', wavBlob.type);

        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const duration = `${mins}:${secs.toString().padStart(2, '0')}`;
        const content = `${duration}|${dataUrl}`;
        console.log('[Voice] Sending voice, duration:', duration, 'dataUrl length:', dataUrl.length);
        onSendVoiceRef.current(content);
      } catch (err) {
        console.error('[Voice] Data URL conversion failed:', err);
      } finally {
        setIsProcessing(false);
        setRecordingTime(0);
      }
    };

    try {
      recorder.stop();
    } catch {
      console.error('[Voice] recorder.stop() threw');
      if (stream) { stream.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
      mediaRecorderRef.current = null;
      setIsProcessing(false);
      setRecordingTime(0);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  MIC BUTTON HANDLERS — Tap to start, buttons to send/cancel
  // ═══════════════════════════════════════════════════════════

  const handleMicDown = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (message.trim() || pendingImage || isRecordingRef.current || isProcessing) return;
    // INSTANT feedback: show recording UI immediately, before async getUserMedia
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingTime(0);
    startRecordingInternal();
  }, [message, pendingImage, startRecordingInternal, isProcessing]);

  const handleMicUp = useCallback(() => {
    // Recording is managed by the recording UI buttons (send/cancel)
  }, []);

  const handleMicLeave = useCallback(() => {
    // Recording is managed by the recording UI buttons (send/cancel)
  }, []);

  // ─── sendMessage ───
  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    onSendMessageRef.current(message.trim());
    setMessage('');
    if (inputRef.current) inputRef.current.focus();
  }, [message]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
      const url = URL.createObjectURL(file);
      pendingUrlRef.current = url;
      setImagePreviewUrl(url);
      setPendingImage(file);
      setShowPhotoMenu(false);
    }
    e.target.value = '';
  }, []);

  const handleConfirmSendImage = useCallback(async () => {
    if (pendingImage) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) onSendImageRef.current(reader.result as string);
      };
      reader.readAsDataURL(pendingImage);
      if (pendingUrlRef.current) { URL.revokeObjectURL(pendingUrlRef.current); pendingUrlRef.current = null; }
      setImagePreviewUrl(null);
      setPendingImage(null);
    }
  }, [pendingImage]);

  const handleRemovePendingImage = useCallback(() => {
    if (pendingUrlRef.current) { URL.revokeObjectURL(pendingUrlRef.current); pendingUrlRef.current = null; }
    setImagePreviewUrl(null);
    setPendingImage(null);
  }, []);

  const handleCameraClick = useCallback(async () => {
    setShowPhotoMenu(false);
    const granted = await requestPermission('camera');
    if (granted) {
      cameraInputRef.current?.click();
    } else {
      pendingActionRef.current = 'camera';
    }
  }, [requestPermission]);

  const handleGalleryClick = useCallback(async () => {
    setShowPhotoMenu(false);
    const granted = await requestPermission('gallery');
    if (granted) {
      galleryInputRef.current?.click();
    } else {
      pendingActionRef.current = 'gallery';
    }
  }, [requestPermission]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const isEmpty = message.trim() === '' && !pendingImage;

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="relative z-10">
      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* ─── Image Preview ─── */}
      <AnimatePresence mode="wait">
        {pendingImage && imagePreviewUrl && (
          <motion.div key="img-preview" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="glass-strong px-4 py-3 flex items-center gap-3" style={{ borderTop: '1px solid rgba(128,128,128,0.1)' }}>
              <img src={imagePreviewUrl} alt="Apercu" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pendingImage.name}</p>
                <p className="text-xs text-kinzola-muted">{(pendingImage.size / 1024).toFixed(0)} Ko</p>
              </div>
              <button onClick={handleRemovePendingImage} className="w-8 h-8 rounded-full glass flex items-center justify-center cursor-pointer">
                <span className="text-kinzola-muted text-sm">✕</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Permission Denied / Toast ─── */}
      <AnimatePresence>
        {showDenied && <PermissionDeniedBanner key={`denied-${showDenied}`} type={showDenied} onRetry={() => handleRetry(showDenied)} onDismiss={dismissDenied} />}
      </AnimatePresence>
      <AnimatePresence>
        {showToast && <PermissionToast key={`toast-${showToast}`} type={showToast} onDismiss={dismissToast} />}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          RECORDING UI — Replaces input bar when recording or converting
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {(isRecording || isProcessing) && (
          <motion.div
            key="recording-bar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full flex-shrink-0"
          >
            <div className="glass-strong px-4 py-3" style={{ borderTop: isProcessing ? '1px solid rgba(43, 127, 255, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="flex items-center gap-3 max-w-lg mx-auto">
                {isProcessing ? (
                  <>
                    {/* Processing spinner */}
                    <Loader2 className="w-5 h-5 text-kinzola-blue animate-spin flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-kinzola-blue">
                          Traitement audio...
                        </span>
                      </div>
                      <p className="text-[10px] text-kinzola-muted mt-0.5">
                        Envoi en cours
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Pulsing red dot */}
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ type: 'tween', duration: 1.2, repeat: Infinity }}
                      className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"
                    />

                    {/* Timer */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-mono font-bold" style={{ color: '#FF4D8D' }}>
                          {formatTime(recordingTime)}
                        </span>
                      </div>
                      <p className="text-[10px] text-kinzola-muted mt-0.5">
                        Appuyez sur ✓ pour envoyer
                      </p>
                    </div>

                    {/* Cancel button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={cancelRecording}
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
                      style={{ background: 'rgba(239, 68, 68, 0.12)' }}
                      aria-label="Annuler l'enregistrement"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </motion.button>

                    {/* Send button */}
                    <motion.button
                      key="send-voice"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={stopAndSend}
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                        boxShadow: '0 0 20px rgba(43, 127, 255, 0.4)',
                      }}
                      aria-label="Envoyer le message vocal"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          NORMAL INPUT BAR (hidden while recording)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {!isRecording && !isProcessing && (
          <motion.div
            key="normal-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex-shrink-0"
          >
            {/* Emoji Picker */}
            <AnimatePresence mode="wait">
              {showEmoji && (
                <EmojiPickerReact key="emoji" onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
              )}
            </AnimatePresence>

            {/* Photo Action Menu */}
            <AnimatePresence mode="wait">
              {showPhotoMenu && (
                <motion.div
                  key="photo-action-menu"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute bottom-full left-0 right-0 z-40"
                >
                  <div className="glass-strong rounded-2xl overflow-hidden p-3 space-y-2" style={{ boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)' }}>
                    <div className="flex items-center justify-between px-1 pb-1">
                      <span className="text-xs font-semibold text-kinzola-muted uppercase tracking-wider">Envoyer une photo</span>
                      <div role="button" tabIndex={0} onClick={() => setShowPhotoMenu(false)} onKeyDown={(e) => { if (e.key === 'Enter') setShowPhotoMenu(false); }} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer">
                        <span className="text-kinzola-muted text-sm">✕</span>
                      </div>
                    </div>
                    <div role="button" tabIndex={0} onClick={handleCameraClick} onKeyDown={(e) => { if (e.key === 'Enter') handleCameraClick(); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-all cursor-pointer group">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.2), rgba(43, 127, 255, 0.05))', border: '1px solid rgba(43, 127, 255, 0.2)' }}>
                        <Camera className="w-5 h-5 text-kinzola-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Appareil photo</p>
                        <p className="text-xs text-kinzola-muted mt-0.5">Prendre une nouvelle photo</p>
                      </div>
                    </div>
                    <div role="button" tabIndex={0} onClick={handleGalleryClick} onKeyDown={(e) => { if (e.key === 'Enter') handleGalleryClick(); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-all cursor-pointer group">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(255, 77, 141, 0.2), rgba(255, 77, 141, 0.05))', border: '1px solid rgba(255, 77, 141, 0.2)' }}>
                        <Camera className="w-5 h-5 text-kinzola-pink" />
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

            {/* Permission Modal */}
            <AnimatePresence>
              {showModal && (
                <PermissionModal key={`modal-${showModal}`} type={showModal} onGranted={() => handleGranted(showModal)} onDenied={() => handleDenied(showModal)} onRetry={() => handleRetry(showModal)} />
              )}
            </AnimatePresence>

            {/* ─── Input Bar ─── */}
            <div className="glass-strong px-3 py-3" style={{ borderTop: '1px solid rgba(128,128,128,0.1)' }}>
              <div className="flex items-center gap-1.5 max-w-lg mx-auto">
                {/* Emoji */}
                <button
                  onClick={() => { setShowEmoji(!showEmoji); setShowPhotoMenu(false); }}
                  className={`w-9 h-9 rounded-full glass flex items-center justify-center flex-shrink-0 transition-all duration-300 cursor-pointer ${showEmoji ? 'ring-2' : ''}`}
                  style={showEmoji ? { boxShadow: '0 0 0 2px rgba(43, 127, 255, 0.4)' } : {}}
                >
                  <Smile className={`w-[20px] h-[20px] transition-colors duration-300 ${showEmoji ? 'text-kinzola-blue' : 'text-kinzola-muted'}`} />
                </button>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ecrire un message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 glass rounded-full px-4 py-2 text-sm outline-none transition-all duration-300 placeholder:text-kinzola-muted/50"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '';
                  }}
                />

                {/* Camera */}
                <button
                  onClick={() => { setShowPhotoMenu(!showPhotoMenu); setShowEmoji(false); }}
                  className={`w-9 h-9 rounded-full glass flex items-center justify-center flex-shrink-0 transition-all duration-300 cursor-pointer ${showPhotoMenu ? 'ring-2' : ''}`}
                  style={showPhotoMenu ? { boxShadow: '0 0 0 2px rgba(255, 77, 141, 0.4)' } : {}}
                >
                  <Camera className={`w-[20px] h-[20px] transition-colors duration-300 ${showPhotoMenu ? 'text-kinzola-pink' : 'text-kinzola-muted'}`} />
                </button>

                {/* Mic / Send button */}
                {pendingImage ? (
                  <motion.button
                    key="send-img"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={handleConfirmSendImage}
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)', boxShadow: '0 0 20px rgba(43, 127, 255, 0.4)' }}
                  >
                    <Send className="w-5 h-5 text-white" />
                  </motion.button>
                ) : (
                  <div className="w-11 h-11 rounded-full flex-shrink-0 relative">
                    {/* Mic button — visible when input empty */}
                    <motion.button
                      ref={micBtnRef}
                      key="mic-btn"
                      initial={false}
                      animate={{
                        opacity: isEmpty ? 1 : 0,
                        scale: isEmpty ? 1 : 0.5,
                        rotate: isEmpty ? 0 : 90,
                      }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      onMouseDown={handleMicDown}
                      onMouseUp={handleMicUp}
                      onMouseLeave={handleMicLeave}
                      onTouchStart={handleMicDown}
                      onTouchEnd={handleMicUp}
                      className="absolute inset-0 rounded-full glass flex items-center justify-center cursor-pointer transition-all duration-300 select-none"
                      aria-label="Enregistrer un message vocal"
                      style={{ touchAction: 'none' }}
                    >
                      <Mic className="w-5 h-5 text-kinzola-pink" />
                    </motion.button>

                    {/* Send button — visible when typing */}
                    <motion.button
                      key="send-btn"
                      initial={false}
                      animate={{
                        opacity: isEmpty ? 0 : 1,
                        scale: isEmpty ? 0.5 : 1,
                        rotate: isEmpty ? -90 : 0,
                      }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      whileTap={{ scale: 0.8 }}
                      onClick={sendMessage}
                      className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)', boxShadow: '0 0 20px rgba(43, 127, 255, 0.4)' }}
                      aria-label="Envoyer le message"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
