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
    <div className="min-h-[580px] w-full bg-slate-50 text-slate-800 p-5 flex flex-col justify-between rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div>
        <div className="text-center space-y-1 mb-6">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5" /> Dual-Mode Architecture
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('roleTitle', currentLanguage)}
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Select how you wish to use GharKaExpert today (You can switch anytime)
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4">
          {/* CUSTOMER CARD */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole('customer')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              currentRole === 'customer'
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
                <Home className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    {t('roleCustomer', currentLanguage)}
                  </h3>
                  {currentRole === 'customer' && (
                    <span className="p-1 bg-blue-600 text-white rounded-full">
                      <CheckCircle className="w-4 h-4 fill-blue-600 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {t('roleCustomerDesc', currentLanguage)}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-blue-700 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Direct Call & WhatsApp • Zero Brokerage
                </div>
              </div>
            </div>
          </motion.div>

          {/* WORKER / CONTRACTOR CARD */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectRole('worker')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              currentRole === 'worker'
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-slate-900 text-blue-400 rounded-xl shadow-sm shrink-0">
                <HardHat className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    {t('roleWorker', currentLanguage)}
                  </h3>
                  {currentRole === 'worker' && (
                    <span className="p-1 bg-blue-600 text-white rounded-full">
                      <CheckCircle className="w-4 h-4 fill-blue-600 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {t('roleWorkerDesc', currentLanguage)}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-blue-700 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Upload Portfolio • Sub-Contracting Pass Work
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Proceed Button */}
      <div className="pt-4 border-t border-slate-200 mt-4">
        <button
          onClick={onProceed}
          className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          <span>Enter GharKaExpert App 🚀</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
