import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneCall, 
  MessageSquare, 
  X, 
  PhoneOff, 
  Mic, 
  MicOff,
  Volume2, 
  VolumeX,
  Lock,
  Check,
  Send,
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { WorkerProfile, Language } from '../types';

interface DirectCommModalProps {
  worker: WorkerProfile | null;
  mode: 'call' | 'whatsapp' | null;
  onClose: () => void;
  currentLanguage: Language;
  onOpenInAppChat?: (worker: WorkerProfile, initialMessage?: string) => void;
  onBookService?: (worker: WorkerProfile) => void;
}

export const DirectCommModal: React.FC<DirectCommModalProps> = ({
  worker,
  mode,
  onClose,
  currentLanguage,
  onOpenInAppChat,
  onBookService,
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [customMsg, setCustomMsg] = useState('');

  // Default in-app message template
  useEffect(() => {
    if (worker) {
      setCustomMsg(
        `Namaste ${worker.name}, I need assistance with ${worker.primaryTrade} work in ${worker.city}. Are you available for a GharKaExpert verified booking?`
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

  const virtualExtension = worker.id.replace('worker-', '');

  const handleStartInAppChat = () => {
    if (onOpenInAppChat) {
      onOpenInAppChat(worker, customMsg);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        {mode === 'call' ? (
          /* SECURE IN-APP MASKED CALL ROUTING (ANTI-BYPASS) */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 flex flex-col items-center justify-between min-h-[500px] shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Security & Masking Banner */}
            <div className="text-center space-y-1.5 mt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Masked VoIP Routing • Anti-Bypass</span>
              </div>
              <h4 className="text-xs text-slate-400 font-mono">
                {callStatus === 'connecting'
                  ? 'Connecting GharKaExpert Secure Gateway...'
                  : callStatus === 'connected'
                  ? 'Encrypted Voice Call Connected • VoIP HD'
                  : 'Call Ended'}
              </h4>
            </div>

            {/* Worker Avatar & Masked Identity */}
            <div className="flex flex-col items-center text-center my-3">
              <div className="relative w-24 h-24 rounded-full border-4 border-blue-500 p-1 mb-3 shadow-lg">
                <img
                  src={worker.photoUrl}
                  alt={worker.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <BadgeCheck className="w-6 h-6 text-emerald-400 bg-slate-900 rounded-full absolute bottom-0 right-0 stroke-[2.5]" />
              </div>

              <h3 className="text-lg font-extrabold text-white">{worker.name}</h3>

              {/* Secure Masked Phone Info */}
              <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl">
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-xs font-mono font-bold text-amber-300">
                  GKE-VIRTUAL • Ext #{virtualExtension}
                </span>
                <span className="text-[9px] font-extrabold bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded">
                  Masked
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-tight">
                🔒 Personal numbers are strictly hidden. All bookings made via this app call are protected by GharKaExpert's 30-day warranty.
              </p>

              {callStatus === 'connected' && (
                <div className="mt-3 px-4 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-sm font-mono font-bold text-emerald-300 animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{formatDuration(callDuration)}</span>
                </div>
              )}
            </div>

            {/* Call In-App Controls */}
            <div className="w-full space-y-3.5">
              <div className="flex items-center justify-center gap-4 w-full">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                    isMuted ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button 
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                    isSpeakerOn ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {onOpenInAppChat && (
                  <button
                    onClick={handleStartInAppChat}
                    className="p-3.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-full cursor-pointer transition-colors"
                    title="Switch to In-App Chat"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer transition-all active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End In-App Call</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* SECURE IN-APP CHAT & ANTI-BYPASS MESSAGING MODAL */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 text-slate-800 space-y-4 shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>Secure In-App Chat</span>
                    <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                      Strict Platform Route
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Karigar: <strong className="text-slate-800">{worker.name}</strong> • Masked Ext #{virtualExtension}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Anti-Bypass Security Policy Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-[11px] font-black text-amber-900">
                  Direct Personal Numbers & External WhatsApp Disabled
                </h5>
                <p className="text-[11px] text-amber-800 leading-tight">
                  To protect you from unverified offline charges and guarantee GharKaExpert's <strong>30-Day Work Warranty</strong>, all messaging, quotes, and bookings must take place strictly inside the app.
                </p>
              </div>
            </div>

            {/* In-App Message Compose */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Initial In-App Message:
              </label>
              <textarea
                rows={3}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Describe your job requirement..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-sans resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartInAppChat}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Open In-App Chat Inbox 💬</span>
              </button>

              {onBookService && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBookService(worker);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Book Directly via App Schedule</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
