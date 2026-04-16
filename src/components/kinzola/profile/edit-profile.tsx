'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, X, Plus } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { AVAILABLE_RELIGIONS, AVAILABLE_INTERESTS } from '@/lib/mock-data';
import CityInput from '@/components/kinzola/shared/city-input';

export default function EditProfile() {
  const { user, setShowEditProfile, updateProfile } = useKinzolaStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    pseudo: user?.pseudo || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || 'femme',
    city: user?.city || '',
    profession: user?.profession || '',
    religion: user?.religion || '',
    bio: user?.bio || '',
    interests: user?.interests || [] as string[],
    lookingFor: (user as any)?.lookingFor || 'relation sérieuse',
    height: (user as any)?.height?.toString() || '',
  });

  // Local gallery state (synced with user.photoGallery)
  const [localGallery, setLocalGallery] = useState<string[]>(user?.photoGallery || []);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
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

  // ─── Avatar file handler ───
  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        updateProfile({ photoUrl: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [updateProfile]);

  // ─── Gallery file handler ───
  const handleGalleryFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (localGallery.length >= 5) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const newGallery = [...localGallery, ev.target.result as string];
        setLocalGallery(newGallery);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [localGallery]);

  // ─── Remove gallery photo ───
  const handleRemoveGalleryPhoto = useCallback((index: number) => {
    setLocalGallery(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleSave = () => {
    updateProfile({
      name: form.name,
      pseudo: form.pseudo,
      age: parseInt(form.age) || user?.age || 25,
      gender: form.gender as 'homme' | 'femme',
      city: form.city,
      profession: form.profession,
      religion: form.religion,
      bio: form.bio,
      interests: form.interests,
      photoGallery: localGallery,
      lookingFor: form.lookingFor,
      height: parseInt(form.height) || undefined,
    } as any);
    setShowEditProfile(false);
  };

  const inputClass = 'w-full h-12 px-4 rounded-xl glass bg-white/5 text-white text-sm focus:outline-none transition-all';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryFileChange}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full rounded-t-3xl max-h-[90vh] flex flex-col"
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
          <button onClick={() => setShowEditProfile(false)} className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h3 className="text-lg font-bold">Modifier le profil</h3>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-full text-white text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
            }}
          >
            Enregistrer
          </button>
        </div>

        {/* Centered avatar with camera overlay */}
        <div className="flex justify-center py-4">
          <div className="relative">
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="cursor-pointer"
            >
              <div
                className="w-24 h-24 rounded-full p-[3px]"
                style={{
                  background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                }}
              >
                <img
                  src={user?.photoUrl || ''}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                  style={{ border: '3px solid #060E1A' }}
                />
              </div>
            </button>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                boxShadow: '0 0 15px rgba(43, 127, 255, 0.3)',
              }}
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          {/* ─── Photo Gallery Section ─── */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-semibold text-kinzola-muted uppercase tracking-wider">
                Photos ({localGallery.length}/5)
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {localGallery.map((photo, i) => (
                  <motion.div
                    key={`gallery-${photo}-${i}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="aspect-square rounded-xl overflow-hidden relative group"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveGalleryPhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ background: 'rgba(239, 68, 68, 0.85)' }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* Ajouter button — max 5 photos */}
              {localGallery.length < 5 && (
                <motion.button
                  key="add-gallery"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Plus className="w-5 h-5 text-kinzola-muted" />
                  <span className="text-[9px] text-kinzola-muted font-medium">Ajouter</span>
                </motion.button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-kinzola-muted mb-1 block">Nom complet</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-[11px] text-kinzola-muted mb-1 block">Pseudo</label>
            <input
              type="text"
              value={form.pseudo}
              onChange={(e) => updateForm('pseudo', e.target.value)}
              className={inputClass}
              placeholder="Votre pseudo unique"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-kinzola-muted mb-1 block">Âge</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => updateForm('age', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] text-kinzola-muted mb-1 block">Genre</label>
              <select
                value={form.gender}
                onChange={(e) => updateForm('gender', e.target.value)}
                className="w-full h-12 px-4 rounded-xl glass bg-white/5 text-white text-sm focus:outline-none transition-all appearance-none"
              >
                <option value="femme" className="bg-kinzola-deep">Femme</option>
                <option value="homme" className="bg-kinzola-deep">Homme</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-kinzola-muted mb-1 block">Ville</label>
            <CityInput
              value={form.city}
              onChange={(city) => updateForm('city', city)}
              placeholder="Votre ville"
              className="!h-12"
            />
          </div>

          <div>
            <label className="text-[11px] text-kinzola-muted mb-1 block">Profession</label>
            <input
              type="text"
              value={form.profession}
              onChange={(e) => updateForm('profession', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-[11px] text-kinzola-muted mb-1 block">Religion</label>
            <select
              value={form.religion}
              onChange={(e) => updateForm('religion', e.target.value)}
              className="w-full h-12 px-4 rounded-xl glass bg-white/5 text-white text-sm focus:outline-none transition-all appearance-none"
            >
              <option value="" className="bg-kinzola-deep">Non spécifié</option>
              {AVAILABLE_RELIGIONS.map(rel => (
                <option key={rel} value={rel} className="bg-kinzola-deep">{rel}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-kinzola-muted mb-1 block">Taille (cm)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => updateForm('height', e.target.value)}
                className={inputClass}
                placeholder="165"
              />
            </div>
            <div>
              <label className="text-[11px] text-kinzola-muted mb-1 block">Je cherche</label>
              <select
                value={form.lookingFor}
                onChange={(e) => updateForm('lookingFor', e.target.value)}
                className="w-full h-12 px-4 rounded-xl glass bg-white/5 text-white text-sm focus:outline-none transition-all appearance-none"
              >
                <option value="relation sérieuse" className="bg-kinzola-deep">Relation sérieuse</option>
                <option value="amitié" className="bg-kinzola-deep">Amitié</option>
                <option value="discussion" className="bg-kinzola-deep">Discussion</option>
                <option value="rien de spécial" className="bg-kinzola-deep">Rien de spécial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-kinzola-muted mb-1 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => updateForm('bio', e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full py-3 px-4 rounded-xl glass bg-white/5 text-white text-sm focus:outline-none resize-none transition-all"
            />
            <p className="text-[10px] text-kinzola-muted/60 text-right mt-1">{form.bio.length}/300</p>
          </div>

          <div>
            <label className="text-[11px] text-kinzola-muted mb-2 block">Centres d&apos;intérêt ({form.interests.length}/8)</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.slice(0, 15).map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    form.interests.includes(interest)
                      ? 'text-white'
                      : 'glass text-kinzola-muted hover:text-white'
                  }`}
                  style={form.interests.includes(interest) ? {
                    background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                    boxShadow: '0 0 10px rgba(43, 127, 255, 0.3)',
                  } : {}}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
