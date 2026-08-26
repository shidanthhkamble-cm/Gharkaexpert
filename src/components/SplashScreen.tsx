import React from 'react';
import { motion } from 'motion/react';
import { HardHat, Hammer, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { t } from '../data/translations';

interface SplashScreenProps {
  currentLanguage: Language;
  onProceed: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ currentLanguage, onProceed }) => {
  return (
    <div className="relative min-h-[580px] h-full w-full bg-gradient-to-b from-blue-700 via-blue-800 to-slate-900 text-white flex flex-col items-center justify-between p-6 overflow-hidden rounded-xl shadow-xl">
      {/* Background Subtle Construction Grid Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Top Bar Status / Brand Pill */}
      <div className="w-full flex justify-between items-center pt-2 z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-medium text-blue-100">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> 100% Verified Karigars
        </span>
        <span className="text-xs text-blue-100/80 font-mono">v2.4 • India 🇮🇳</span>
      </div>

      {/* Main Center Animated Logo Area */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 py-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative mb-6"
        >
          {/* Glowing Aura */}
          <div className="absolute -inset-4 bg-blue-400/30 rounded-3xl blur-xl animate-pulse" />
          
          <div className="relative w-28 h-28 bg-white text-blue-700 rounded-2xl shadow-xl flex items-center justify-center border-2 border-blue-100">
            <HardHat className="w-14 h-14 text-blue-700 stroke-[2.2]" />
            <motion.div 
              animate={{ rotate: [0, 15, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -bottom-2 -right-2 bg-slate-900 p-2 rounded-xl border border-blue-400 text-blue-300 shadow-md"
            >
              <Hammer className="w-5 h-5" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans"
        >
          GharKaExpert
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-base font-bold text-blue-200 mt-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm"
        >
          “{t('tagline', currentLanguage)}”
        </motion.p>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs sm:text-sm text-slate-200 mt-4 max-w-xs leading-relaxed font-normal"
        >
          {t('appSubHeading', currentLanguage)}
        </motion.p>
      </div>

      {/* Bottom CTA Area */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm z-10 space-y-3 pb-4"
      >
        <button
          onClick={onProceed}
          className="w-full py-3.5 px-6 bg-white hover:bg-slate-100 text-blue-800 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-base"
        >
          <span>{t('continueBtn', currentLanguage)}</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-blue-800" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          <span>Supports 14 Indian Languages & Offline Helpline</span>
        </div>
      </motion.div>
    </div>
  );
};
