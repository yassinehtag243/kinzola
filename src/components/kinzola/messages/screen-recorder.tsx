'use client';

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorUp, Square, X, Play, Pause, Send, AlertCircle, CheckCircle2, Loader2, Volume2, VolumeX } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
//  ScreenRecorder — Composant d'enregistrement d'écran + son
//  Utilise navigator.mediaDevices.getDisplayMedia() pour capturer l'écran
//  et l'audio système/microphone simultanément.
// ═══════════════════════════════════════════════════════════════════════════

interface ScreenRecorderProps {
  onSendVideo: (videoBlob: Blob, duration: number) => void;
  onClose: () => void;
}

type RecorderState = 'idle' | 'requesting' | 'recording' | 'previewing' | 'sending' | 'sent' | 'error';

export default memo(function ScreenRecorder({ onSendVideo, onClose }: ScreenRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Format time MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Démarrer l'enregistrement ───
  const startRecording = useCallback(async () => {
    setState('requesting');
    setErrorMessage('');

    try {
      // Vérifier si l'API est supportée
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setState('error');
        setErrorMessage('L\'enregistrement d\'écran n\'est pas supporté sur cet appareil ou navigateur. Essayez Chrome ou Edge sur desktop.');
        return;
      }

      // Demander la capture d'écran avec audio
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          frameRate: { ideal: 30 },
        },
        audio: includeAudio,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      streamRef.current = stream;

      // Vérifier qu'on a bien une piste vidéo
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        stream.getTracks().forEach(t => t.stop());
        setState('error');
        setErrorMessage('Aucune piste vidéo disponible.');
        return;
      }

      // Détecter l'arrêt de l'enregistrement par l'utilisateur (via le bouton système "Stop sharing")
      videoTrack.onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      };

      // Déterminer le MIME type supporté
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Arrêter le timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        durationRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Arrêter les pistes du stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;

        // Si on a des données, passer en preview
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          setVideoPreviewUrl(url);
          setIsPreviewPlaying(false);
          setState('previewing');
        } else {
          setState('idle');
        }
      };

      recorder.onerror = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        setState('error');
        setErrorMessage('Une erreur est survenue pendant l\'enregistrement.');
      };

      // Commencer l'enregistrement
      recorder.start(1000); // Collecter les chunks chaque seconde
      startTimeRef.current = Date.now();
      setRecordingTime(0);

      // Timer d'affichage
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 1000);

      setState('recording');

    } catch (err: any) {
      // L'utilisateur a annulé la sélection d'écran ou erreur de permission
      if (err?.name === 'NotAllowedError') {
        setState('idle'); // L'utilisateur a refusé ou annulé, revenir à idle silencieusement
      } else if (err?.name === 'NotFoundError') {
        setState('error');
        setErrorMessage('Aucun écran ou fenêtre trouvé pour l\'enregistrement.');
      } else if (err?.name === 'NotReadableError') {
        setState('error');
        setErrorMessage('Impossible d\'accéder à l\'écran. Vérifiez vos permissions.');
      } else {
        setState('error');
        setErrorMessage(err?.message || 'Impossible de démarrer l\'enregistrement d\'écran.');
      }
    }
  }, [includeAudio]);

  // ─── Arrêter l'enregistrement ───
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop(); // Le handler onstop s'occupera du reste
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setState('idle');
    }
  }, []);

  // ─── Annuler / Fermer ───
  const handleCancel = useCallback(() => {
    // Arrêter l'enregistrement en cours si nécessaire
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      const recorder = mediaRecorderRef.current;
      const stream = streamRef.current;

      // Ignorer les données
      chunksRef.current = [];

      recorder.onstop = null; // Empêcher le handler normal
      recorder.stop();

      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current = null;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setVideoPreviewUrl(null);
    setState('idle');
    onClose();
  }, [onClose]);

  // ─── Supprimer l'enregistrement (depuis le preview) ───
  const handleDeleteRecording = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setVideoPreviewUrl(null);
    setIsPreviewPlaying(false);
    setState('idle');
  }, []);

  // ─── Envoyer la vidéo ───
  const handleSend = useCallback(() => {
    if (chunksRef.current.length === 0) return;

    setState('sending');

    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });

    // Simuler un léger délai d'envoi
    setTimeout(() => {
      onSendVideo(blob, durationRef.current);
      setState('sent');

      // Fermer après 1.5s
      setTimeout(() => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        onClose();
      }, 1500);
    }, 800);
  }, [onSendVideo, onClose]);

  // ─── Toggle preview play/pause ───
  const togglePreviewPlay = useCallback(() => {
    const video = previewVideoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPreviewPlaying(true);
    } else {
      video.pause();
      setIsPreviewPlaying(false);
    }
  }, []);

  // ─── Toggle mute preview ───
  const togglePreviewMute = useCallback(() => {
    const video = previewVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!video.muted);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  //  RENDU
  // ═══════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0A1F3C 0%, #0D2847 100%)',
      }}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-3 safe-area-top"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleCancel}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MonitorUp className="w-5 h-5" style={{ color: '#FF4D8D' }} />
          Enregistrement d&apos;écran
        </h2>
        <div className="w-9" />
      </div>

      {/* ─── Contenu principal ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">

        {/* ─── ÉTAT IDLE : Bouton démarrer ─── */}
        {state === 'idle' && (
          <motion.div
            key="idle-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            {/* Icône decorative */}
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(255, 77, 141, 0)', '0 0 40px 10px rgba(255, 77, 141, 0.15)', '0 0 0 0 rgba(255, 77, 141, 0)'] }}
              transition={{ type: 'tween' as const, duration: 2.5, repeat: Infinity }}
              className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(255, 77, 141, 0.15))' }}
            >
              <MonitorUp className="w-14 h-14" style={{ color: '#FF4D8D' }} />
            </motion.div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Enregistrer votre écran</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Capturez votre écran avec le son pour le partager dans cette discussion.
                L&apos;enregistrement sera privé et sécurisé.
              </p>
            </div>

            {/* Toggle audio */}
            <button
              onClick={() => setIncludeAudio(!includeAudio)}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl w-full max-w-[280px] cursor-pointer transition-all"
              style={{
                background: includeAudio ? 'rgba(43, 127, 255, 0.15)' : 'rgba(128, 128, 128, 0.1)',
                border: includeAudio ? '1px solid rgba(43, 127, 255, 0.3)' : '1px solid rgba(128, 128, 128, 0.15)',
              }}
            >
              {includeAudio ? (
                <Volume2 className="w-5 h-5" style={{ color: '#2B7FFF' }} />
              ) : (
                <VolumeX className="w-5 h-5" style={{ color: 'rgba(128,128,128,0.6)' }} />
              )}
              <span className={`text-sm font-medium ${includeAudio ? 'text-white' : ''}`}
                style={{ color: includeAudio ? '#fff' : 'rgba(128,128,128,0.6)' }}>
                {includeAudio ? 'Son activé' : 'Son désactivé'}
              </span>
              <div className={`ml-auto w-10 h-6 rounded-full relative transition-colors duration-300 ${includeAudio ? '' : ''}`}
                style={{ background: includeAudio ? '#2B7FFF' : 'rgba(128,128,128,0.3)' }}>
                <motion.div
                  animate={{ x: includeAudio ? 16 : 2 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                />
              </div>
            </button>

            {/* Bouton démarrer */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              className="w-full max-w-[280px] py-4 rounded-2xl font-bold text-white text-base cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
              }}
            >
              <MonitorUp className="w-5 h-5" />
              Commencer l&apos;enregistrement
            </motion.button>

            <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Vous pourrez choisir l&apos;écran ou la fenêtre à enregistrer
            </p>
          </motion.div>
        )}

        {/* ─── ÉTAT REQUESTING ─── */}
        {state === 'requesting' && (
          <motion.div
            key="requesting-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#2B7FFF' }} />
            <p className="text-sm text-white">Choisissez l&apos;écran à enregistrer...</p>
          </motion.div>
        )}

        {/* ─── ÉTAT RECORDING ─── */}
        {state === 'recording' && (
          <motion.div
            key="recording-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8 w-full max-w-sm"
          >
            {/* Timer animé */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Anneau animé */}
              <motion.svg
                width="176"
                height="176"
                viewBox="0 0 176 176"
                className="absolute inset-0"
              >
                <circle
                  cx="88" cy="88" r="82"
                  fill="none"
                  stroke="rgba(255, 77, 141, 0.1)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="88" cy="88" r="82"
                  fill="none"
                  stroke="url(#rec-gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 82}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 82 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 82) * (1 - (recordingTime % 60) / 60) }}
                  transition={{ duration: 1, ease: 'linear' as const, repeat: Infinity }}
                  transform="rotate(-90 88 88)"
                />
                <defs>
                  <linearGradient id="rec-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2B7FFF" />
                    <stop offset="100%" stopColor="#FF4D8D" />
                  </linearGradient>
                </defs>
              </motion.svg>

              {/* Icône enregistrement pulsante */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{ type: 'tween' as const, duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF4D8D, #FF1744)' }}
              >
                <motion.div
                  animate={{ borderRadius: ['40%', '40%', '40%', '40%'] }}
                  className="w-7 h-7 bg-white rounded"
                />
              </motion.div>
            </div>

            {/* Temps */}
            <div className="text-center space-y-2">
              <motion.p
                key={recordingTime}
                initial={{ y: -4, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-mono font-bold text-white tracking-wider"
              >
                {formatTime(recordingTime)}
              </motion.p>
              <div className="flex items-center gap-2 justify-center">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ type: 'tween' as const, duration: 1.2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-500"
                />
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Enregistrement en cours...
                </span>
              </div>
            </div>

            {/* Bouton arrêter */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center cursor-pointer"
              style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)' }}
            >
              <Square className="w-7 h-7 text-white fill-white" />
            </motion.button>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Appuyez pour arrêter l&apos;enregistrement
            </p>
          </motion.div>
        )}

        {/* ─── ÉTAT PREVIEW ─── */}
        {state === 'previewing' && videoPreviewUrl && (
          <motion.div
            key="preview-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4 w-full max-w-sm"
          >
            {/* Lecteur vidéo */}
            <div className="relative w-full rounded-2xl overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.5)', aspectRatio: '16/9' }}>
              <video
                ref={previewVideoRef}
                src={videoPreviewUrl}
                className="w-full h-full object-contain"
                playsInline
                onClick={togglePreviewPlay}
                onEnded={() => setIsPreviewPlaying(false)}
              />

              {/* Overlay boutons */}
              <div className="absolute inset-0 flex items-center justify-center">
                {!isPreviewPlaying && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={togglePreviewPlay}
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                    style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </motion.button>
                )}
              </div>

              {/* Contrôles en bas */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                <span className="text-xs text-white font-mono">{formatTime(durationRef.current)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={togglePreviewMute} className="cursor-pointer">
                    {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Durée et info */}
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-white">
                Enregistrement terminé
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Durée : {formatTime(durationRef.current)}
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-3 w-full">
              {/* Supprimer */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteRecording}
                className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <TrashIcon />
                <span className="text-sm font-medium text-red-400">Supprimer</span>
              </motion.button>

              {/* Envoyer */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  boxShadow: '0 4px 16px rgba(43, 127, 255, 0.3)',
                }}
              >
                <Send className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Envoyer</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─── ÉTAT SENDING ─── */}
        {state === 'sending' && (
          <motion.div
            key="sending-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#2B7FFF' }} />
            <p className="text-sm font-medium text-white">Envoi de la vidéo...</p>
          </motion.div>
        )}

        {/* ─── ÉTAT SENT ─── */}
        {state === 'sent' && (
          <motion.div
            key="sent-state"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(74, 222, 128, 0.15)' }}
            >
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>
            <p className="text-base font-bold text-white">Vidéo envoyée !</p>
          </motion.div>
        )}

        {/* ─── ÉTAT ERROR ─── */}
        {state === 'error' && (
          <motion.div
            key="error-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-5 w-full max-w-sm"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Enregistrement impossible</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {errorMessage}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium cursor-pointer"
                style={{ background: 'rgba(128,128,128,0.15)', border: '1px solid rgba(128,128,128,0.2)', color: 'rgba(255,255,255,0.6)' }}
              >
                Fermer
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)', boxShadow: '0 4px 16px rgba(43, 127, 255, 0.3)' }}
              >
                Réessayer
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── Barre d'info en bas pendant l'enregistrement ─── */}
      <AnimatePresence>
        {state === 'recording' && (
          <motion.div
            key="rec-bar"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="px-6 pb-6 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-1.5">
                {includeAudio && <Volume2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                <MonitorUp className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {includeAudio ? 'Écran + Son en cours de capture' : 'Écran en cours de capture'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ─── Icône poubelle simple ───
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
