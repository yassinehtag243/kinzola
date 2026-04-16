'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { AVAILABLE_CITIES } from '@/lib/mock-data';

interface CityInputProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CityInput({ value, onChange, placeholder = 'Votre ville', className = '' }: CityInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filteredCities = AVAILABLE_CITIES.filter(c =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When value changes externally, sync query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const selectCity = (city: string) => {
    onChange(city);
    setQuery(city);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    onChange(val); // Allow manual entry
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kinzola-muted" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`w-full h-[52px] pl-12 pr-10 rounded-xl glass bg-white/5 text-white text-sm placeholder:text-kinzola-muted/50 focus:outline-none transition-all ${className}`}
          style={{ boxShadow: isOpen ? '0 0 20px rgba(43, 127, 255, 0.2)' : 'none', borderColor: isOpen ? 'rgba(43, 127, 255, 0.5)' : 'rgba(255, 255, 255, 0.08)' }}
        />
        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-kinzola-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto" style={{
          background: 'rgba(10, 20, 40, 0.98)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}>
          {filteredCities.length > 0 ? (
            filteredCities.map(city => (
              <button
                key={city}
                onClick={() => selectCity(city)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors ${query.toLowerCase() === city.toLowerCase() ? 'text-white bg-white/5' : 'text-white/70'}`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-kinzola-blue/60" />
                  {city}
                </span>
              </button>
            ))
          ) : (
            query.trim() && (
              <div className="px-4 py-3 text-sm text-kinzola-muted/60">
                Aucune ville trouvée
              </div>
            )
          )}

          {query.trim() && !AVAILABLE_CITIES.some(c => c.toLowerCase() === query.toLowerCase()) && (
            <button
              onClick={() => { selectCity(query); }}
              className="w-full px-4 py-3 text-left text-sm text-kinzola-blue hover:bg-white/5 transition-colors border-t border-white/5"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Utiliser &quot;{query}&quot;
              </span>
            </button>
          )}

          <div className="px-4 py-2 text-[11px] text-kinzola-muted/40 text-center border-t border-white/5">
            Saisir manuellement une ville
          </div>
        </div>
      )}
    </div>
  );
}
