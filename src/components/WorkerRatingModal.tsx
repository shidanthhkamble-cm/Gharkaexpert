import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  ThumbsUp, 
  Sparkles,
  X,
  BadgeAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WorkerProfile, DirectBooking, WorkerReview, Language } from '../types';

interface WorkerRatingModalProps {
  booking: DirectBooking;
  worker: WorkerProfile;
  currentLanguage: Language;
  onSubmitReview?: (review: {
    stars: number;
    tags: string[];
    comment: string;
    isFlagged: boolean;
    flagReason?: string;
  }) => void;
  onSubmit?: (review: {
    stars: number;
    tags: string[];
    comment: string;
    isFlagged: boolean;
    flagReason?: string;
  }) => void;
  onClose: () => void;
}

const POSITIVE_TAGS = [
  'Professional & Polite',
  'Arrived on Time',
  'High Quality Work',
  'Fair & Honest Rates',
  'Left Site Clean',
  'Helpful Guidance'
];

const CRITICAL_TAGS = [
  'Unprofessional Behavior',
  'Safety Concerns',
  'Delayed Arrival',
  'Overcharged Extra',
  'Incomplete Work'
];

const STAR_LABELS: Record<number, { title: string; subtitle: string; color: string }> = {
  5: { title: 'Exceptional Work!', subtitle: 'Courteous, skilled, and highly recommended', color: 'text-amber-400' },
  4: { title: 'Very Good Experience', subtitle: 'Punctual, polite, and finished smoothly', color: 'text-amber-400' },
  3: { title: 'Average Service', subtitle: 'Work was done, but room for improvement', color: 'text-amber-500' },
  2: { title: 'Needs Improvement', subtitle: 'Issues with behavior, timeliness, or quality', color: 'text-orange-500' },
  1: { title: 'Poor / Unsatisfactory', subtitle: 'Unacceptable behavior or safety concerns', color: 'text-rose-500' },
};

export const WorkerRatingModal: React.FC<WorkerRatingModalProps> = ({
  booking,
  worker,
  currentLanguage,
  onSubmitReview,
  onSubmit,
  onClose,
}) => {
  const [stars, setStars] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Professional & Polite', 'Arrived on Time']);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const effectiveStars = hoveredStar ?? stars;
  const isNegativeScore = effectiveStars <= 2;
  const hasUnprofessionalFlag = selectedTags.includes('Unprofessional Behavior') || selectedTags.includes('Safety Concerns');
  const willTriggerAdminFlag = isNegativeScore || hasUnprofessionalFlag;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars >= 4) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    let flagReason: string | undefined = undefined;
    if (willTriggerAdminFlag) {
      const reasons: string[] = [];
      if (isNegativeScore) reasons.push(`Low Rating (${stars}/5 stars)`);
      if (selectedTags.includes('Unprofessional Behavior')) reasons.push('Reported Unprofessional Behavior');
      if (selectedTags.includes('Safety Concerns')) reasons.push('Reported Safety Concerns');
      flagReason = reasons.join(' • ');
    }

    setIsSubmitted(true);
    setTimeout(() => {
      const submitHandler = onSubmitReview || onSubmit;
      if (submitHandler) {
        submitHandler({
          stars,
          tags: selectedTags,
          comment: comment.trim(),
          isFlagged: willTriggerAdminFlag,
          flagReason
        });
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 my-auto"
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Star className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Performance & Behavior Review</h3>
              <p className="text-[10px] text-amber-300 font-medium">GharKaExpert Safety & Quality Assurance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h4 className="text-lg font-extrabold text-slate-900">Review Submitted Successfully</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Thank you for helping keep the GharKaExpert network safe, professional, and reliable.
            </p>
            {willTriggerAdminFlag && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-bold flex items-center gap-2 text-left mt-2">
                <BadgeAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Worker profile has been flagged for Admin System investigation. Rating score updated.</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Worker Snapshot */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
              <img
                src={worker.photoUrl}
                alt={worker.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-0.5">
                  Job Completed
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 truncate">{worker.name}</h4>
                <p className="text-xs text-slate-500 capitalize">{booking.trade.replace('_', ' ')} • Doorstep Service</p>
              </div>
            </div>

            {/* Star Rating Section */}
            <div className="text-center py-2 bg-gradient-to-b from-amber-500/5 to-transparent rounded-2xl p-3 border border-amber-200/50">
              <p className="text-xs font-bold text-slate-600 mb-2">
                How would you rate {worker.name}'s service & conduct?
              </p>

              {/* 5 Big Interactive Stars */}
              <div className="flex justify-center items-center gap-2 sm:gap-3 py-1">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isFilled = starIndex <= effectiveStars;
                  return (
                    <button
                      key={starIndex}
                      type="button"
                      onMouseEnter={() => setHoveredStar(starIndex)}
                      onMouseLeave={() => setHoveredStar(null)}
                      onClick={() => {
                        setStars(starIndex);
                        // Auto-adjust tags suggestion
                        if (starIndex <= 2) {
                          setSelectedTags(prev => prev.filter(t => !POSITIVE_TAGS.includes(t)));
                        } else if (starIndex >= 4) {
                          setSelectedTags(prev => prev.filter(t => !CRITICAL_TAGS.includes(t)));
                        }
                      }}
                      className="p-1 sm:p-1.5 focus:outline-none transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                      title={`${starIndex} Star`}
                    >
                      <Star
                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300 stroke-[1.5]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Star descriptive label */}
              <div className="mt-2 min-h-[38px] flex flex-col items-center justify-center">
                <span className={`text-sm font-extrabold ${STAR_LABELS[effectiveStars]?.color || 'text-slate-800'}`}>
                  {STAR_LABELS[effectiveStars]?.title}
                </span>
                <span className="text-[11px] text-slate-500">
                  {STAR_LABELS[effectiveStars]?.subtitle}
                </span>
              </div>
            </div>

            {/* Quick Feedback Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700">
                Performance & Behavior Tags (Select all that apply):
              </label>

              {/* Positive Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Positive Highlights:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POSITIVE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Critical / Safety Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                  Issues & Behavior Concerns:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CRITICAL_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-rose-50/70 hover:bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {isSelected ? '⚠️ ' : ''}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Warning Alert if Low Rating or Unprofessional Behavior Selected */}
            {willTriggerAdminFlag && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 border border-rose-300 rounded-2xl space-y-1 text-left shadow-2xs"
              >
                <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Automated Quality & Admin Action Notice</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                  Submitting a 1 or 2-star rating or flagging "Unprofessional Behavior" automatically reduces {worker.name}'s network rating score and creates an immediate high-priority audit flag in the Admin System.
                </p>
              </motion.div>
            )}

            {/* Optional Comment Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Comments (Optional):
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any specific feedback about quality, behavior, or punctuality..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                className={`w-full py-3.5 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  willTriggerAdminFlag
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Rating & Complete Service</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
