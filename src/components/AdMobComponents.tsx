import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Sparkles, AlertCircle, ShieldAlert, Info, ChevronRight } from 'lucide-react';
import { ADMOB_CONFIG } from '../services/admobService';

interface BannerAdProps {
  onDismiss?: () => void;
  adUnitId?: string;
}

const BANNER_SPONSORS = [
  {
    title: 'UltraTech Cement & Asian Paints',
    subtitle: 'Direct hardware store pricing • Free delivery at your site',
    cta: 'Order Now',
    tag: '15% OFF',
    emoji: '🏗️',
    link: 'https://google.com'
  },
  {
    title: 'Bosch & Stanley Power Tools',
    subtitle: 'Heavy-duty angle grinders & impact drills with 1-year warranty',
    cta: 'View Tools',
    tag: 'BEST PRICE',
    emoji: '⚡',
    link: 'https://google.com'
  },
  {
    title: 'Havells & Finolex Wires & Switches',
    subtitle: 'ISI Certified Fire-Resistant wiring for residential projects',
    cta: 'Explore',
    tag: 'BULK SAVE',
    emoji: '🔌',
    link: 'https://google.com'
  }
];

export const BannerAd: React.FC<BannerAdProps> = ({ 
  onDismiss,
  adUnitId = ADMOB_CONFIG.bannerAdUnitId 
}) => {
  const [visible, setVisible] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    // Rotate ads every 10 seconds
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % BANNER_SPONSORS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const currentAd = BANNER_SPONSORS[currentAdIndex];

  return (
    <div className="w-full bg-slate-900 border-t-2 border-amber-500 text-white shadow-2xl relative z-30 transition-all">
      {/* Top micro AdMob meta identifier */}
      <div className="bg-slate-950 px-3 py-0.5 flex items-center justify-between text-[9px] text-slate-400 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider">
            Google AdMob
          </span>
          <span className="font-mono text-slate-400 hidden xs:inline">
            Unit: {adUnitId.slice(0, 24)}...
          </span>
        </div>
        <span className="text-[8px] text-slate-500 flex items-center gap-1">
          <span>AdChoices</span>
          <span className="text-amber-400 font-bold">ⓘ</span>
        </span>
      </div>

      <div className="p-2 sm:p-2.5 px-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-base">
            {currentAd.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-black text-amber-200 truncate">
                {currentAd.title}
              </p>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8px] font-black px-1 rounded shrink-0">
                {currentAd.tag}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate">
              {currentAd.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={currentAd.link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg flex items-center gap-1 transition-all shadow-xs active:scale-95"
          >
            <span>{currentAd.cta}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          {onDismiss && (
            <button
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
              title="Close Ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NativeAdCard: React.FC = () => {
  return (
    <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/40 rounded-2xl shadow-md text-white my-3 relative overflow-hidden">
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="bg-amber-400 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider">
          AdMob Native
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-500/20 border border-amber-400/40 rounded-xl flex items-center justify-center shrink-0 text-amber-400 font-extrabold text-xl">
          🛠️
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-extrabold text-xs sm:text-sm text-amber-200 truncate">
            Bosch Professional Power Tools & Safety Helmets
          </h4>
          <p className="text-[11px] text-slate-300 line-clamp-2">
            Get genuine drills, angle grinders, and safety boots delivered in 2 hours to your job site.
          </p>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold">⭐ 4.9 (2,400+ Orders)</span>
            <a 
              href="https://google.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-amber-300 font-extrabold underline cursor-pointer flex items-center gap-0.5"
            >
              Shop Tools Now <ChevronRight className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InterstitialAdModalProps {
  onClose: () => void;
  title?: string;
  subtitle?: string;
  adUnitId?: string;
  onProceedAction?: () => void;
}

const INTERSTITIAL_CREATIVES = [
  {
    title: 'Tata Tiscon 550D Steel & UltraTech Cement',
    description: 'Direct wholesale rates on primary construction steel and Portland Pozzolana Cement. Delivery within 24 hours guaranteed.',
    coupon: 'EXPERT100',
    couponDiscount: 'Save ₹100 on raw hardware materials',
    emoji: '🏗️'
  },
  {
    title: 'Bosch & Stanley Heavy Duty Drills',
    description: 'Equip your site with brushless cordless rotary hammers and angle grinders with 1-year on-site replacement warranty.',
    coupon: 'TOOLSPRO20',
    couponDiscount: 'Flat 20% discount at verified tool partners',
    emoji: '⚡'
  },
  {
    title: 'Havells Smart Home Electrical Supplies',
    description: 'Upgrade wiring, MCB distribution boards, and modular switches with flame-retardant industrial standard materials.',
    coupon: 'POWER150',
    couponDiscount: 'Save ₹150 on electrical switches bundle',
    emoji: '🔌'
  }
];

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  onClose,
  title = 'GharKaExpert Partner Sponsor',
  subtitle,
  adUnitId = ADMOB_CONFIG.interstitialAdUnitId,
  onProceedAction,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [canSkip, setCanSkip] = useState(false);
  const [creative] = useState(() => 
    INTERSTITIAL_CREATIVES[Math.floor(Math.random() * INTERSTITIAL_CREATIVES.length)]
  );

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanSkip(true);
    }
  }, [countdown]);

  const handleFinish = () => {
    if (onProceedAction) {
      onProceedAction();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-4"
      >
        {/* AdMob Header Bar */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
              AdMob Interstitial
            </span>
            <span className="text-[9px] text-slate-400 font-mono hidden xs:inline">
              Unit: {adUnitId.slice(-10)}
            </span>
          </div>

          <button
            onClick={handleFinish}
            disabled={!canSkip}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              canSkip
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {canSkip ? (
              <>
                <span>Skip Ad</span>
                <X className="w-3.5 h-3.5" />
              </>
            ) : (
              <span>Skip in {countdown}s</span>
            )}
          </button>
        </div>

        {/* Ad Visual */}
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 rounded-3xl flex items-center justify-center text-4xl shadow-xl my-1 relative">
          <span className="animate-bounce">{creative.emoji}</span>
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-slate-900 border border-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-300">
            Ad
          </div>
        </div>

        {/* Ad Copy */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-amber-300 leading-snug">
            {creative.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {subtitle || creative.description}
          </p>
        </div>

        {/* Special Coupon Promo */}
        <div className="w-full p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-left space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-300 font-bold">
            <span className="text-[11px] text-slate-200">GharKaExpert Sponsor Perk</span>
            <span className="text-emerald-400 font-mono font-black bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {creative.coupon}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">{creative.couponDiscount}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Continue to Contact 📞</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
