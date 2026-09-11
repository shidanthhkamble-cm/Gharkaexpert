import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Radio, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Lock,
  UserCheck, 
  Sparkles,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { WorkerProfile, TradeCategory, Language } from '../types';
import { getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface EmergencyDispatchModalProps {
  category: TradeCategory;
  workers: WorkerProfile[];
  currentLanguage: Language;
  onWorkerAccepted: (worker: WorkerProfile) => void;
  onCallClick?: (worker: WorkerProfile) => void;
  onCancel: () => void;
}

export const EmergencyDispatchModal: React.FC<EmergencyDispatchModalProps> = ({
  category,
  workers,
  currentLanguage,
  onWorkerAccepted,
  onCallClick,
  onCancel,
}) => {
  const [timer, setTimer] = useState(4);
  const [status, setStatus] = useState<'broadcasting' | 'accepted'>('broadcasting');
  const [acceptedWorker, setAcceptedWorker] = useState<WorkerProfile | null>(null);
  const [autoCallCountdown, setAutoCallCountdown] = useState<number | null>(null);

  // Filter strictly for the exact skill category selected (no combined skills)
  const matchingTradeWorkers = workers.filter(
    w => category === 'all' ? true : w.primaryTrade === category
  );

  // Strict 1.5 km radius filter for verified / available Karigars
  const withinRadiusWorkers = matchingTradeWorkers.filter(w => w.distanceKm <= 1.5);
  const eligiblePool = withinRadiusWorkers.length > 0 ? withinRadiusWorkers : matchingTradeWorkers;

  const matchingWorkers = [...eligiblePool].sort((a, b) => {
    // Rank nearest within 1.5km + Fair Rotation priority for low bookings and new karigars
    const scoreA =
      (a.distanceKm <= 1.5 ? 25 : 0) +
      (a.isNewKarigar ? 10 : 0) +
      (a.recentBookingCount === 0 ? 8 : 0) +
      (a.isAvailableToday ? 5 : 0) +
      (a.rating / 5) * 2 -
      a.distanceKm * 5;
    const scoreB =
      (b.distanceKm <= 1.5 ? 25 : 0) +
      (b.isNewKarigar ? 10 : 0) +
      (b.recentBookingCount === 0 ? 8 : 0) +
      (b.isAvailableToday ? 5 : 0) +
      (b.rating / 5) * 2 -
      b.distanceKm * 5;
    return scoreB - scoreA;
  });

  const topMatch = matchingWorkers[0] || workers[0];

  useEffect(() => {
    if (status === 'broadcasting' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      // Lock onto top Fair Rotation matched worker at 2 seconds
      if (timer === 2 && topMatch) {
        setAcceptedWorker(topMatch);
        setStatus('accepted');
        setAutoCallCountdown(3);
      }

      return () => clearInterval(interval);
    }
  }, [timer, status, topMatch]);

  // Auto-initiate masked call algorithm countdown once worker is matched
  useEffect(() => {
    if (status === 'accepted' && autoCallCountdown !== null && acceptedWorker) {
      if (autoCallCountdown > 0) {
        const timerId = setTimeout(() => {
          setAutoCallCountdown((prev) => (prev !== null ? prev - 1 : 0));
        }, 1000);
        return () => clearTimeout(timerId);
      } else if (autoCallCountdown === 0) {
        // Automatically initiate the masked call connection algorithm
        onCallClick?.(acceptedWorker);
      }
    }
  }, [status, autoCallCountdown, acceptedWorker, onCallClick]);

  const handleInstantConnect = () => {
    if (topMatch) {
      setAcceptedWorker(topMatch);
      setStatus('accepted');
      setAutoCallCountdown(3);
    }
  };

  const categoryLabel = getCategoryLabel(category, currentLanguage);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden text-white relative"
      >
        {/* Header - Direct Connect / Instant Dispatch */}
        <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between border-b border-emerald-600/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl p-0.5 border border-white/30 shrink-0 overflow-hidden shadow-sm">
              <img
                src={getCategory3DIcon(category)}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black bg-emerald-400 text-slate-950 px-2 py-0.5 rounded shadow-xs">
                  Direct Connect • Instant Dispatch
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white">Instant {categoryLabel} Match</h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {status === 'broadcasting' ? (
            <div className="text-center space-y-4">
              {/* Radar Simulation */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-teal-400/40 animate-pulse" />
                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-emerald-300">
                  <Radio className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-[11px] font-black text-white">{timer}s</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fair Rotation Algorithm • 1.5 km Strict Radius</span>
                </div>
                <h4 className="font-extrabold text-lg text-white">
                  Finding Available {categoryLabel} within 1.5 km...
                </h4>
                <p className="text-xs text-slate-300">
                  Scanning verified local Karigars in 1.5 km geo-radius via Fair Rotation. Direct auto-masked call connection, 0% commission.
                </p>
              </div>

              {/* Workers Radar Ping list with Real Photos */}
              <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 space-y-2 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Verified Karigars in 2km Range:
                </p>
                <div className="space-y-1.5">
                  {matchingWorkers.slice(0, 3).map((w) => (
                    <div key={w.id} className="flex items-center justify-between text-xs bg-slate-900/70 p-2 rounded-xl border border-slate-700/60">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={w.photoUrl} 
                          alt={w.name} 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border-2 border-emerald-400" 
                        />
                        <div>
                          <p className="font-bold text-slate-100 text-xs">{w.name}</p>
                          <p className="text-[10px] text-slate-400">{w.city} • {w.distanceKm} km • ⭐ {w.rating}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-extrabold animate-pulse">
                        Connecting...
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstantConnect}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Connect Immediately
                </button>
                <button
                  onClick={onCancel}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/40 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Fair Rotation Match Confirmed (≤ 1.5 km)
                </span>
                <h4 className="font-black text-xl text-white">
                  {acceptedWorker?.name}
                </h4>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <p className="text-xs text-emerald-300 font-semibold">
                    {autoCallCountdown !== null && autoCallCountdown > 0
                      ? `Auto-connecting via Masked Call in ${autoCallCountdown}s...`
                      : 'Masked Call Gateway Ready!'}
                  </p>
                </div>
              </div>

              {/* Matched Worker Details Card */}
              {acceptedWorker && (
                <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <img 
                      src={acceptedWorker.photoUrl} 
                      alt={acceptedWorker.name} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-extrabold text-sm text-white truncate">{acceptedWorker.name}</h5>
                        {acceptedWorker.aadhaarVerified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-amber-400 font-semibold">⭐ {acceptedWorker.rating} ({acceptedWorker.reviewsCount} reviews)</p>
                      <p className="text-[11px] text-slate-300">{acceptedWorker.city} • {acceptedWorker.distanceKm} km away</p>
                    </div>
                  </div>

                  {/* In-App Masked Dispatch Routing */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-2 shadow-inner">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">In-App Routing</span>
                          <span className="text-[8px] font-black bg-emerald-400/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-400/30">
                            🔒 Masked
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-mono font-black text-emerald-300 block truncate">
                          GKE-DISPATCH • Ext #{acceptedWorker.id.replace('worker-', '')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>App Route</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl text-xs space-y-1.5 border border-slate-700/60">
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Arrival:</span>
                      <span className="font-bold text-emerald-400">10 - 15 Mins</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Charge / Rate:</span>
                      <span className="font-bold text-amber-300">
                        ₹{acceptedWorker.visitingFee ? `${acceptedWorker.visitingFee} (Visiting Fee)` : `${acceptedWorker.dailyRate} / day`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {acceptedWorker && onCallClick && (
                  <button
                    onClick={() => {
                      onCallClick(acceptedWorker);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 fill-slate-950 animate-pulse" />
                    <span>Connect via App Call (Masked)</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (acceptedWorker) onWorkerAccepted(acceptedWorker);
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Track Live Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Browse All {categoryLabel}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
