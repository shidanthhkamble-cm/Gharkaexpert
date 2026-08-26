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
  onCancel: () => void;
}

export const EmergencyDispatchModal: React.FC<EmergencyDispatchModalProps> = ({
  category,
  workers,
  currentLanguage,
  onWorkerAccepted,
  onCancel,
}) => {
  const [timer, setTimer] = useState(30);
  const [status, setStatus] = useState<'broadcasting' | 'accepted'>('broadcasting');
  const [acceptedWorker, setAcceptedWorker] = useState<WorkerProfile | null>(null);

  // Filter 3-5 nearest available workers for this trade
  const matchingWorkers = workers
    .filter(w => w.primaryTrade === category || w.additionalTrades?.includes(category) || category === 'mason')
    .slice(0, 4);

  useEffect(() => {
    if (status === 'broadcasting' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      // Simulate worker acceptance at 22 seconds
      if (timer === 22 && matchingWorkers.length > 0) {
        const winner = matchingWorkers[0];
        setAcceptedWorker(winner);
        setStatus('accepted');
      }

      return () => clearInterval(interval);
    }
  }, [timer, status, matchingWorkers]);

  const categoryLabel = getCategoryLabel(category, currentLanguage);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border-2 border-red-500/60 rounded-3xl shadow-2xl overflow-hidden text-white relative"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
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
                <span className="text-xs uppercase font-black bg-black/30 px-2 py-0.5 rounded text-yellow-300">
                  Uber-Style Instant Dispatch
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white">Emergency {categoryLabel}</h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {status === 'broadcasting' ? (
            <div className="text-center space-y-4">
              {/* Radar Simulation */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-red-400/40 animate-pulse" />
                <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-yellow-500 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-yellow-300">
                  <Radio className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-[10px] font-black text-white">{timer}s</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-lg text-yellow-300">
                  Alerting {matchingWorkers.length || 4} Nearest Karigars...
                </h4>
                <p className="text-xs text-slate-300">
                  Notifying verified local Karigars within 5km radius. First to accept gets assigned immediately!
                </p>
              </div>

              {/* Workers Radar Ping list */}
              <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 space-y-2 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400" /> Nearby Karigars Receiving Signal:
                </p>
                <div className="space-y-1.5">
                  {matchingWorkers.map((w, i) => (
                    <div key={w.id} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <img src={w.photoUrl} alt={w.name} className="w-7 h-7 rounded-full object-cover border border-amber-400" />
                        <div>
                          <p className="font-bold text-slate-200 text-[11px]">{w.name}</p>
                          <p className="text-[9px] text-slate-400">{w.distanceKm} km away • ⭐ {w.rating}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-yellow-400 font-extrabold animate-pulse">
                        Pinging...
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onCancel}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel Dispatch Request
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Karigar Accepted Request!
                </span>
                <h4 className="font-black text-xl text-white">
                  {acceptedWorker?.name}
                </h4>
                <p className="text-xs text-emerald-300">
                  Accepted in 8 seconds! On the way to your location.
                </p>
              </div>

              {/* Worker Card details */}
              {acceptedWorker && (
                <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <img src={acceptedWorker.photoUrl} alt={acceptedWorker.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400" />
                    <div>
                      <h5 className="font-bold text-sm text-white">{acceptedWorker.name}</h5>
                      <p className="text-xs text-yellow-400 font-semibold">⭐ {acceptedWorker.rating} ({acceptedWorker.reviewsCount} reviews)</p>
                      <p className="text-[11px] text-slate-300">{acceptedWorker.city} • {acceptedWorker.distanceKm} km away</p>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Arrival:</span>
                      <span className="font-bold text-emerald-400">12 - 15 Mins</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Visiting Fee / Rate:</span>
                      <span className="font-bold text-amber-300">₹{acceptedWorker.visitingFee || acceptedWorker.dailyRate}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (acceptedWorker) onWorkerAccepted(acceptedWorker);
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Track Karigar Live Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
