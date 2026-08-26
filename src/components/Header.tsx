import React, { useState } from 'react';
import { 
  Languages, 
  ArrowLeftRight, 
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { LANGUAGES, t } from '../data/translations';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  currentRole: UserRole;
  onRoleToggle: () => void;
  isEmergencyOnly: boolean;
  onToggleEmergency: () => void;
  userName: string;
  userPhoto?: string;
  onOpenInbox?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  currentRole,
  onRoleToggle,
  userName,
  userPhoto,
  onOpenInbox,
  unreadCount = 0,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const currentLangMeta = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <header className="bg-blue-700 text-white px-4 py-3 sm:px-6 sm:py-4 sticky top-0 z-30 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="text-blue-700 font-black text-2xl tracking-tighter">G</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-extrabold text-white leading-tight tracking-tight uppercase">
                GharKaExpert
              </h1>
              <span className="px-1.5 py-0.5 bg-blue-800 text-blue-100 border border-blue-500 rounded text-[10px] font-bold">
                PRO
              </span>
            </div>
            <p className="text-xs text-blue-100 italic font-medium truncate">
              {t('tagline', currentLanguage)}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Inbox / Chat Messages Button */}
          {onOpenInbox && (
            <button
              onClick={onOpenInbox}
              className="relative p-2 bg-blue-800 hover:bg-blue-900 border border-blue-500/80 rounded-full text-white transition-colors shadow-sm"
              title="In-App Chat Inbox"
            >
              <MessageSquare className="w-4 h-4 text-blue-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-blue-700">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Language Picker Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="py-1.5 px-3 bg-blue-800 hover:bg-blue-900 border border-blue-500/80 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
              title="Change Language / भाषा बदलें"
            >
              <Languages className="w-4 h-4 text-blue-200" />
              <span>{currentLangMeta.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 grid grid-cols-1 gap-1 max-h-64 overflow-y-auto custom-scrollbar text-slate-800">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1 uppercase tracking-wider">
                  Select Language (14 Languages):
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between font-semibold transition-colors ${
                      currentLanguage === lang.code
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{lang.scriptFlag}</span>
                      <span>{lang.nativeName}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{lang.nameInEnglish}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Switcher Pill */}
          <button
            onClick={onRoleToggle}
            className={`py-1.5 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm ${
              currentRole === 'worker'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-blue-800 text-white border-blue-500 hover:bg-blue-900'
            }`}
            title="Switch between Customer & Contractor/Worker role"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="capitalize">{currentRole === 'worker' ? 'Mestri' : 'Grahak'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
