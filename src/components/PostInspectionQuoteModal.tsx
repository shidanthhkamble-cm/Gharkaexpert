import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  Mic, 
  MicOff, 
  FileText, 
  CheckCircle, 
  XCircle, 
  X, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Volume2,
  AlertCircle
} from 'lucide-react';
import { WorkerProfile, PostInspectionQuote, Language } from '../types';

interface PostInspectionQuoteModalProps {
  mode: 'worker_create' | 'customer_view';
  worker: WorkerProfile;
  bookingId?: string;
  quote?: PostInspectionQuote;
  onSendQuote?: (amount: number, description: string, hasVoiceNote: boolean) => void;
  onApproveQuote?: () => void;
  onRejectQuote?: () => void;
  onClose: () => void;
}

export const PostInspectionQuoteModal: React.FC<PostInspectionQuoteModalProps> = ({
  mode,
  worker,
  bookingId,
  quote,
  onSendQuote,
  onApproveQuote,
  onRejectQuote,
  onClose,
}) => {
  // Form State for Worker
  const [totalAmount, setTotalAmount] = useState<number | ''>(quote?.totalAmount || 1000);
  const [description, setDescription] = useState(quote?.description || 'Engine tuning, oil filter replacement, and brake adjustment.');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [hasVoiceNote, setHasVoiceNote] = useState(quote?.hasVoiceNote || false);
  const [voiceDuration, setVoiceDuration] = useState(5);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setHasVoiceNote(true);
      }, 3000);
    } else {
      setIsRecordingVoice(false);
    }
  };

  const handlePlayVoice = () => {
    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 relative"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {mode === 'worker_create' ? 'Send Post-Inspection Estimate' : 'Mechanic Work Estimate'}
              </h3>
              <p className="text-xs text-amber-300">
                {mode === 'worker_create' ? 'After checking vehicle / appliance' : 'Review post-inspection total quote'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {mode === 'worker_create' ? (
            /* Worker Creating Quote Screen */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p>
                  Visiting Fee (₹{worker.visitingFee || 200}) already collected. Now enter the total estimate for spare parts & repair work.
                </p>
              </div>

              {/* Total Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Total Final Amount (₹ Rupees):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500 font-extrabold text-base">₹</span>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-lg text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 1-Line Detail text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Work & Parts Description (1 Line):
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Engine oil change, spark plug, brake shoe fitting"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 5-Second Voice Note Module */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-blue-600" /> 5-Sec Voice Note (Optional)
                  </span>
                  {hasVoiceNote && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Voice Recorded ✓
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      isRecordingVoice
                        ? 'bg-red-600 text-white animate-pulse'
                        : hasVoiceNote
                        ? 'bg-blue-50 text-blue-700 border border-blue-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isRecordingVoice ? 'Recording 3s...' : hasVoiceNote ? 'Re-record Voice' : 'Record 5s Voice Note'}</span>
                  </button>

                  {hasVoiceNote && (
                    <button
                      type="button"
                      onClick={handlePlayVoice}
                      className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isPlayingAudio ? 'Playing...' : 'Play'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Quote CTA */}
              <button
                type="button"
                onClick={() => {
                  if (onSendQuote && totalAmount) {
                    onSendQuote(Number(totalAmount), description, hasVoiceNote);
                  }
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Estimate to Customer Instant</span>
              </button>
            </div>
          ) : (
            /* Customer View & Decision Screen */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full uppercase">
                  Inspected by {worker.name}
                </span>
                <p className="text-2xl font-black text-amber-950">₹{totalAmount || quote?.totalAmount || 1000}</p>
                <p className="text-xs text-amber-800 font-semibold">Total Post-Inspection Repair Estimate</p>
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> Work Included:
                </p>
                <p className="text-slate-600 font-medium leading-relaxed">
                  "{description}"
                </p>

                {(hasVoiceNote || quote?.hasVoiceNote) && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5 text-blue-600" /> Mechanic Voice Explanation:
                    </span>
                    <button
                      onClick={handlePlayVoice}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{isPlayingAudio ? 'Playing...' : 'Listen Voice'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={onRejectQuote}
                  className="py-3 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Estimate</span>
                </button>

                <button
                  onClick={onApproveQuote}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Start Work</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
