import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  RotateCcw, 
  ShieldCheck, 
  Star, 
  History, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  UserX
} from 'lucide-react';
import { UserAccountDocument } from '../types';

interface SoftDeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    phone: string;
    photoUrl: string;
    role: string;
    rating?: number;
    reviewsCount?: number;
    completedJobs?: number;
  };
  onConfirmSoftDelete: () => Promise<void>;
}

export const SoftDeleteAccountModal: React.FC<SoftDeleteAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfirmSoftDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmStep, setConfirmStep] = useState<'info' | 'final_confirm'>('info');

  if (!isOpen) return null;

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmSoftDelete();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="w-full max-w-sm bg-white border border-rose-200 rounded-3xl text-slate-800 shadow-2xl relative overflow-hidden flex flex-col my-auto"
      >
        {/* Top Header */}
        <div className="bg-rose-50 p-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-950">Soft Delete Account</h3>
              <p className="text-[11px] text-rose-700 font-semibold">
                Temporary Deactivation with Instant Restoration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-rose-100/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* User Profile Summary */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <img
              src={currentUser.photoUrl}
              alt={currentUser.name}
              className="w-11 h-11 rounded-xl object-cover border border-slate-300"
            />
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-900 text-xs truncate">{currentUser.name}</h4>
              <p className="text-[11px] text-slate-600 font-mono">{currentUser.phone}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {currentUser.rating || 4.9} ({currentUser.reviewsCount || 84} reviews)
                </span>
                <span>•</span>
                <span className="capitalize font-semibold">{currentUser.role}</span>
              </div>
            </div>
          </div>

          {/* Key Soft-Delete Architecture Guarantees */}
          <div className="space-y-2">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-emerald-950 text-xs">Your Ratings & History Are Preserved</p>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Unlike permanent hard deletion, Firestore preserves your reviews, completed jobs, and earnings history securely.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-blue-950 text-xs">Smart Account Restoration & Device Matching</p>
                <p className="text-[11px] text-blue-800 leading-snug">
                  Log in from your recognized device to instantly restore all ratings & reviews. If on a new phone, verify with your name. Accounts inactive over 60 days are archived for telecom SIM recycling safety.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-950 text-xs">What Happens Next:</p>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Your profile is paused from customer searches and you are safely signed out. You can return anytime!
                </p>
              </div>
            </div>
          </div>

          {confirmStep === 'final_confirm' && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-center space-y-1">
              <p className="font-black text-rose-900 text-xs">Final Confirmation Required</p>
              <p className="text-[11px] text-rose-700">
                Are you sure you want to soft delete your account and sign out now?
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          {confirmStep === 'info' ? (
            <button
              type="button"
              onClick={() => setConfirmStep('final_confirm')}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Proceed to Soft Delete Account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecuteDelete}
              disabled={isDeleting}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl text-xs transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Soft Deleting & Signing Out...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Soft-Delete & Sign Out</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 transition-colors cursor-pointer"
          >
            Keep My Account Active
          </button>
        </div>
      </motion.div>
    </div>
  );
};
