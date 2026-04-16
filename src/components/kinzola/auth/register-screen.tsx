'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Phone, Mail, User, Briefcase, Heart,
  Camera, Plus, X, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff
} from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { useAuth } from '@/lib/supabase/auth-context';
import { AVAILABLE_RELIGIONS } from '@/lib/constants';
import CityInput from '@/components/kinzola/shared/city-input';

type RegisterMethod = 'phone' | 'email';

export default function RegisterScreen() {
  const { setScreen, registerStep, setRegisterStep } = useKinzolaStore();
  const { register: supabaseRegister } = useAuth();

  const [method, setMethod] = useState<RegisterMethod>('phone');

  const [form, setForm] = useState({
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: 'femme',
    city: '',
    profession: '',
    religion: '',
    bio: '',
    interests: [] as string[],
    profilePhoto: '' as string,
    galleryPhotos: [] as string[],
  });

  // OTP state (phone method)
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Phone password (needed for Supabase auth even with phone method)
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneConfirmPassword, setPhoneConfirmPassword] = useState('');
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [showPhoneConfirmPassword, setShowPhoneConfirmPassword] = useState(false);

  // Register error/loading state
  const [registerError, setRegisterError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset method-specific states when switching
  const switchMethod = (newMethod: RegisterMethod) => {
    if (newMethod === method) return;
    setMethod(newMethod);
    setOtpSent(false);
    setOtpValues(['', '', '', '', '', '']);
    setOtpVerified(false);
    setOtpError('');
    setCountdown(0);
    setSendingCode(false);
    setVerifying(false);
    setPhonePassword('');
    setPhoneConfirmPassword('');
    setShowPhonePassword(false);
    setShowPhoneConfirmPassword(false);
    setEmailVerified(false);
    setEmailVerifying(false);
    setRegisterError('');
    setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    setErrors({});
  };

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : prev.interests.length < 8
          ? [...prev.interests, interest]
          : prev.interests,
    }));
  };

  // OTP handlers (phone)
  const handleSendOtp = useCallback(() => {
    if (!form.phone.trim()) {
      setErrors(prev => ({ ...prev, phone: 'Numéro de téléphone requis' }));
      return;
    }
    setSendingCode(true);
    setOtpError('');
    setTimeout(() => {
      setOtpSent(true);
      setCountdown(60);
      setSendingCode(false);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }, 800);
  }, [form.phone]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);
    setOtpError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newValues.every(v => v !== '')) {
      handleVerifyOtp(newValues.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      const newValues = [...otpValues];
      newValues[index - 1] = '';
      setOtpValues(newValues);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newValues = pasted.split('');
      setOtpValues(newValues);
      otpInputRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = (code: string) => {
    setVerifying(true);
    setTimeout(() => {
      if (code.length === 6) {
        setOtpVerified(true);
        setOtpError('');
        setVerifying(false);
      } else {
        setOtpError('Code invalide');
        setVerifying(false);
      }
    }, 600);
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setOtpValues(['', '', '', '', '', '']);
    setOtpError('');
    handleSendOtp();
  };

  // Email verification handler
  const handleVerifyEmail = () => {
    const newErrors: Record<string, string> = {};
    if (!form.email.trim()) {
      newErrors.email = 'Adresse e-mail requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Adresse e-mail invalide';
    }
    if (!form.password.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (form.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/[a-zA-Z]/.test(form.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une lettre';
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins un chiffre';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setEmailVerifying(true);
    // Local validation only — no mock setTimeout
    setEmailVerified(true);
    setEmailVerifying(false);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (method === 'phone') {
        if (!otpVerified) {
          newErrors.phone = 'Veuillez vérifier votre numéro de téléphone';
        }
        if (!phonePassword.trim()) {
          newErrors.phonePassword = 'Mot de passe requis';
        } else if (phonePassword.length < 8) {
          newErrors.phonePassword = 'Le mot de passe doit contenir au moins 8 caractères';
        } else if (!/[a-zA-Z]/.test(phonePassword)) {
          newErrors.phonePassword = 'Le mot de passe doit contenir au moins une lettre';
        } else if (!/[0-9]/.test(phonePassword)) {
          newErrors.phonePassword = 'Le mot de passe doit contenir au moins un chiffre';
        }
        if (phonePassword !== phoneConfirmPassword) {
          newErrors.phoneConfirmPassword = 'Les mots de passe ne correspondent pas';
        }
      } else {
        if (!emailVerified) {
          newErrors.email = 'Veuillez vérifier votre adresse e-mail';
        }
      }
    } else if (step === 2) {
      if (!form.name.trim()) newErrors.name = 'Nom requis';
      if (!form.age || parseInt(form.age) < 18) newErrors.age = 'Âge invalide (min 18 ans)';
      if (!form.city) newErrors.city = 'Ville requise';
      if (!form.profession) newErrors.profession = 'Profession requise';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(registerStep) && registerStep < 3) {
      setRegisterStep(registerStep + 1);
    }
  };

  const prevStep = () => {
    if (registerStep > 1) setRegisterStep(registerStep - 1);
    else setScreen('welcome');
  };

  const handleRegister = async () => {
    setRegisterError('');
    setRegistering(true);
    try {
      if (method === 'email') {
        // Email registration
        const result = await supabaseRegister({
          email: form.email,
          password: form.password,
          pseudo: form.name,
          name: form.name,
          age: parseInt(form.age) || 25,
          gender: form.gender as 'homme' | 'femme',
          city: form.city,
          profession: form.profession,
          religion: form.religion,
          bio: form.bio,
        });
        if (result.error) {
          const msg = result.error.message;
          if (msg.includes('already registered') || msg.includes('already in use')) {
            setRegisterError('Cette adresse e-mail est déjà utilisée');
          } else if (msg.includes('Password')) {
            setRegisterError('Le mot de passe ne respecte pas les critères de sécurité');
          } else {
            setRegisterError(msg || 'Erreur lors de l\'inscription. Veuillez réessayer');
          }
          setRegistering(false);
          return;
        }
        // On success, AuthProvider + AppShell sync will handle Zustand update and navigation
      } else {
        // Phone registration — generate email from phone
        const cleanPhone = form.phone.replace(/[^\d+]/g, '');
        const generatedEmail = `${cleanPhone}@kinzola.app`;
        const result = await supabaseRegister({
          email: generatedEmail,
          password: phonePassword,
          pseudo: form.name,
          name: form.name,
          age: parseInt(form.age) || 25,
          gender: form.gender as 'homme' | 'femme',
          city: form.city,
          phone: form.phone,
          profession: form.profession,
          religion: form.religion,
          bio: form.bio,
        });
        if (result.error) {
          const msg = result.error.message;
          if (msg.includes('already registered') || msg.includes('already in use')) {
            setRegisterError('Ce numéro de téléphone est déjà utilisé');
          } else if (msg.includes('Password')) {
            setRegisterError('Le mot de passe ne respecte pas les critères de sécurité');
          } else {
            setRegisterError(msg || 'Erreur lors de l\'inscription. Veuillez réessayer');
          }
          setRegistering(false);
          return;
        }
        // On success, AuthProvider + AppShell sync will handle Zustand update and navigation
      }
    } catch {
      setRegisterError('Erreur de connexion. Veuillez vérifier votre connexion internet');
    } finally {
      setRegistering(false);
    }
  };

  const quickInterests = ['Technologie', 'Musique', 'Lecture', 'Cuisine', 'Sport', 'Cinéma', 'Voyage', 'Photographie', 'Art', 'Danse'];

  const stepLabels = ['Vérification', 'Profil', 'Personnalisation'];

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -100 : 100, opacity: 0 }),
  };

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.2)';
    e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.5)';
  };

  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
  };

  const inputClass = 'w-full h-[52px] pl-12 pr-4 rounded-xl glass bg-white/5 text-white text-sm placeholder:text-kinzola-muted/50 focus:outline-none transition-all';

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-kinzola-bg">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            top: '-5%',
            right: '-10%',
            background: 'radial-gradient(circle, #2B7FFF 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            bottom: '10%',
            left: '-5%',
            background: 'radial-gradient(circle, #FF4D8D 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 p-5 pt-6 flex items-center justify-between">
        <button
          onClick={prevStep}
          className="w-11 h-11 rounded-full glass flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold gradient-text">Inscription</h1>
        <div className="w-11" />
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 px-6 mb-2">
        <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}
            animate={{ width: `${(registerStep / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-xs text-kinzola-muted mt-2 text-center font-light">
          {stepLabels[registerStep - 1]}
        </p>
      </div>

      {/* Form Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-4">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={registerStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Step 1: Verification (Phone or Email) */}
            {registerStep === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-1">Choisissez votre méthode</h2>
                <p className="text-kinzola-muted text-sm mb-5">
                  Inscrivez-vous avec votre numéro de téléphone ou votre adresse e-mail
                </p>

                {/* Method Toggle */}
                <div className="mb-5">
                  <div
                    className="flex rounded-2xl p-1 relative"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    {/* Sliding indicator */}
                    <motion.div
                      className="absolute top-1 bottom-1 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
                        width: 'calc(50% - 4px)',
                      }}
                      animate={{ left: method === 'phone' ? '4px' : 'calc(50%)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                    <button
                      onClick={() => switchMethod('phone')}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                        method === 'phone' ? 'text-white' : 'text-kinzola-muted'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </button>
                    <button
                      onClick={() => switchMethod('email')}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                        method === 'email' ? 'text-white' : 'text-kinzola-muted'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      E-mail
                    </button>
                  </div>
                </div>

                {/* ===== PHONE VERIFICATION ===== */}
                {method === 'phone' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <p className="text-kinzola-muted text-sm">
                      Nous allons vous envoyer un code de vérification par SMS
                    </p>

                    {/* Phone Input */}
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                      <input
                        type="tel"
                        placeholder="+243 8XX XXX XXX"
                        value={form.phone}
                        onChange={(e) => {
                          updateForm('phone', e.target.value);
                          if (otpSent || otpVerified) {
                            setOtpSent(false);
                            setOtpVerified(false);
                            setOtpValues(['', '', '', '', '', '']);
                            setOtpError('');
                          }
                        }}
                        disabled={otpVerified}
                        className={`${inputClass} ${otpVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                      {errors.phone && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>}
                    </div>

                    {/* Send Code Button / Resend */}
                    <AnimatePresence mode="wait">
                      {!otpVerified && (
                        <motion.div
                          key="send-otp"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <button
                            onClick={handleSendOtp}
                            disabled={!form.phone.trim() || countdown > 0 || sendingCode}
                            className="w-full h-14 rounded-2xl text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                              background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
                              boxShadow: '0 0 30px rgba(43, 127, 255, 0.3), 0 8px 32px rgba(43, 127, 255, 0.15)',
                            }}
                          >
                            {sendingCode ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : otpSent ? (
                              `Renvoyer le code${countdown > 0 ? ` (${countdown}s)` : ''}`
                            ) : (
                              <>
                                <ShieldCheck className="w-5 h-5" />
                                Envoyer le code
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* OTP Inputs */}
                    <AnimatePresence>
                      {otpSent && !otpVerified && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="space-y-4"
                        >
                          <p className="text-sm text-kinzola-muted text-center">
                            Entrez le code à 6 chiffres
                          </p>

                          <div className="flex justify-center gap-3">
                            {otpValues.map((value, index) => (
                              <motion.input
                                key={index}
                                ref={(el) => { otpInputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={value}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                onPaste={index === 0 ? handleOtpPaste : undefined}
                                disabled={verifying}
                                className="w-12 h-14 text-center text-xl font-bold rounded-xl glass bg-white/5 text-white focus:outline-none transition-all disabled:opacity-60"
                                style={{
                                  borderColor: otpError ? 'rgba(239, 68, 68, 0.5)' : value ? 'rgba(43, 127, 255, 0.5)' : 'rgba(255, 255, 255, 0.08)',
                                  boxShadow: value ? '0 0 15px rgba(43, 127, 255, 0.15)' : 'none',
                                  transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                                }}
                              />
                            ))}
                          </div>

                          {verifying && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-center gap-1"
                            >
                              {[0, 1, 2].map(i => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)' }}
                                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                />
                              ))}
                            </motion.div>
                          )}

                          {otpError && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-red-400 text-center"
                            >
                              {otpError}
                            </motion.p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Verified Success State (Phone) */}
                    <AnimatePresence>
                      {otpVerified && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="flex flex-col items-center justify-center py-4 space-y-3"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))',
                              border: '2px solid rgba(34, 197, 94, 0.4)',
                            }}
                          >
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                          </motion.div>
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-base font-semibold text-green-400"
                          >
                            Numéro vérifié !
                          </motion.p>
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm text-kinzola-muted"
                          >
                            {form.phone}
                          </motion.p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Phone Password Fields (shown after OTP verified) */}
                    {otpVerified && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <p className="text-kinzola-muted text-xs text-center">
                          Choisissez un mot de passe pour sécuriser votre compte
                        </p>

                        {/* Password Input */}
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                          <input
                            type={showPhonePassword ? 'text' : 'password'}
                            placeholder="Mot de passe (min. 8 caractères)"
                            value={phonePassword}
                            onChange={(e) => { setPhonePassword(e.target.value); setErrors(prev => ({ ...prev, phonePassword: '' })); }}
                            className={inputClass}
                            onFocus={focusInput}
                            onBlur={blurInput}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPhonePassword(!showPhonePassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-kinzola-muted"
                          >
                            {showPhonePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          {errors.phonePassword && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phonePassword}</p>}
                        </div>

                        {/* Confirm Password Input */}
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                          <input
                            type={showPhoneConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirmer le mot de passe"
                            value={phoneConfirmPassword}
                            onChange={(e) => { setPhoneConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, phoneConfirmPassword: '' })); }}
                            className={inputClass}
                            onFocus={focusInput}
                            onBlur={blurInput}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPhoneConfirmPassword(!showPhoneConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-kinzola-muted"
                          >
                            {showPhoneConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          {errors.phoneConfirmPassword && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phoneConfirmPassword}</p>}
                        </div>

                        {/* Password strength hint */}
                        {phonePassword && (
                          <div className="space-y-1">
                            <p className="text-[11px] text-kinzola-muted/60">
                              Votre mot de passe doit contenir :
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { test: phonePassword.length >= 8, label: 'Min. 8 caractères' },
                                { test: /[a-zA-Z]/.test(phonePassword), label: 'Au moins une lettre' },
                                { test: /[0-9]/.test(phonePassword), label: 'Au moins un chiffre' },
                              ].map(({ test, label }) => (
                                <span
                                  key={label}
                                  className={`text-[11px] ${test ? 'text-green-400' : 'text-kinzola-muted/40'}`}
                                >
                                  {test ? '✓' : '○'} {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ===== EMAIL VERIFICATION ===== */}
                {method === 'email' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <p className="text-kinzola-muted text-sm">
                      Créez votre compte avec votre adresse e-mail et un mot de passe sécurisé
                    </p>

                    {/* Email Verified Success */}
                    {emailVerified ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="flex flex-col items-center justify-center py-6 space-y-3"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))',
                            border: '2px solid rgba(34, 197, 94, 0.4)',
                          }}
                        >
                          <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </motion.div>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-lg font-semibold text-green-400"
                        >
                          E-mail vérifié !
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-sm text-kinzola-muted"
                        >
                          {form.email}
                        </motion.p>
                      </motion.div>
                    ) : (
                      <>
                        {/* Email Input */}
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                          <input
                            type="email"
                            placeholder="votre@email.com"
                            value={form.email}
                            onChange={(e) => updateForm('email', e.target.value)}
                            disabled={emailVerifying}
                            className={`${inputClass} ${emailVerifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                            onFocus={focusInput}
                            onBlur={blurInput}
                          />
                          {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mot de passe (min. 8 caractères)"
                            value={form.password}
                            onChange={(e) => updateForm('password', e.target.value)}
                            disabled={emailVerifying}
                            className={`${inputClass} ${emailVerifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                            onFocus={focusInput}
                            onBlur={blurInput}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-kinzola-muted"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password}</p>}
                        </div>

                        {/* Confirm Password Input */}
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirmer le mot de passe"
                            value={form.confirmPassword}
                            onChange={(e) => updateForm('confirmPassword', e.target.value)}
                            disabled={emailVerifying}
                            className={`${inputClass} ${emailVerifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                            onFocus={focusInput}
                            onBlur={blurInput}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-kinzola-muted"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
                        </div>

                        {/* Password strength hint */}
                        {form.password && (
                          <div className="space-y-1">
                            <p className="text-[11px] text-kinzola-muted/60">
                              Votre mot de passe doit contenir :
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { test: form.password.length >= 8, label: 'Min. 8 caractères' },
                                { test: /[a-zA-Z]/.test(form.password), label: 'Au moins une lettre' },
                                { test: /[0-9]/.test(form.password), label: 'Au moins un chiffre' },
                              ].map(({ test, label }) => (
                                <span
                                  key={label}
                                  className={`text-[11px] ${test ? 'text-green-400' : 'text-kinzola-muted/40'}`}
                                >
                                  {test ? '✓' : '○'} {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Verify Button */}
                        <button
                          onClick={handleVerifyEmail}
                          disabled={emailVerifying}
                          className="w-full h-14 rounded-2xl text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                          style={{
                            background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
                            boxShadow: '0 0 30px rgba(43, 127, 255, 0.3), 0 8px 32px rgba(43, 127, 255, 0.15)',
                          }}
                        >
                          {emailVerifying ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Vérification en cours...</span>
                            </div>
                          ) : (
                            <>
                              <ShieldCheck className="w-5 h-5" />
                              Vérifier mon e-mail
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Step 2: Personal Info */}
            {registerStep === 2 && (
              <>
                <h2 className="text-2xl font-bold mb-1">Profil personnel</h2>
                <p className="text-kinzola-muted text-sm mb-6">Dites-nous en plus sur vous</p>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                  <input
                    type="text"
                    placeholder="Votre nom complet"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className={inputClass}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Âge"
                      min="18"
                      max="99"
                      value={form.age}
                      onChange={(e) => updateForm('age', e.target.value)}
                      className="w-full h-[52px] px-4 rounded-xl glass bg-white/5 text-white text-sm placeholder:text-kinzola-muted/50 focus:outline-none transition-all"
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                    {errors.age && <p className="text-red-400 text-xs mt-1 ml-1">{errors.age}</p>}
                  </div>
                  <select
                    value={form.gender}
                    onChange={(e) => updateForm('gender', e.target.value)}
                    className="w-full h-[52px] px-4 rounded-xl glass bg-white/5 text-white text-sm focus:outline-none transition-all appearance-none"
                  >
                    <option value="femme" className="bg-kinzola-deep">Femme</option>
                    <option value="homme" className="bg-kinzola-deep">Homme</option>
                  </select>
                </div>

                <CityInput
                  value={form.city}
                  onChange={(city) => updateForm('city', city)}
                  placeholder="Sélectionner votre ville"
                />
                {errors.city && <p className="text-red-400 text-xs mt-1 ml-1">{errors.city}</p>}

                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                  <input
                    type="text"
                    placeholder="Profession"
                    value={form.profession}
                    onChange={(e) => updateForm('profession', e.target.value)}
                    className={inputClass}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  {errors.profession && <p className="text-red-400 text-xs mt-1 ml-1">{errors.profession}</p>}
                </div>

                <div className="relative">
                  <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
                  <select
                    value={form.religion}
                    onChange={(e) => updateForm('religion', e.target.value)}
                    className="w-full h-[52px] pl-12 pr-4 rounded-xl glass bg-white/5 text-white text-sm focus:outline-none transition-all appearance-none"
                    onFocus={focusInput}
                    onBlur={blurInput}
                  >
                    <option value="" className="bg-kinzola-deep">Religion (optionnel)</option>
                    {AVAILABLE_RELIGIONS.map(rel => (
                      <option key={rel} value={rel} className="bg-kinzola-deep">{rel}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Step 3: Photo, Bio, Interests */}
            {registerStep === 3 && (
              <>
                <h2 className="text-2xl font-bold mb-1">Personnalisez votre profil</h2>
                <p className="text-kinzola-muted text-sm mb-6">Ajoutez une photo et vos centres d&apos;intérêt</p>

                {/* Photo Upload - profile photo */}
                <input
                  ref={profilePhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setForm(prev => ({ ...prev, profilePhoto: ev.target!.result as string }));
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="w-full py-8 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors hover:bg-white/5"
                  style={{
                    border: form.profilePhoto ? '2px solid rgba(43, 127, 255, 0.3)' : '2px dashed',
                    borderImage: form.profilePhoto ? 'none' : 'linear-gradient(135deg, #2B7FFF, #FF4D8D) 1',
                    borderRadius: '12px',
                    background: form.profilePhoto ? 'rgba(43, 127, 255, 0.05)' : 'rgba(15, 25, 50, 0.3)',
                  }}
                >
                  {form.profilePhoto ? (
                    <>
                      <img src={form.profilePhoto} alt="Photo" className="w-16 h-16 rounded-full object-cover mb-1" style={{ border: '2px solid rgba(43, 127, 255, 0.5)' }} />
                      <span className="text-sm text-kinzola-blue font-medium">Photo ajoutée</span>
                      <span className="text-[11px] text-kinzola-muted/50">Appuyez pour changer</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-kinzola-muted" />
                      <span className="text-sm text-kinzola-muted">Ajouter une photo de profil</span>
                      <span className="text-[11px] text-kinzola-muted/50">JPG, PNG • Max 15MB</span>
                    </>
                  )}
                </button>

                {/* Gallery Photos - additional photos (max 4 extra = 5 total with profile) */}
                {form.profilePhoto && form.galleryPhotos.length < 4 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-kinzola-muted">Photos supplémentaires ({form.galleryPhotos.length}/4)</span>
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const remaining = 4 - form.galleryPhotos.length;
                          const toAdd = files.slice(0, remaining);
                          toAdd.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setForm(prev => ({
                                  ...prev,
                                  galleryPhotos: [...prev.galleryPhotos, ev.target!.result as string].slice(0, 4),
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: '#2B7FFF' }}
                      >
                        <Plus className="w-3 h-3" />
                        Ajouter
                      </button>
                    </div>
                    {form.galleryPhotos.length > 0 && (
                      <div className="flex gap-2">
                        {form.galleryPhotos.map((photo, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <img src={photo} alt={`Galerie ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => setForm(prev => ({
                                ...prev,
                                galleryPhotos: prev.galleryPhotos.filter((_, idx) => idx !== i),
                              }))}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(0,0,0,0.6)' }}
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bio - glass textarea */}
                <div>
                  <textarea
                    placeholder="Parlez un peu de vous..."
                    value={form.bio}
                    onChange={(e) => updateForm('bio', e.target.value)}
                    rows={3}
                    maxLength={300}
                    className="w-full py-3 px-4 rounded-xl glass bg-white/5 text-white text-sm placeholder:text-kinzola-muted/50 focus:outline-none resize-none transition-all"
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <p className="text-[11px] text-kinzola-muted/50 text-right mt-1">{form.bio.length}/300</p>
                </div>

                {/* Interest tags */}
                <div>
                  <p className="text-sm text-kinzola-muted mb-3 font-medium">
                    Centres d&apos;intérêt ({form.interests.length}/8)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          form.interests.includes(interest)
                            ? 'text-white shadow-md'
                            : 'glass text-kinzola-muted hover:text-white'
                        }`}
                        style={form.interests.includes(interest) ? {
                          background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                          boxShadow: '0 0 15px rgba(43, 127, 255, 0.3)',
                        } : {}}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="relative z-10 p-5 pt-2 safe-bottom">
        {/* Register error toast */}
        {registerError && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 text-center bg-red-500/10 rounded-xl px-3 py-2 mb-3"
          >
            {registerError}
          </motion.p>
        )}
        <div className="flex gap-3">
          {registerStep > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl glass text-white font-medium transition-all hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
          <button
            onClick={registerStep === 3 ? handleRegister : nextStep}
            disabled={registerStep === 3 && registering}
            className="flex-[2] h-14 rounded-2xl text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #FF4D8D 0%, #FF2D6D 100%)',
              boxShadow: '0 0 30px rgba(255, 77, 141, 0.4), 0 8px 32px rgba(255, 77, 141, 0.2)',
            }}
          >
            {registerStep === 3 ? (registering ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "S'inscrire") : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
