import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Gavel, Scale } from 'lucide-react';
import { Language } from '../types';
import { t } from '../data/translations';

interface SafetyWarningModalProps {
  currentLanguage: Language;
  onAccept: () => void;
}

export const SafetyWarningModal: React.FC<SafetyWarningModalProps> = ({
  currentLanguage,
  onAccept,
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white border border-red-200 rounded-xl shadow-xl overflow-hidden text-slate-800 flex flex-col"
      >
        {/* Warning Header */}
        <div className="bg-red-600 p-4 text-white flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 shrink-0">
            <AlertTriangle className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight leading-tight">
              {t('safetyWarningTitle', currentLanguage)}
            </h3>
            <p className="text-xs text-red-100 font-normal mt-0.5">
              Government Regulated & Safety Verified System
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Strict Zero-Tolerance Policy:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              "{t('safetyWarningText', currentLanguage)}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <Gavel className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="text-slate-700 font-semibold">Immediate Permanent Ban</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <Scale className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-slate-700 font-semibold">Police & Legal Action</span>
            </div>
          </div>

          {/* Mandatory Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 bg-white cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-sm text-slate-800 font-semibold leading-tight">
              {t('agreeTermsCheckbox', currentLanguage)}
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
          <button
            disabled={!agreed}
            onClick={onAccept}
            className={`w-full py-3.5 px-5 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              agreed
                ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('acceptAndProceedBtn', currentLanguage)}</span>
          </button>
          {!agreed && (
            <p className="text-[11px] text-center text-slate-500 font-medium">
              ⚠️ Please check the box above to accept and proceed.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
