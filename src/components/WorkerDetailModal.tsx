import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  BadgeCheck, 
  Star, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Lock,
  Volume2, 
  CheckCircle2, 
  Calendar,
  Briefcase,
  Languages,
  Award,
  Sparkles,
  Edit,
  DollarSign
} from 'lucide-react';
import { WorkerProfile, Language } from '../types';
import { t, getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface WorkerDetailModalProps {
  worker: WorkerProfile | null;
  currentLanguage: Language;
  onClose: () => void;
  onCallClick: (worker: WorkerProfile) => void;
  onWhatsappClick: (worker: WorkerProfile) => void;
  onBookClick: (worker: WorkerProfile) => void;
  onChatClick?: (worker: WorkerProfile) => void;
  onEditClick?: (worker: WorkerProfile) => void;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  worker,
  currentLanguage,
  onClose,
  onCallClick,
  onWhatsappClick,
  onBookClick,
  onChatClick,
  onEditClick,
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');

  if (!worker) return null;

  const handleVoiceBioPlay = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Karigar ${worker.name}. ${worker.bio}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isMechanicOrAppliance = worker.pricingType === 'visiting' || worker.primaryTrade.includes('mechanic') || worker.primaryTrade.includes('ac') || worker.primaryTrade.includes('appliance');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 my-auto"
      >
        {/* Top Cover Banner */}
        <div className="relative h-28 bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 p-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-950/60 backdrop-blur-md text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-extrabold flex items-center gap-1">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              {worker.aadhaarVerified ? 'Basic Verified • Profile Photo Added' : 'Verified Karigar'}
            </span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-extrabold">
              0% Commission
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEditClick && (
              <button
                onClick={() => onEditClick(worker)}
                className="p-2 text-white bg-blue-600 hover:bg-blue-500 rounded-full transition-colors flex items-center gap-1 text-xs px-3 font-bold"
                title="Edit Rates & Profile"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white bg-slate-950/60 hover:bg-slate-950 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Avatar & Primary Info */}
        <div className="px-5 pb-4 -mt-10 relative">
          <div className="flex items-end justify-between">
            <div className="relative">
              <img
                src={worker.photoUrl}
                alt={worker.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-900 shadow-xl"
              />
              <BadgeCheck className="w-7 h-7 text-emerald-400 bg-slate-900 rounded-full absolute -bottom-1 -right-1 stroke-[2.5]" />
            </div>

            <div className="text-right">
              {isMechanicOrAppliance ? (
                <div>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    ₹{worker.visitingFee || 200}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">
                    City Visiting Fee
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    ₹{worker.dailyRate}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">
                    {t('perDayRate', currentLanguage)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              {worker.name}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="px-2.5 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg font-bold flex items-center gap-1.5 shadow-sm">
                <img
                  src={getCategory3DIcon(worker.primaryTrade)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded object-cover shadow-xs"
                />
                {getCategoryLabel(worker.primaryTrade, currentLanguage)}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{worker.experienceYears} Years Experience</span>
            </div>

            <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {worker.rating} ({worker.reviewsCount} Ratings)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {worker.city} ({worker.distanceKm} km away)
              </span>
            </div>
          </div>

          {/* Karigar Contact In-App Masked Routing Display */}
          <div className="mt-3 p-3 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">In-App Routing</span>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    🔒 Number Masked
                  </span>
                </div>
                <span className="text-sm font-mono font-black text-slate-200 block truncate">
                  GKE-VIRTUAL • Ext #{worker.id.replace('worker-', '')}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Personal number hidden for safety & platform warranty
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCallClick(worker)}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 fill-white" />
              <span>Call via App</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 text-sm font-bold bg-slate-950/40">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'about'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            About & Pricing
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'portfolio'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Work Photos ({worker.portfolio.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 max-h-[320px] overflow-y-auto custom-scrollbar">
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Bio & Voice Button */}
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Karigar Bio</span>
                  <button
                    onClick={handleVoiceBioPlay}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Listen Audio Bio</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {worker.bio}
                </p>
              </div>

              {/* Pricing breakdown card */}
              <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Transparent Pricing Model
                </h4>

                {isMechanicOrAppliance ? (
                  <div className="text-xs space-y-1 text-slate-300">
                    <p className="flex justify-between">
                      <span>Visiting / Inspection Charge:</span>
                      <strong className="text-amber-400">₹{worker.visitingFee || 200}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Post-Inspection Quote:</span>
                      <strong className="text-emerald-400">Sent on-site via App</strong>
                    </p>
                    <p className="text-[10px] text-slate-400 pt-1">
                      No surprise fees. You approve the final estimate before work begins.
                    </p>
                  </div>
                ) : (
                  <div className="text-xs space-y-1 text-slate-300">
                    <p className="flex justify-between">
                      <span>Daily Wage (Dihadi):</span>
                      <strong className="text-blue-400">₹{worker.dailyRate} / day</strong>
                    </p>
                    {worker.sqftRate && (
                      <p className="flex justify-between">
                        <span>Per Sq. Ft Rate:</span>
                        <strong className="text-emerald-400">₹{worker.sqftRate} / sq.ft</strong>
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 pt-1">
                      Direct payment to Karigar. 0% platform commission fee.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-3">
              {worker.portfolio.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No work photos uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {worker.portfolio.map((item) => (
                    <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover" />
                      <div className="p-2 space-y-0.5">
                        <p className="font-bold text-xs text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400">{item.location} • {item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action CTA Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onChatClick && (
              <button
                onClick={() => onChatClick(worker)}
                className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>In-App Chat</span>
              </button>
            )}

            <button
              onClick={() => onBookClick(worker)}
              className="py-2.5 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Book via App</span>
            </button>
          </div>

          <button
            onClick={() => onCallClick(worker)}
            className="flex-1 sm:flex-initial py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shrink-0 cursor-pointer active:scale-95 transition-all"
            title="Call via Secure Masked App Routing"
          >
            <Phone className="w-4 h-4 fill-white animate-pulse" />
            <span>Call via App (Masked)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
