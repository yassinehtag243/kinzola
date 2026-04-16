'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Eye, EyeOff, Phone, Mail, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';

type LoginMethod = 'phone' | 'email';

export default function LoginScreen() {
  const { setScreen, login } = useKinzolaStore();

  // Method selection
  const [method, setMethod] = useState<LoginMethod>('phone');

  // Phone state
  const [phone, setPhone] = useState('');
  const [phoneLoggingIn, setPhoneLoggingIn] = useState(false);

  // Email state
  const [email, setEmail] = useState('');
  const [emailLoggingIn, setEmailLoggingIn] = useState(false);

  // Password state (shared)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  // Reset all states when switching method
  const switchMethod = (newMethod: LoginMethod) => {
    if (newMethod === method) return;
    setMethod(newMethod);
    setPhone('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setPhoneLoggingIn(false);
    setEmailLoggingIn(false);
  };

  // Phone + Password login
  const handlePhoneLogin = () => {
    setError('');
    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (!password.trim()) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setPhoneLoggingIn(true);
    // Mock: simulate login delay
    setTimeout(() => {
      setPhoneLoggingIn(false);
      login(phone, password);
    }, 800);
  };

  // Email + Password login
  const handleEmailLogin = () => {
    setError('');
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse e-mail');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Adresse e-mail invalide');
      return;
    }
    if (!password.trim()) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setEmailLoggingIn(true);
    // Mock: simulate login delay
    setTimeout(() => {
      setEmailLoggingIn(false);
      login(email, password);
    }, 800);
  };

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = '0 0 20px rgba(43, 127, 255, 0.2)';
    e.currentTarget.style.borderColor = 'rgba(43, 127, 255, 0.5)';
  };

  const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
  };

  const isLoading = phoneLoggingIn || emailLoggingIn;

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-kinzola-bg">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            top: '-10%',
            left: '-10%',
            background: 'radial-gradient(circle, #2B7FFF 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-15"
          style={{
            bottom: '10%',
            right: '-10%',
            background: 'radial-gradient(circle, #FF4D8D 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="relative z-10 p-5 pt-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => setScreen('welcome')}
          className="w-11 h-11 rounded-full glass flex items-center justify-center transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </motion.div>

      {/* Form */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col items-center px-6 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-[32px] font-bold mb-2">
          <span className="gradient-text">Connexion</span>
        </h1>
        <p className="text-kinzola-muted text-sm mb-6">Ravis de vous revoir !</p>

        {/* Method Toggle */}
        <div className="w-full max-w-sm mb-6">
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

        <div className="w-full max-w-sm space-y-4">
          {/* ===== PHONE METHOD ===== */}
          <AnimatePresence mode="wait">
            {method === 'phone' && (
              <motion.div
                key="phone-method"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Phone Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-kinzola-muted">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+243 8XX XXX XXX"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                    disabled={isLoading}
                    className="w-full h-14 pl-12 pr-4 rounded-xl glass bg-white/5 text-white placeholder:text-kinzola-muted/50 focus:outline-none focus:border-kinzola-blue/50 transition-all disabled:opacity-60"
                    style={{ transition: 'box-shadow 0.3s ease' }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-kinzola-muted">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    disabled={isLoading}
                    className="w-full h-14 pl-12 pr-12 rounded-xl glass bg-white/5 text-white placeholder:text-kinzola-muted/50 focus:outline-none focus:border-kinzola-blue/50 transition-all disabled:opacity-60"
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-kinzola-muted"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button className="text-sm text-kinzola-pink hover:text-kinzola-pink/80 transition-colors">
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 text-center bg-red-500/10 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Login Button */}
                <button
                  onClick={handlePhoneLogin}
                  disabled={!phone.trim() || !password.trim() || isLoading}
                  className="w-full h-14 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
                    boxShadow: '0 0 30px rgba(43, 127, 255, 0.3), 0 8px 32px rgba(43, 127, 255, 0.15)',
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Se connecter
                    </div>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== EMAIL METHOD ===== */}
          <AnimatePresence mode="wait">
            {method === 'email' && (
              <motion.div
                key="email-method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Email Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-kinzola-muted">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    disabled={isLoading}
                    className="w-full h-14 pl-12 pr-4 rounded-xl glass bg-white/5 text-white placeholder:text-kinzola-muted/50 focus:outline-none focus:border-kinzola-blue/50 transition-all disabled:opacity-60"
                    style={{ transition: 'box-shadow 0.3s ease' }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-kinzola-muted">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    disabled={isLoading}
                    className="w-full h-14 pl-12 pr-12 rounded-xl glass bg-white/5 text-white placeholder:text-kinzola-muted/50 focus:outline-none focus:border-kinzola-blue/50 transition-all disabled:opacity-60"
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-kinzola-muted"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button className="text-sm text-kinzola-pink hover:text-kinzola-pink/80 transition-colors">
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 text-center bg-red-500/10 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Login Button */}
                <button
                  onClick={handleEmailLogin}
                  disabled={!email.trim() || !password.trim() || isLoading}
                  className="w-full h-14 rounded-2xl text-white font-semibold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
                    boxShadow: '0 0 30px rgba(43, 127, 255, 0.3), 0 8px 32px rgba(43, 127, 255, 0.15)',
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Se connecter
                    </div>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom text */}
          <div className="text-center pt-4">
            <p className="text-sm text-kinzola-muted">
              Pas de compte ?{' '}
              <button
                onClick={() => setScreen('register')}
                className="text-kinzola-pink font-medium"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
