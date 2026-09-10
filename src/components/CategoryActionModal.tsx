import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Users, 
  Radio, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  X, 
  ArrowRight, 
  Lock,
  Compass
} from 'lucide-react';
import { TradeCategory, Language } from '../types';
import { getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface CategoryActionModalProps {
  isOpen: boolean;
  category: TradeCategory;
  currentLanguage: Language;
  onInstantDispatch: (category: TradeCategory) => void;
  onBrowseProfiles: (category: TradeCategory) => void;
  onClose: () => void;
}

export const CategoryActionModal: React.FC<CategoryActionModalProps> = ({
  isOpen,
  category,
  currentLanguage,
  onInstantDispatch,
  onBrowseProfiles,
  onClose,
}) => {
  if (!isOpen) return null;

  const categoryLabel = getCategoryLabel(category, currentLanguage);
  const icon3dUrl = getCategory3DIcon(category);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 relative flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img
                  src={icon3dUrl}
                  alt={categoryLabel}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl shadow-xs"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded">
                    Service Selection
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    0% Commission
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {categoryLabel} Services
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtitle instructions */}
          <div className="px-4 pt-3.5 pb-1 sm:px-5">
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              Select how you would like to connect with a verified <strong className="text-slate-900">{categoryLabel}</strong>:
            </p>
          </div>

          {/* Exactly Two Options */}
          <div className="p-4 sm:p-5 space-y-3 pt-2">
            {/* OPTION 1: Instant Dispatch */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onInstantDispatch(category)}
              className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/60 hover:border-emerald-400 rounded-2xl p-4 cursor-pointer text-white shadow-md hover:shadow-lg transition-all group relative overflow-hidden"
            >
              {/* Top pill badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 rounded-md text-[10px] font-black tracking-wide uppercase shadow-2xs">
                    Option 1 • Instant Dispatch
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    2km Radius
                  </span>
                </div>
                <span className="text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded">
                  ⚡ AdMob Sponsored
                </span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                    <span>Instant Dispatch</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h4>
                  <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
                    Automatically search and connect with an available worker within a <strong>2km radius</strong> using the <strong>Fair Rotation algorithm</strong> (triggering an Interstitial ad first).
                  </p>
                </div>
              </div>

              {/* Perks / Tags */}
              <div className="mt-3 pt-2.5 border-t border-emerald-900/60 grid grid-cols-2 gap-1.5 text-[10px] text-emerald-200">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>15-Min Doorstep ETA</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Nearby within 2km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Fair Rotation Algorithm</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Zero Booking Commission</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300">
                  Tap to launch auto-match
                </span>
                <div className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm group-hover:translate-x-0.5 transition-transform">
                  <span>Start Instant Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>

            {/* OPTION 2: Browse Profiles */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onBrowseProfiles(category)}
              className="bg-slate-50 hover:bg-blue-50/60 border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-4 cursor-pointer text-slate-900 shadow-xs hover:shadow-md transition-all group relative"
            >
              {/* Top pill badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-black tracking-wide uppercase">
                    Option 2 • Browse Profiles
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-blue-600" />
                    Manual Browse
                  </span>
                </div>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Masked Call
                </span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>Browse Profiles</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Let the user scroll down to view worker profiles, check details, and call or connect manually.
                  </p>
                </div>
              </div>

              {/* Perks / Tags */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-2 gap-1.5 text-[10px] text-slate-600">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Aadhaar Verified Karigars</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChevronDown className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>View Photos & Daily Rates</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Encrypted Masked Calling</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Direct In-App Chat & Book</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700">
                  Filter & scroll to worker list
                </span>
                <div className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs group-hover:translate-x-0.5 transition-transform">
                  <span>Browse {categoryLabel}s</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>GharKaExpert 30-Day Platform Warranty</span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
