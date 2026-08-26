import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneCall, 
  MessageSquare, 
  X, 
  PhoneOff, 
  Mic, 
  Volume2, 
  ExternalLink,
  Copy,
  Check,
  Send,
  BadgeCheck,
  ShieldCheck
} from 'lucide-react';
import { WorkerProfile, Language } from '../types';

interface DirectCommModalProps {
  worker: WorkerProfile | null;
  mode: 'call' | 'whatsapp' | null;
  onClose: () => void;
  currentLanguage: Language;
}

export const DirectCommModal: React.FC<DirectCommModalProps> = ({
  worker,
  mode,
  onClose,
  currentLanguage,
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  // Default WhatsApp message template
  useEffect(() => {
    if (worker) {
      setCustomMsg(
        `Namaste ${worker.name}, I found your verified profile on GharKaExpert. Are you available for work near ${worker.city}?`
      );
    }
  }, [worker]);

  // Call duration timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'call' && callStatus === 'connecting') {
      const connectTimeout = setTimeout(() => {
        setCallStatus('connected');
      }, 1500);
      return () => clearTimeout(connectTimeout);
    }
    if (mode === 'call' && callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, callStatus]);

  if (!worker || !mode) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyMsg = () => {
    navigator.clipboard.writeText(customMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = worker.phone.replace(/[^0-9]/g, '');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        {mode === 'call' ? (
          /* DIRECT CALL SIMULATION OVERLAY */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 flex flex-col items-center justify-between min-h-[460px] shadow-xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Info */}
            <div className="text-center space-y-1 mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct Call • No Commission
              </span>
              <h4 className="text-xs text-slate-400 font-mono pt-2">
                {callStatus === 'connecting'
                  ? 'Connecting GharKaExpert Helpline...'
                  : callStatus === 'connected'
                  ? 'Call Connected • HD Voice'
                  : 'Call Ended'}
              </h4>
            </div>

            {/* Worker Avatar & Name */}
            <div className="flex flex-col items-center text-center my-4">
              <div className="relative w-28 h-28 rounded-full border-4 border-blue-600 p-1 mb-3 shadow-md">
                <img
                  src={worker.photoUrl}
                  alt={worker.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <BadgeCheck className="w-7 h-7 text-emerald-400 bg-slate-900 rounded-full absolute bottom-0 right-0 stroke-[2.5]" />
              </div>

              <h3 className="text-xl font-bold text-white">{worker.name}</h3>
              <p className="text-sm font-semibold text-blue-300 font-mono">
                {worker.phone}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Rate: ₹{worker.dailyRate}/day • {worker.city}
              </p>

              {callStatus === 'connected' && (
                <div className="mt-3 px-4 py-1 bg-blue-600/30 border border-blue-400/40 rounded-full text-sm font-mono font-bold text-blue-300 animate-pulse">
                  {formatDuration(callDuration)}
                </div>
              )}
            </div>

            {/* Call Action Controls */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-around w-full">
                <button className="p-3.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300">
                  <Mic className="w-6 h-6" />
                </button>
                <button className="p-3.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300">
                  <Volume2 className="w-6 h-6" />
                </button>
                <a
                  href={`tel:${worker.phone}`}
                  className="p-3.5 bg-green-600 hover:bg-green-700 rounded-full text-white shadow-md"
                  title="Dial on phone dialer"
                >
                  <ExternalLink className="w-6 h-6" />
                </a>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call / बंद करें</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* WHATSAPP MESSAGE DIALOG */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 text-slate-800 space-y-4 shadow-xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl border border-green-100">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Direct WhatsApp Message
                  </h3>
                  <p className="text-xs text-green-700 font-bold">
                    To: {worker.name} ({worker.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Message Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Custom Pre-filled Message:
              </label>
              <textarea
                rows={4}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-green-600 font-sans"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  customMsg
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Open in WhatsApp 💬</span>
              </a>

              <button
                type="button"
                onClick={handleCopyMsg}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Message Text</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
