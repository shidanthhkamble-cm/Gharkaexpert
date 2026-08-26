import React from 'react';
import { motion } from 'motion/react';
import { 
  BadgeCheck, 
  Star, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldAlert, 
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
            <div className="flex items-center gap-1">
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {worker.name}
              </h4>
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
              Photos:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {worker.portfolio.slice(0, 3).map((item) => (
                <img
                  key={item.id}
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                  onClick={() => onSelectWorker(worker)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pricing & Action Buttons */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
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

        <div className="flex items-center gap-1.5 shrink-0">
          {onChatClick && (
            <button
              onClick={() => onChatClick(worker)}
              className="py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all active:scale-95"
              title="In-App Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          )}

          <button
            onClick={() => onCallClick(worker)}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-all active:scale-95"
            title="Call Direct"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectWorker(worker)}
            className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <span>Hire</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
