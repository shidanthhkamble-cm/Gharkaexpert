import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  X, 
  ShieldCheck, 
  Navigation, 
  Sparkles,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { DirectBooking, WorkerProfile, Language } from '../types';
import { getCategoryLabel } from '../data/translations';

interface JobTrackerModalProps {
  booking: DirectBooking;
  worker: WorkerProfile;
  currentLanguage: Language;
  onOpenChat: (workerId: string) => void;
  onCallClick: (worker: WorkerProfile) => void;
  onOpenQuoteModal?: () => void;
  onUpdateStatus?: (newStatus: DirectBooking['status']) => void;
  onClose: () => void;
}

const STATUS_STEPS: { id: DirectBooking['status']; label: string; icon: string }[] = [
  { id: 'searching', label: 'Searching', icon: '🔍' },
  { id: 'accepted', label: 'Accepted', icon: '✅' },
  { id: 'in_transit', label: 'In Transit', icon: '🛵' },
  { id: 'work_started', label: 'Work Started', icon: '🛠️' },
  { id: 'completed', label: 'Completed', icon: '🎉' },
];

export const JobTrackerModal: React.FC<JobTrackerModalProps> = ({
  booking,
  worker,
  currentLanguage,
  onOpenChat,
  onCallClick,
  onOpenQuoteModal,
  onUpdateStatus,
  onClose,
}) => {
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === booking.status);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 1;

  const tradeLabel = getCategoryLabel(booking.trade, currentLanguage);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Real-time Job Tracker</h3>
              <p className="text-xs text-emerald-300">Live Status & ETA updates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Worker Header Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={worker.photoUrl} alt={worker.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{worker.name}</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Verified</span>
                </div>
                <p className="text-xs text-blue-700 font-semibold">{tradeLabel}</p>
                <p className="text-[10px] text-slate-500">{worker.city} • {worker.distanceKm} km away</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onCallClick(worker)}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all"
                title="Masked Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenChat(worker.id)}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all"
                title="In-App Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Workflow Progress Bar */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-300">Status Workflow</span>
              <span className="font-black text-emerald-400 uppercase tracking-wider text-[11px]">
                {STATUS_STEPS[activeStep]?.label}
              </span>
            </div>

            {/* Stepper Dots */}
            <div className="grid grid-cols-5 gap-1 text-center py-2 relative">
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx <= activeStep;
                const isCurrent = idx === activeStep;

                return (
                  <div key={step.id} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 font-black scale-110 shadow-lg'
                          : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span className={`text-[9px] font-bold ${isDone ? 'text-emerald-300' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ETA / Arrival notice */}
            <div className="p-2.5 bg-slate-800/90 rounded-xl text-xs flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Estimated Arrival:
              </span>
              <span className="font-extrabold text-amber-300">12 - 15 Mins</span>
            </div>
          </div>

          {/* Post-Inspection Quote Card (if Mechanic / Appliance or exists) */}
          {booking.quote ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-amber-600" /> Mechanic Post-Inspection Quote
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  booking.quote.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {booking.quote.status}
                </span>
              </div>
              <p className="text-xl font-black text-slate-900">₹{booking.quote.totalAmount}</p>
              <p className="text-xs text-slate-600">"{booking.quote.description}"</p>
            </div>
          ) : (
            (worker.pricingType === 'visiting' || worker.primaryTrade.includes('mechanic') || worker.primaryTrade.includes('ac')) && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-blue-900">Post-Inspection Quote System</p>
                  <p className="text-[10px] text-blue-700">Mechanic can send estimate after checking work.</p>
                </div>
                {onOpenQuoteModal && (
                  <button
                    onClick={onOpenQuoteModal}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-xs"
                  >
                    Send / View Quote
                  </button>
                )}
              </div>
            )
          )}

          {/* Advance Workflow Simulation Toggle (For testing status progression) */}
          {onUpdateStatus && (
            <div className="p-3 bg-slate-100 rounded-2xl space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 text-[11px] block">Simulate Status Progression:</span>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => onUpdateStatus(step.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      booking.status === step.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {step.icon} {step.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
