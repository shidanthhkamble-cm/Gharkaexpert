import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Phone, 
  MessageSquare, 
  Languages, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCheck, 
  BadgeCheck, 
  Bot, 
  MapPin, 
  Camera, 
  Check, 
  ChevronDown,
  Volume2
} from 'lucide-react';
import { WorkerProfile, ChatMessage, Language } from '../types';
import { t, getCategoryLabel } from '../data/translations';
import { SAMPLE_SITE_IMAGES } from '../data/initialChats';

interface ChatModalProps {
  worker: WorkerProfile;
  currentLanguage: Language;
  messages: ChatMessage[];
  onSendMessage: (workerId: string, text: string, imageUrl?: string) => void;
  onCallClick: (worker: WorkerProfile) => void;
  onWhatsappClick: (worker: WorkerProfile) => void;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  worker,
  currentLanguage,
  messages,
  onSendMessage,
  onCallClick,
  onWhatsappClick,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const QUICK_CHIPS = [
    { label: 'Aap kahan ho? 📍', text: 'Namaste, aap abhi kahan par hain?' },
    { label: 'Rate fix karein? 💰', text: `Aapka daily rate ₹${worker.dailyRate} hai na? Final rate kya rahega?` },
    { label: 'Location share karein 🗺️', text: 'Mera site location bhej raha hoon. Kitni der mein aayenge?' },
    { label: 'Site photo bhejo 📸', text: 'Main site ka photo attach kar raha hoon, kripya dekh lijiye.' },
    { label: 'Kal subah aayenge? ⏰', text: 'Kya aap kal subah 9 baje site pe aa sakte hain?' },
  ];

