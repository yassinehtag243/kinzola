'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, Search, Plus } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import { AVAILABLE_CITIES, AVAILABLE_RELIGIONS, AVAILABLE_INTERESTS } from '@/lib/mock-data';

export default function FilterPanel() {
  const { filters, applyFilters, resetFilters, setShowFilters } = useKinzolaStore();
  const [localFilters, setLocalFilters] = useState(filters);
  const [selectedCities, setSelectedCities] = useState<string[]>(filters.cities);
  const [selectedReligions, setSelectedReligions] = useState<string[]>(filters.religions);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(filters.interests);
  const [selectedGender, setSelectedGender] = useState(filters.gender);
  const [citySearch, setCitySearch] = useState('');
  const [customCityInput, setCustomCityInput] = useState('');
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const toggleReligion = (rel: string) => {
    setSelectedReligions(prev =>
      prev.includes(rel) ? prev.filter(r => r !== rel) : [...prev, rel]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleApply = () => {
    applyFilters({
      ...localFilters,
      cities: selectedCities,
      religions: selectedReligions,
      interests: selectedInterests,
      gender: selectedGender,
    });
  };

  const handleReset = () => {
    setSelectedCities([]);
    setSelectedReligions([]);
    setSelectedInterests([]);
    setSelectedGender('tous');
    setLocalFilters({ ageMin: 18, ageMax: 50, cities: [], religions: [], interests: [], gender: 'tous' });
    resetFilters();
    setShowFilters(false);
  };

  const pillButtonClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
      active
        ? 'text-white'
        : 'glass text-kinzola-muted hover:text-white'
    }`;

  const activePillStyle = {
    background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
    boxShadow: '0 0 10px rgba(43, 127, 255, 0.3)',
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowFilters(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        className="relative w-full max-h-[80vh] flex flex-col overflow-hidden rounded-t-3xl"
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
          <h3 className="text-xl font-bold">Filtres</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <RotateCcw className="w-4 h-4 text-kinzola-muted" />
            </button>
            <button onClick={() => setShowFilters(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 space-y-5">
          {/* Age Range */}
          <div>
            <label className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider mb-3 block">Âge</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  min="18"
                  max="50"
                  value={localFilters.ageMin}
                  onChange={(e) => setLocalFilters({ ...localFilters, ageMin: parseInt(e.target.value) || 18 })}
                  className="w-full h-11 px-3 rounded-xl glass bg-white/5 text-white text-center text-sm focus:outline-none transition-all"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(43, 127, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              <span className="text-kinzola-muted font-light">—</span>
              <div className="flex-1">
                <input
                  type="number"
                  min="18"
                  max="50"
                  value={localFilters.ageMax}
                  onChange={(e) => setLocalFilters({ ...localFilters, ageMax: parseInt(e.target.value) || 50 })}
                  className="w-full h-11 px-3 rounded-xl glass bg-white/5 text-white text-center text-sm focus:outline-none transition-all"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(43, 127, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider mb-3 block">Genre</label>
            <div className="flex gap-2">
              {[
                { value: 'tous', label: 'Tous' },
                { value: 'homme', label: 'Hommes' },
                { value: 'femme', label: 'Femmes' },
              ].map(g => (
                <button
                  key={g.value}
                  onClick={() => setSelectedGender(g.value as 'homme' | 'femme' | 'tous')}
                  className={`flex-1 h-11 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedGender === g.value
                      ? 'text-white'
                      : 'glass text-kinzola-muted hover:text-white'
                  }`}
                  style={selectedGender === g.value ? activePillStyle : {}}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider mb-3 block">Ville</label>
            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kinzola-muted/50" />
              <input
                type="text"
                placeholder="Rechercher une ville..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg glass bg-white/5 text-white text-xs placeholder:text-kinzola-muted/40 focus:outline-none transition-all"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(43, 127, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {AVAILABLE_CITIES.filter(c =>
                c.toLowerCase().includes(citySearch.toLowerCase())
              ).map(city => (
                <button
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={pillButtonClass(selectedCities.includes(city))}
                  style={selectedCities.includes(city) ? activePillStyle : {}}
                >
                  {city}
                </button>
              ))}
            </div>
            {/* Custom city input */}
            {!showCustomCityInput ? (
              <button
                onClick={() => setShowCustomCityInput(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-kinzola-blue hover:text-kinzola-blue/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Autre ville...
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nom de la ville"
                  value={customCityInput}
                  onChange={(e) => setCustomCityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customCityInput.trim()) {
                      toggleCity(customCityInput.trim());
                      setCustomCityInput('');
                      setShowCustomCityInput(false);
                    }
                  }}
                  className="flex-1 h-9 px-3 rounded-lg glass bg-white/5 text-white text-xs placeholder:text-kinzola-muted/40 focus:outline-none transition-all"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (customCityInput.trim()) {
                      toggleCity(customCityInput.trim());
                    }
                    setCustomCityInput('');
                    setShowCustomCityInput(false);
                  }}
                  className="h-9 px-3 rounded-lg text-xs font-medium text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
                  }}
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {/* Religion */}
          <div>
            <label className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider mb-3 block">Religion</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_RELIGIONS.map(rel => (
                <button
                  key={rel}
                  onClick={() => toggleReligion(rel)}
                  className={pillButtonClass(selectedReligions.includes(rel))}
                  style={selectedReligions.includes(rel) ? activePillStyle : {}}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-[11px] font-medium text-kinzola-muted uppercase tracking-wider mb-3 block">Centres d&apos;intérêt</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.slice(0, 12).map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={pillButtonClass(selectedInterests.includes(interest))}
                  style={selectedInterests.includes(interest) ? activePillStyle : {}}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-5 safe-bottom">
          <button
            onClick={handleApply}
            className="w-full h-12 rounded-2xl text-white font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #FF4D8D 0%, #FF2D6D 100%)',
              boxShadow: '0 0 30px rgba(255, 77, 141, 0.4)',
            }}
          >
            Appliquer les filtres
          </button>
        </div>
      </div>
    </motion.div>
  );
}
