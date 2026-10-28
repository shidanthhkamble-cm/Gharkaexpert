import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HardHat, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { t } from '../data/translations';
import workerMascotImg from '../assets/images/cleanshaven_3d_worker_mascot_1793194501691.jpg';

interface SplashScreenProps {
  currentLanguage: Language;
  onProceed: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ currentLanguage, onProceed }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative min-h-dvh flex-1 w-full bg-[#1E3A8A] text-white flex flex-col items-center justify-between px-6 py-6 overflow-hidden select-none">
      {/* Subtle Ambient Deep-Blue Studio Illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(96,165,250,0.28)_0%,rgba(37,99,235,0.12)_38%,rgba(30,58,138,0)_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-[#13255C]/70"
      />

      {/* Top Trust Header */}
      <div className="relative z-10 w-full max-w-sm flex justify-between items-center pt-1 pb-3.5 border-b border-white/10 text-xs text-blue-100/95 font-medium tracking-wide">
        <span className="whitespace-nowrap">100% Verified Karigars</span>
        <span className="text-blue-200/90 whitespace-nowrap">India · 0% Commission</span>
      </div>

      {/* Main Center Mascot Medallion & Brand Lockup */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-6">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-7 flex items-center justify-center"
        >
          {/* Soft Outer Diffusion Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-tr from-sky-400/25 via-blue-300/20 to-white/20 blur-2xl"
          />

          {/* Concentric Soft Gradient Halo Circle Behind Portrait */}
          <div className="relative p-3 rounded-full bg-gradient-to-b from-sky-300/25 via-blue-400/15 to-blue-950/45 border border-white/20 shadow-[0_22px_50px_rgba(9,19,58,0.55)] backdrop-blur-sm flex items-center justify-center">
            {/* Circular Character Container with Glowing White Border Ring & Soft Gradient Backdrop */}
            <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full overflow-hidden bg-gradient-to-b from-[#60A5FA] via-[#2563EB] to-[#1D4ED8] border-[3px] border-white/95 ring-4 ring-white/20 shadow-[0_0_28px_rgba(255,255,255,0.42),0_12px_28px_rgba(10,22,68,0.5)] flex items-center justify-center">
              {!imgError ? (
                <img
                  src={workerMascotImg}
                  alt="Clean-shaven 3D cartoon GharKaExpert professional worker wearing a yellow safety helmet, blue dungarees, and a tool belt"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center scale-[1.04]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#3B82F6] to-[#1E3A8A] text-white">
                  <HardHat className="w-16 h-16 text-amber-300 stroke-[2]" />
                </div>
              )}

              {/* Crisp Inner Rim Specular Highlight */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/35"
              />
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm text-balance"
        >
          GharKaExpert
        </motion.h1>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base font-semibold text-amber-300 mt-2.5 tracking-wide max-w-xs text-balance"
        >
          “{t('tagline', currentLanguage)}”
        </motion.p>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-sm text-blue-100/90 mt-2.5 max-w-xs leading-relaxed font-normal text-balance"
        >
          {t('appSubHeading', currentLanguage)}
        </motion.p>
      </div>

      {/* Bottom Primary Action Area */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.32, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm space-y-3.5 pb-3"
      >
        <button
          onClick={onProceed}
          className="w-full min-h-[52px] py-3.5 px-6 bg-white hover:bg-blue-50 text-[#1E3A8A] font-bold rounded-2xl shadow-[0_14px_34px_rgba(8,18,58,0.42)] ring-1 ring-white/70 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 group text-base cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <span>{t('continueBtn', currentLanguage)}</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150 text-[#1E3A8A] shrink-0" />
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-blue-200/85 font-medium">
          <span>14 Indian Languages</span>
          <span aria-hidden="true">·</span>
          <span>Offline Helpline</span>
        </div>
      </motion.div>
    </div>
  );
};
