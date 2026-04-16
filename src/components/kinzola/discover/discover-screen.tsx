'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, LayoutGrid, List, Heart, UserPlus } from 'lucide-react';
import { useKinzolaStore } from '@/store/use-kinzola-store';
import SwipeView from './swipe-view';
import GridView from './grid-view';
import FilterPanel from './filter-panel';

export default function DiscoverScreen() {
  const { discoverMode, setDiscoverMode, discoverIntent, setDiscoverIntent, showFilters, setShowFilters } = useKinzolaStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-2">
        {/* Logo + Slogan - top left */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src="/kinzola-logo.png"
            alt="Kinzola"
            className="h-7 w-auto object-contain"
          />
          <span
            className="text-[11px] font-medium tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #2B7FFF, #FF4D8D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Connexion d'âmes au Congo
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {/* Search bar - glass, rounded-full */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-kinzola-muted" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full glass bg-white/5 text-white text-sm placeholder:text-kinzola-muted/50 focus:outline-none focus:border-kinzola-blue/50 transition-all"
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(43, 127, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Filter button - gradient circle */}
          <button
            onClick={() => setShowFilters(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
              boxShadow: '0 0 20px rgba(43, 127, 255, 0.3)',
            }}
          >
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mode toggle - pill buttons */}
        <div className="flex p-1 rounded-full glass">
          <button
            onClick={() => setDiscoverMode('swipe')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 rounded-full transition-all duration-300 ${
              discoverMode === 'swipe' ? 'text-white' : 'text-kinzola-muted'
            }`}
            style={discoverMode === 'swipe' ? {
              background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
              boxShadow: '0 0 15px rgba(43, 127, 255, 0.3)',
            } : {}}
          >
            <List className="w-3.5 h-3.5" />
            Swipe
          </button>
          <button
            onClick={() => setDiscoverMode('grid')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 rounded-full transition-all duration-300 ${
              discoverMode === 'grid' ? 'text-white' : 'text-kinzola-muted'
            }`}
            style={discoverMode === 'grid' ? {
              background: 'linear-gradient(135deg, #2B7FFF 0%, #FF4D8D 100%)',
              boxShadow: '0 0 15px rgba(43, 127, 255, 0.3)',
            } : {}}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grille
          </button>
        </div>

        {/* Intent toggle - Amitié / Amour */}
        <div className="flex p-1 rounded-full glass mt-2">
          <button
            onClick={() => setDiscoverIntent('amitie')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 rounded-full transition-all duration-300 ${
              discoverIntent === 'amitie' ? 'text-white' : 'text-kinzola-muted'
            }`}
            style={discoverIntent === 'amitie' ? {
              background: 'linear-gradient(135deg, #2B7FFF, #1B8FFF)',
              boxShadow: '0 0 15px rgba(43, 127, 255, 0.3)',
            } : {}}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Amitié
          </button>
          <button
            onClick={() => setDiscoverIntent('amour')}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 rounded-full transition-all duration-300 ${
              discoverIntent === 'amour' ? 'text-white' : 'text-kinzola-muted'
            }`}
            style={discoverIntent === 'amour' ? {
              background: 'linear-gradient(135deg, #FF4D8D, #FF2D6D)',
              boxShadow: '0 0 15px rgba(255, 77, 141, 0.3)',
            } : {}}
          >
            <Heart className="w-3.5 h-3.5" />
            Amour
          </button>
        </div>
      </div>

      {/* Content */}
      {discoverMode === 'swipe' ? <SwipeView /> : <GridView />}

      {/* Filter Panel */}
      <AnimatePresence mode="wait">
        {showFilters && <FilterPanel key="filter-panel" />}
      </AnimatePresence>
    </div>
  );
}
