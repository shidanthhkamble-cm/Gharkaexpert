import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Check, 
  X, 
  Zap, 
  ShieldCheck, 
  PhoneCall, 
  Sparkles, 
  Clock, 
  Lock,
  ArrowRight,
  Shield,
  Star
} from 'lucide-react';
import { VipPlanTier, VipSubscriptionState } from '../types';

interface VipPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (tier: VipPlanTier) => void;
  onProceedToCheckout?: (tier: VipPlanTier) => void;
  currentSubscription?: VipSubscriptionState;
  reason?: 'ad_skipped' | 'direct_call' | 'header_badge' | 'general';
}

export const VipPaywallModal: React.FC<VipPaywallModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  onProceedToCheckout,
  currentSubscription,
  reason = 'general',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<VipPlanTier>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPurchase = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout(selectedPlan);
    } else {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onSubscribe(selectedPlan);
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden flex flex-col space-y-4 my-auto"
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-full transition-colors cursor-pointer z-10"
          title="Close Paywall"
        >
          <X className="w-4 h-4" />
        </button>

        {/* VIP Golden Icon & Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex p-3 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 mx-auto">
            <Crown className="w-7 h-7 stroke-[2.3]" />
          </div>
          
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">
              GharKaExpert VIP Club
            </span>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            Upgrade to VIP
          </h3>

          <p className="text-xs text-amber-200/90 font-medium leading-relaxed px-1">
            Remove all full-screen pop-up ads & call directly without waiting!
          </p>
        </div>

        {/* Benefits Comparison Grid */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-3 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs">Zero Full-Screen Interstitial Ads</p>
              <p className="text-[10px] text-slate-400">Strictly blocks all video & pop-up ads when revealing numbers or making calls.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs">Instant 1-Tap Direct Calling</p>
              <p className="text-[10px] text-slate-400">Bypass 3-second countdown delays and connect immediately to Karigars.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs">Clean, Non-Intrusive Workflow</p>
              <p className="text-[10px] text-slate-400">Keeps only a tiny non-intrusive bottom banner while fully silencing interruptions.</p>
            </div>
          </div>
        </div>

        {/* 2-Tier VIP Pricing Selection (Strictly ₹99/mo & ₹999/yr, No Lifetime) */}
        <div className="space-y-2.5">
          {/* Plan 1: Yearly Plan (Highlighted Best Value) */}
          <div
            onClick={() => setSelectedPlan('yearly')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedPlan === 'yearly'
                ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Best Value • Save ₹189
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'yearly' ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                }`}>
                  {selectedPlan === 'yearly' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Yearly VIP Plan</h4>
                  <p className="text-[10px] text-amber-300/90 font-semibold">12 Full Months Unlimited Access</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-amber-300 leading-tight">₹999</div>
                <div className="text-[9px] text-slate-400">/ Year (₹83/mo)</div>
              </div>
            </div>
          </div>

          {/* Plan 2: Monthly Plan */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedPlan === 'monthly'
                ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'monthly' ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                }`}>
                  {selectedPlan === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Monthly VIP Plan</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Billed monthly • Cancel anytime</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white leading-tight">₹99</div>
                <div className="text-[9px] text-slate-400">/ Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA Upgrade Button */}
        <button
          type="button"
          onClick={handleConfirmPurchase}
          disabled={isProcessing}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Activating VIP Access...</span>
            </>
          ) : (
            <>
              <Crown className="w-4 h-4" />
              <span>
                {selectedPlan === 'yearly' ? 'Upgrade to Yearly VIP • ₹999' : 'Upgrade to Monthly VIP • ₹99'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Bottom Free Option */}
        <div className="pt-0.5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-semibold transition-colors cursor-pointer"
          >
            Continue Free with Full Ads
          </button>
        </div>

        {/* Secure Guarantee Tag */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Secure Payment • Instant Activation • Razorpay/UPI/Cards</span>
        </div>
      </motion.div>
    </div>
  );
};
