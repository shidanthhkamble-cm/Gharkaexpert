import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MessageSquare, Phone, ChevronRight, Search, ShieldCheck, Sparkles, User, BadgeCheck } from 'lucide-react';
import { Conversation, WorkerProfile, Language } from '../types';
import { getCategoryLabel } from '../data/translations';

interface InboxModalProps {
  conversations: Conversation[];
  workers: WorkerProfile[];
  currentLanguage: Language;
  onOpenChat: (workerId: string) => void;
  onCallClick: (worker: WorkerProfile) => void;
  onClose: () => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  conversations,
  workers,
  currentLanguage,
  onOpenChat,
  onCallClick,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c =>
    c.workerName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col h-[580px] max-h-[90vh] overflow-hidden text-slate-800 relative"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Karigar In-App Messages</h3>
              <p className="text-xs text-blue-300">Direct Chat & Direct Calling</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations or Karigar name..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-sans shadow-2xs"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No active conversations found</p>
              <p className="text-[11px] text-slate-400">
                Select any Karigar card on the home screen and click "Chat" to start
              </p>
            </div>
          ) : (
            filtered.map((conv) => {
              const workerObj = workers.find(w => w.id === conv.workerId);

              return (
                <div
                  key={conv.workerId}
                  onClick={() => onOpenChat(conv.workerId)}
                  className="p-3 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={conv.workerPhoto}
                        alt={conv.workerName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs"
                      />
                      <BadgeCheck className="w-4 h-4 text-emerald-600 bg-white rounded-full absolute -bottom-1 -right-1" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {conv.workerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {conv.lastTimestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                          {getCategoryLabel(conv.workerTrade, currentLanguage)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">₹{conv.dailyRate}/day</span>
                      </div>

                      <p className="text-xs text-slate-600 truncate font-normal pt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {workerObj && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallClick(workerObj);
                        }}
                        className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-200"
                        title="Direct Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
          <span className="flex items-center justify-center gap-1 text-blue-700 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Real-time in-app chat & direct call connection
          </span>
        </div>
      </motion.div>
    </div>
  );
};
