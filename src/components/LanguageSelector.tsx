import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LANGUAGES, t } from '../data/translations';
import { Language } from '../types';
import { Check, Volume2, Search, ArrowRight, Languages } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onProceed: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onProceed,
}) => {
  const [search, setSearch] = useState('');
  const [playingAudioFor, setPlayingAudioFor] = useState<string | null>(null);

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.nameInEnglish.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAudioPreview = (lang: (typeof LANGUAGES)[number]) => {
    setPlayingAudioFor(lang.code);
    // Speech synthesis audio preview in chosen language if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `GharKaExpert me aapka swagat hai. ${lang.nativeName}`
      );
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setPlayingAudioFor(null), 2000);
  };

  return (
    <div className="min-h-dvh flex-1 w-full bg-[#1E3A8A] text-white px-4 py-5 sm:px-6 sm:py-6 flex flex-col justify-between">
      <div className="w-full space-y-4">
        {/* Top Header Inside Deep Blue Area */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-11 h-11 bg-white text-[#1E3A8A] rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {t('selectLanguageTitle', selectedLanguage)}
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              14 Indian Languages Supported · १४ भारतीय भाषाएं
            </p>
          </div>
        </div>

        {/* Clean White Card for Search & Language Grid */}
        <div className="w-full bg-white text-slate-900 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language / भाषा खोजें..."
              className="w-full min-h-[42px] pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-[#1E3A8A] transition-colors placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <motion.div
                  key={lang.code}
                  role="button"
                  tabIndex={0}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectLanguage(lang.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectLanguage(lang.code);
                    }
                  }}
                  className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50 border-[#1E3A8A] ring-2 ring-blue-900/15'
                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">{lang.scriptFlag}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudioPreview(lang);
                        }}
                        title="Voice preview"
                        className={`p-1 rounded-full text-xs transition-colors ${
                          playingAudioFor === lang.code
                            ? 'bg-[#1E3A8A] text-white'
                            : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-200/60'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      {isSelected && (
                        <span className="p-1 bg-[#1E3A8A] text-white rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="font-bold text-base text-slate-900 leading-tight">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {lang.nameInEnglish}
                    </p>
                  </div>

                  <span className="text-[10px] text-[#1E3A8A] font-medium mt-1 truncate">
                    {lang.subtext}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <button
            onClick={onProceed}
            className="w-full min-h-[48px] py-3.5 px-5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>{t('continueBtn', selectedLanguage)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-4 pb-1 text-center text-[11px] text-blue-200/90">
        GharKaExpert · Trusted Local Home Services
      </div>
    </div>
  );
};
