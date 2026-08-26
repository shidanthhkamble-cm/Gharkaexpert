import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Hammer, 
  Paintbrush, 
  Wrench, 
  Zap, 
  Users, 
  Briefcase,
  Sparkles,
  Layers,
  Wind,
  Tv,
  Bike,
  Car,
  Truck
} from 'lucide-react';
import { TradeCategory, Language } from '../types';
import { getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface CategoryGridProps {
  selectedCategory: TradeCategory | 'all';
  onSelectCategory: (category: TradeCategory | 'all') => void;
  currentLanguage: Language;
}

export interface CategoryDef {
  id: TradeCategory;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  section: 'home' | 'appliance' | 'auto';
  pricingType: 'daily' | 'visiting';
  tag?: string;
}

export const CATEGORIES: CategoryDef[] = [
  // Home Trades
  { id: 'mason', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', section: 'home', pricingType: 'daily', tag: 'Dihadi / Daily' },
  { id: 'plumber', icon: Wrench, color: 'text-cyan-600', bg: 'bg-cyan-50', section: 'home', pricingType: 'daily', tag: 'Emergency' },
  { id: 'carpenter', icon: Hammer, color: 'text-amber-600', bg: 'bg-amber-50', section: 'home', pricingType: 'daily', tag: 'Dihadi / Sq.Ft' },
  { id: 'painter', icon: Paintbrush, color: 'text-purple-600', bg: 'bg-purple-50', section: 'home', pricingType: 'daily', tag: 'Sq.Ft Rate' },
  { id: 'electrician', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', section: 'home', pricingType: 'daily', tag: 'Full Wiring' },
  { id: 'tiles', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50', section: 'home', pricingType: 'daily', tag: 'Per Sq.Ft' },
  { id: 'helper', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100', section: 'home', pricingType: 'daily', tag: 'Majdoori' },

  // Appliance Repair
  { id: 'ac_repair', icon: Wind, color: 'text-sky-600', bg: 'bg-sky-50', section: 'appliance', pricingType: 'visiting', tag: 'Visiting Fee' },
  { id: 'appliance_repair', icon: Tv, color: 'text-indigo-600', bg: 'bg-indigo-50', section: 'appliance', pricingType: 'visiting', tag: 'Visiting Fee' },

  // Auto Mechanics
  { id: 'bike_mechanic', icon: Bike, color: 'text-orange-600', bg: 'bg-orange-50', section: 'auto', pricingType: 'visiting', tag: 'Roadside 24x7' },
  { id: 'car_mechanic', icon: Car, color: 'text-red-600', bg: 'bg-red-50', section: 'auto', pricingType: 'visiting', tag: 'Diagnostic Fee' },
  { id: 'auto_mechanic', icon: Truck, color: 'text-teal-600', bg: 'bg-teal-50', section: 'auto', pricingType: 'visiting', tag: 'On-Spot Repair' },
  { id: 'truck_mechanic', icon: Truck, color: 'text-rose-700', bg: 'bg-rose-50', section: 'auto', pricingType: 'visiting', tag: 'Highway Breakdown' },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
  currentLanguage,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'home' | 'appliance' | 'auto'>('all');

  const filteredCategories = CATEGORIES.filter(cat => {
    if (activeSection === 'all') return true;
    return cat.section === activeSection;
  });

  return (
    <div className="space-y-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
      {/* Header & Section Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Services & GharKaExpert
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">0% Commission • Direct Connect</p>
          </div>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
          >
            Show All ({CATEGORIES.length})
          </button>
        )}
      </div>

      {/* Sub-Category Section Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeSection === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Services ({CATEGORIES.length})
        </button>

        <button
          onClick={() => setActiveSection('home')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSection === 'home'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <span>🏠 Home Trades</span>
        </button>

        <button
          onClick={() => setActiveSection('appliance')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSection === 'appliance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <span>⚡ Appliance Repair</span>
        </button>

        <button
          onClick={() => setActiveSection('auto')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeSection === 'auto'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <span>🛠️ Auto Mechanics</span>
        </button>
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
        {filteredCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const label = getCategoryLabel(cat.id, currentLanguage);
          const icon3dUrl = getCategory3DIcon(cat.id);

          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
              className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col items-center text-center justify-between transition-all relative shadow-2xs cursor-pointer h-[118px] group ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/40 font-bold shadow-md'
                  : 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-blue-400 text-slate-800 hover:shadow-sm'
              }`}
            >
              {/* Badge Tag */}
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}>
                {cat.tag}
              </span>

              {/* 3D Isometric Icon Container */}
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-0.5 ${
                isSelected ? 'ring-2 ring-white/80 bg-white/10' : `${cat.bg} border border-slate-200/60 shadow-2xs`
              } flex items-center justify-center shrink-0 my-1 group-hover:scale-105 transition-transform overflow-hidden`}>
                <img
                  src={icon3dUrl}
                  alt={label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg shadow-2xs"
                />
              </div>

              <span className={`text-[11px] font-extrabold leading-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {label}
              </span>

              {isSelected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center font-black border-2 border-white shadow-xs">
                  ✓
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