  const handleSend = (overrideText?: string, overrideImage?: string) => {
    const textToSend = overrideText || inputText;
    const imgToSend = overrideImage || selectedImage || undefined;

    if (!textToSend.trim() && !imgToSend) return;

    onSendMessage(worker.id, textToSend, imgToSend);
    setInputText('');
    setSelectedImage(null);
    setCustomImageUrl('');
    setShowImagePicker(false);

    // Trigger simulated worker typing & response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      generateWorkerResponse(textToSend, imgToSend);
    }, 1800);
  };

  const generateWorkerResponse = (userMsg: string, hasImg?: string) => {
    const lower = userMsg.toLowerCase();
    let replyText = '';

    if (hasImg) {
      replyText = `Photo dekh liya saheb! Is kaam ko hamare team achhe se kar sakti hai. Isme 1-2 din lagenge.`;
    } else if (lower.includes('rate') || lower.includes('paisa') || lower.includes('wage') || lower.includes('kitna')) {
      replyText = `Ji saheb, mera daily wage ₹${worker.dailyRate} fixed hai. Quality aur safety ki full guarantee hai.`;
    } else if (lower.includes('kahan') || lower.includes('location') || lower.includes('der')) {
      replyText = `Haan saheb, main paas mein hi hoon (${worker.distanceKm} km door). Call karke location confirm kar lijiye.`;
    } else if (lower.includes('kal') || lower.includes('time') || lower.includes('baje')) {
      replyText = `Haan saheb, kal subah 8:30 se 9 baje ke beech main site par hazir ho jaunga!`;
    } else {
      replyText = `Ji saheb, bilkul! Aap call ya WhatsApp kar lijiye, baaki details fix kar lete hain.`;
    }

    onSendMessage(worker.id, replyText);
  };

  const handleVoicePlay = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col h-[620px] max-h-[92vh] overflow-hidden text-slate-800 relative"
      >
        {/* Chat Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={worker.photoUrl}
                alt={worker.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-blue-500"
              />
              <span className="w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full absolute bottom-0 right-0" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {worker.name}
                </h3>
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-blue-300 font-semibold">
                  {getCategoryLabel(worker.primaryTrade, currentLanguage)}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-medium text-[11px]">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Auto Translate Toggle */}
            <button
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                autoTranslate
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Auto-Translation"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">
                {autoTranslate ? 'Auto-Translate ON' : 'Translate OFF'}
              </span>
            </button>

            {/* Direct Call Button */}
            <button
              onClick={() => onCallClick(worker)}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
              title="In-App Direct Call"
            >
              <Phone className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Translation Banner Notice */}
        {autoTranslate && (
          <div className="bg-blue-50 border-b border-blue-100 px-3 py-1.5 text-[11px] text-blue-800 font-medium flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Auto-translating messages to <strong>{currentLanguage.toUpperCase()}</strong>
              </span>
            </div>
            <span className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200 font-mono">
              Live AI
            </span>
          </div>
        )}

        {/* Chat Message History */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/60 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full mx-auto flex items-center justify-center border border-blue-100">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-600">
                Start direct conversation with {worker.name}
              </p>
              <p className="text-[11px] text-slate-400">
                Zero brokerage • Direct contact with verified Karigar
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCustomer = msg.sender === 'customer';
              const translation = msg.translatedText?.[currentLanguage];

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 shadow-sm relative space-y-1.5 ${
                      isCustomer
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    {/* Optional Image Attachment */}
                    {msg.imageUrl && (
                      <div className="rounded-xl overflow-hidden mb-1.5 border border-black/10 cursor-pointer">
                        <img
                          src={msg.imageUrl}
                          alt="Attached site photo"
                          className="w-full h-40 object-cover hover:scale-105 transition-transform"
                          onClick={() => setZoomImage(msg.imageUrl || null)}
                        />
                      </div>
                    )}

                    {/* Main Message Text */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-medium leading-relaxed break-words">
                        {msg.text}
                      </p>
                      {!isCustomer && (
                        <button
                          onClick={() => handleVoicePlay(msg.text)}
                          className="text-slate-400 hover:text-blue-600 p-0.5 shrink-0"
                          title="Listen Voice Audio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Auto-Translated Box */}
                    {autoTranslate && translation && translation !== msg.text && (
                      <div
                        className={`text-[11px] p-2 rounded-lg border mt-1 font-sans ${
                          isCustomer
                            ? 'bg-blue-700/60 border-blue-500/50 text-blue-100'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-semibold text-[10px] text-blue-600 mb-0.5">
                          <Languages className="w-3 h-3" />
                          <span>Translated ({currentLanguage.toUpperCase()}):</span>
                        </div>
                        <p className="leading-snug">{translation}</p>
                      </div>
                    )}

                    {/* Timestamp & Status */}
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] pt-0.5 ${
                        isCustomer ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isCustomer && <CheckCheck className="w-3.5 h-3.5 text-blue-200" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 w-max shadow-sm animate-pulse">
              <Bot className="w-4 h-4 text-blue-600" />
              <span>{worker.name} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips Bar */}
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-500 shrink-0 uppercase tracking-wider">
            Quick:
          </span>
          {QUICK_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSend(chip.text)}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 rounded-full text-xs font-medium whitespace-nowrap shadow-2xs transition-all active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Image Attachment Selector Overlay */}
        <AnimatePresence>
          {showImagePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-900 border-t border-slate-800 p-3 space-y-2 text-slate-100 shrink-0"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <Camera className="w-4 h-4 text-blue-400" /> Select Site / Material Photo:
                </span>
                <button
                  onClick={() => setShowImagePicker(false)}
                  className="p-1 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {SAMPLE_SITE_IMAGES.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setSelectedImage(img.url);
                      setShowImagePicker(false);
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 h-16 transition-all ${
                      selectedImage === img.url ? 'border-blue-500 ring-2 ring-blue-400/50' : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white truncate px-1 text-center font-medium">
                      {img.title}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Image Thumbnail Preview in Input Bar */}
        {selectedImage && (
          <div className="px-3 py-1.5 bg-blue-50 border-t border-blue-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-blue-900">
              <img src={selectedImage} alt="Selected preview" className="w-8 h-8 rounded object-cover border border-blue-300" />
              <span className="font-semibold">Site photo attached</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 text-blue-600 hover:text-blue-800 text-xs font-bold"
            >
              Remove
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowImagePicker(!showImagePicker)}
            className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
              selectedImage || showImagePicker
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
            title="Attach Site Photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type message in any language..."
            className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-sans"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() && !selectedImage}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Full Photo Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="relative max-w-xl w-full">
              <button
                onClick={() => setZoomImage(null)}
                className="absolute -top-10 right-0 p-2 text-white bg-slate-800 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomImage}
                alt="Enlarged site photo"
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl border border-slate-700"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
