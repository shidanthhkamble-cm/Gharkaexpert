import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  ShieldAlert, 
  Info, 
  ChevronRight,
  Phone,
  Zap,
  Play,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
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
  actionType?: 'call' | 'instant_dispatch' | 'whatsapp' | 'booking';
  targetWorkerName?: string;
}

const INTERSTITIAL_CREATIVES = [
  {
    title: 'Tata Tiscon 550D Steel & UltraTech Cement',
    description: 'Direct wholesale rates on primary construction steel & Portland Pozzolana Cement. Delivery within 24 hours guaranteed.',
    coupon: 'EXPERT100',
    couponDiscount: 'Save ₹100 on raw hardware materials',
    emoji: '🏗️',
    sponsor: 'Tata Steel & UltraTech Partner'
  },
  {
    title: 'Bosch & Stanley Heavy Duty Drills',
    description: 'Equip your site with brushless cordless rotary hammers and angle grinders with 1-year on-site replacement warranty.',
    coupon: 'TOOLSPRO20',
    couponDiscount: 'Flat 20% discount at verified tool partners',
    emoji: '⚡',
    sponsor: 'Bosch Professional Tools'
  },
  {
    title: 'Havells Smart Home Electrical Supplies',
    description: 'Upgrade wiring, MCB distribution boards, and modular switches with flame-retardant industrial standard materials.',
    coupon: 'POWER150',
    couponDiscount: 'Save ₹150 on electrical switches bundle',
    emoji: '🔌',
    sponsor: 'Havells India Certified'
  },
  {
    title: 'Asian Paints Royale & Dr. Fixit Waterproofing',
    description: 'Waterproofing chemicals, silicone sealants, and Royale luxury emulsions with doorstep shade consultations.',
    coupon: 'PAINT75',
    couponDiscount: 'Get free primer on orders above ₹2,000',
    emoji: '🎨',
    sponsor: 'Asian Paints & Pidilite'
  }
];

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  onClose,
  title = 'GharKaExpert Partner Sponsor',
  subtitle,
  adUnitId = ADMOB_CONFIG.interstitialAdUnitId,
  onProceedAction,
  actionType = 'call',
  targetWorkerName,
}) => {
  const TOTAL_DURATION = 3;
  const [countdown, setCountdown] = useState(TOTAL_DURATION);
  const [canSkip, setCanSkip] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const hasFinishedRef = useRef(false);

  const [creative] = useState(() => 
    INTERSTITIAL_CREATIVES[Math.floor(Math.random() * INTERSTITIAL_CREATIVES.length)]
  );

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsFinishing(true);

    // Proceed with connection immediately after ad finishes
    setTimeout(() => {
      if (onProceedAction) {
        onProceedAction();
      }
      onClose();
    }, 200);
  }, [onProceedAction, onClose]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanSkip(true);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // Ad playback completed! Automatically & immediately proceed with connection
      handleFinish();
    }
  }, [countdown, handleFinish]);

  const progressPercent = Math.min(100, Math.round(((TOTAL_DURATION - countdown) / TOTAL_DURATION) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-3.5"
      >
        {/* Animated Playback Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'linear' }}
          />
        </div>

        {/* AdMob Official Header Bar */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/90 pb-2.5 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase shadow-2xs">
              Google AdMob Interstitial
            </span>
            <span className="text-[9px] text-slate-400 font-mono hidden xs:inline">
              Unit: {adUnitId.slice(-10)}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md active:scale-95"
            title="Skip sponsor ad and proceed immediately"
          >
            <span className="text-[11px] font-extrabold">
              {actionType === 'instant_dispatch' ? 'Skip & Auto-Match ⚡' : 'Skip & Connect ⚡'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Target Action Banner (Why the ad is playing) */}
        <div className="w-full py-1.5 px-3 bg-emerald-500/15 border border-emerald-400/30 rounded-xl flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-bold">
          {actionType === 'instant_dispatch' ? (
            <>
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Instant Dispatch: Auto-Matching via Fair Rotation...</span>
            </>
          ) : (
            <>
              <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Connecting Direct Call {targetWorkerName ? `to ${targetWorkerName}` : ''}...</span>
            </>
          )}
        </div>

        {/* Ad Visual */}
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 rounded-3xl flex items-center justify-center text-4xl shadow-xl relative my-0.5">
          <span className="animate-bounce">{creative.emoji}</span>
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-slate-900 border border-amber-400 rounded-full flex items-center justify-center text-[9px] font-black text-amber-300 shadow-sm">
            Ad
          </div>
        </div>

        {/* Ad Copy */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block">
            {creative.sponsor}
          </span>
          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
            {creative.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {subtitle || creative.description}
          </p>
        </div>

        {/* Special Coupon Promo */}
        <div className="w-full p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-left space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-300 font-bold">
            <span className="text-[11px] text-slate-200">GharKaExpert Sponsor Deal</span>
            <span className="text-emerald-400 font-mono font-black bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {creative.coupon}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">{creative.couponDiscount}</p>
        </div>

        {/* Playback Status & Action Button */}
        <div className="w-full space-y-2 pt-1">
          <div className="text-[11px] text-amber-300/90 font-semibold flex items-center justify-center gap-1.5">
            {isFinishing || countdown === 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ad complete! Proceeding to connection...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                Ad playing first • Connecting in <strong className="text-white font-mono">{countdown}s</strong>
              </span>
            )}
          </div>

          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            {isFinishing ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Connecting Now...</span>
              </>
            ) : (
              <>
                <span>
                  {actionType === 'instant_dispatch'
                    ? (countdown <= 1 ? 'Proceed to Auto-Match ⚡' : 'Skip Ad & Auto-Match Now ⚡')
                    : (countdown <= 1 ? 'Proceed to Connection ⚡' : 'Skip & Connect Now ⚡')}
                </span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
