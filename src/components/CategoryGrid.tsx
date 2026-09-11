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
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Service Categories • Instant Dispatch
              </h3>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Fair Rotation
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">Click any service icon (Plumbing, Carpentry, Mason, etc.) to immediately auto-match nearest Karigar</p>
          </div>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
          >
            Show All ({CATEGORIES.length})
          </button>
        )}
      </div>

      {/* Instant Dispatch & Browse Profiles Notice Banner */}
      <div 
        onClick={() => onSelectCategory(selectedCategory !== 'all' ? selectedCategory : 'plumber')}
        className="p-2.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/90 rounded-xl flex items-center justify-between text-xs text-slate-900 shadow-2xs cursor-pointer hover:shadow-xs transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
          <span className="font-extrabold text-[11px] sm:text-xs truncate">
            Tap any category below to choose <strong className="text-emerald-800">Instant Dispatch</strong> (1.5km Radius) or <strong className="text-blue-800">Browse Profiles</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectCategory(selectedCategory !== 'all' ? selectedCategory : 'plumber');
          }}
          className="text-[10px] font-black text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-2.5 py-1 rounded-full shrink-0 ml-2 cursor-pointer shadow-2xs transition-all active:scale-95"
          title="Open Category Options"
        >
          ⚡ 2 Options
        </button>
      </div>

      {/* Sub-Category Section Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSection === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Services ({CATEGORIES.length})
        </button>

        <button
          onClick={() => setActiveSection('home')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'home'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <span>🏠 Home Trades</span>
        </button>

        <button
          onClick={() => setActiveSection('appliance')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'appliance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <span>⚡ Appliance Repair</span>
        </button>

        <button
          onClick={() => setActiveSection('auto')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'auto'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <span>🛠️ Auto Mechanics</span>
        </button>
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-2.5">
        {filteredCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const label = getCategoryLabel(cat.id, currentLanguage);
          const icon3dUrl = getCategory3DIcon(cat.id);

          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col items-center text-center justify-between transition-all relative shadow-2xs cursor-pointer h-[122px] group ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/40 font-bold shadow-md'
                  : 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-blue-400 text-slate-800 hover:shadow-sm'
              }`}
            >
              {/* Badge Tag */}
              <div className="w-full flex items-center justify-center h-4.5">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider truncate max-w-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}>
                  {cat.tag}
                </span>
              </div>

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

              {/* Label */}
              <div className="w-full h-8 flex items-center justify-center px-0.5">
                <span className={`text-[11px] font-extrabold leading-tight line-clamp-2 text-center ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {label}
                </span>
              </div>

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
