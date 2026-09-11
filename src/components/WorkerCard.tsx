import React from 'react';
import { motion } from 'motion/react';
import { 
  BadgeCheck, 
  Star, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldAlert, 
  ShieldCheck,
  Lock,
  ChevronRight,
  Sparkles,
  Calendar,
  Zap,
  Wrench
} from 'lucide-react';
import { WorkerProfile, Language } from '../types';
import { t, getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface WorkerCardProps {
  worker: WorkerProfile;
  currentLanguage: Language;
  onSelectWorker: (worker: WorkerProfile) => void;
  onCallClick: (worker: WorkerProfile) => void;
  onWhatsappClick: (worker: WorkerProfile) => void;
  onChatClick?: (worker: WorkerProfile) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  currentLanguage,
  onSelectWorker,
  onCallClick,
  onWhatsappClick,
  onChatClick,
}) => {
  const categoryLabel = getCategoryLabel(worker.primaryTrade, currentLanguage);
  const isMechanicOrAppliance = worker.pricingType === 'visiting' || worker.primaryTrade.includes('mechanic') || worker.primaryTrade.includes('ac') || worker.primaryTrade.includes('appliance');

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden text-slate-800"
    >
      {/* Top Badges Bar */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <div className="flex items-center gap-1">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" /> 0% Commission
          </span>

          {worker.isNewKarigar ? (
            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              🌱 Fresh Talent
            </span>
          ) : worker.recentBookingCount === 0 ? (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              ⭐ Priority Local Karigar
            </span>
          ) : null}
        </div>

        {worker.isEmergencyAvailable && (
          <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <ShieldAlert className="w-3 h-3 text-orange-100" /> 24x7 Emergency
          </span>
        )}
      </div>

      <div>
        {/* Main Info Header */}
        <div className="flex items-start gap-3">
          {/* Avatar with Verified Badge */}
          <div className="relative shrink-0">
            <img
              src={worker.photoUrl}
              alt={worker.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs"
            />
            {worker.aadhaarVerified && (
              <BadgeCheck className="w-5 h-5 text-emerald-600 bg-white rounded-full absolute -bottom-1 -right-1 stroke-[2.5]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {worker.name}
              </h4>
              {worker.aadhaarVerified && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0" title="Identity Verified & Profile Photo Added">
                  <BadgeCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Basic Verified</span>
                </span>
              )}
              {worker.isFlaggedInAdmin && (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 border border-rose-300" title={`Flagged in Admin: ${worker.flagReason || 'Quality review'}`}>
                  <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Under Review</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold flex items-center gap-1">
                <img
                  src={getCategory3DIcon(worker.primaryTrade)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded object-cover shadow-2xs"
                />
                {categoryLabel}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {worker.experienceYears} yrs exp
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{worker.rating}</span>
                <span className="text-slate-400 text-[11px]">({worker.reviewsCount})</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-600 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{worker.city} ({worker.distanceKm} km)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Preview */}
        <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed font-normal">
          {worker.bio}
        </p>

        {/* Portfolio Preview */}
        {worker.portfolio && worker.portfolio.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
              Work Photos:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {worker.portfolio.slice(0, 3).map((item) => (
                <img
                  key={item.id}
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                  onClick={() => onSelectWorker(worker)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pricing Row & View Profile Button */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="min-w-0">
            {isMechanicOrAppliance ? (
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-tight">Visiting Charge</span>
                <span className="text-base sm:text-lg font-black text-amber-600">
                  ₹{worker.visitingFee || 200}
                  <span className="text-[10px] text-slate-500 font-medium"> / Inspection</span>
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-tight">Daily Rate (Dihadi)</span>
                <span className="text-base sm:text-lg font-black text-blue-700">
                  ₹{worker.dailyRate}
                  <span className="text-[10px] text-slate-500 font-medium"> / day</span>
                </span>
                {worker.sqftRate && (
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    ₹{worker.sqftRate}/sq.ft rate
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectWorker(worker)}
            className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 cursor-pointer group bg-blue-50/80 hover:bg-blue-100/70 px-2.5 py-1.5 rounded-lg border border-blue-200/60 transition-all"
            title="View complete worker profile and work history"
          >
            <span>Full Profile</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-blue-600" />
          </button>
        </div>
      </div>

      {/* DISTINCT SECTION: Secure In-App Communication Options */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/80 -mx-3.5 -mb-3.5 sm:-mx-4 sm:-mb-4 p-3 sm:p-3.5 bg-slate-50/90 rounded-b-2xl space-y-2">
        {/* Security / Anti-Bypass Header */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-700 truncate">
              Secure Gateway • <span className="font-mono text-slate-900 font-extrabold">Ext #{worker.id.replace('worker-', '')}</span>
            </span>
          </div>
          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
            <Lock className="w-2.5 h-2.5" /> Masked Call
          </span>
        </div>

        {/* Two Clearly Separated Connection Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onCallClick(worker)}
            className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-[13px] shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title={`Call ${worker.name} via Secure Masked App Routing`}
          >
            <Phone className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>Call via App (Masked)</span>
          </button>

          <button
            type="button"
            onClick={() => (onChatClick ? onChatClick(worker) : onSelectWorker(worker))}
            className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs sm:text-[13px] shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title={`In-App Chat and Book with ${worker.name}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-white shrink-0" />
            <span>In-App Chat / Book</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
