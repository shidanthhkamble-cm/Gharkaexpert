import React from 'react';
import { motion } from 'motion/react';
import { Home, HardHat, CheckCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRole, Language } from '../types';
import { t } from '../data/translations';

interface RoleSelectorProps {
  currentRole: UserRole;
  currentLanguage: Language;
  onSelectRole: (role: UserRole) => void;
  onProceed: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  currentLanguage,
  onSelectRole,
  onProceed,
}) => {
  return (
    <div className="min-h-dvh flex-1 w-full bg-[#1E3A8A] text-white px-4 py-5 sm:px-6 sm:py-6 flex flex-col justify-between">
      <div className="w-full space-y-5">
        <div className="space-y-1 pt-1">
          <p className="text-xs text-blue-200 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Dual-Mode Account</span>
          </p>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {t('roleTitle', currentLanguage)}
          </h2>
          <p className="text-xs text-blue-100 font-normal">
            Select how you wish to use GharKaExpert today (you can switch anytime)
          </p>
        </div>

        <div className="w-full bg-white text-slate-900 rounded-3xl p-5 shadow-xl space-y-4">
          {/* CUSTOMER CARD */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole('customer')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              currentRole === 'customer'
                ? 'bg-blue-50/80 border-[#1E3A8A]'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-[#1E3A8A] text-white rounded-xl shadow-2xs shrink-0">
                <Home className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    {t('roleCustomer', currentLanguage)}
                  </h3>
                  {currentRole === 'customer' && (
                    <span className="p-0.5 bg-[#1E3A8A] text-white rounded-full">
                      <CheckCircle className="w-4 h-4 fill-[#1E3A8A] text-white" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {t('roleCustomerDesc', currentLanguage)}
                </p>
                <div className="pt-1 text-[11px] text-[#1E3A8A] font-semibold">
                  Direct Call &amp; WhatsApp · Zero Brokerage
                </div>
              </div>
            </div>
          </motion.div>

          {/* WORKER / CONTRACTOR CARD */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole('worker')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              currentRole === 'worker'
                ? 'bg-amber-50/80 border-amber-500'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-2xs shrink-0">
                <HardHat className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    {t('roleWorker', currentLanguage)}
                  </h3>
                  {currentRole === 'worker' && (
                    <span className="p-0.5 bg-amber-500 text-slate-950 rounded-full">
                      <CheckCircle className="w-4 h-4 fill-amber-500 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {t('roleWorkerDesc', currentLanguage)}
                </p>
                <div className="pt-1 text-[11px] text-amber-800 font-semibold">
                  Upload Portfolio · Sub-Contracting Pass Work
                </div>
              </div>
            </div>
          </motion.div>

          <button
            onClick={onProceed}
            className="w-full min-h-[48px] py-3.5 px-5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>Enter GharKaExpert App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-4 pb-1 text-center text-[11px] text-blue-200/90">
        GharKaExpert · Direct Local Karigar Network
      </div>
    </div>
  );
};
