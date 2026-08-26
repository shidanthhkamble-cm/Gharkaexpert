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
    <div className="min-h-[580px] w-full bg-slate-50 text-slate-800 p-5 flex flex-col justify-between rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('selectLanguageTitle', selectedLanguage)}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              14 Indian Languages Supported • १४ भारतीय भाषाएं
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative my-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language / भाषा खोजें..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 transition-colors placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Grid of 14 Languages */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredLanguages.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectLanguage(lang.code)}
                className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
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
                          ? 'bg-blue-600 text-white animate-bounce'
                          : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {isSelected && (
                      <span className="p-1 bg-blue-600 text-white rounded-full">
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

                <span className="text-[10px] text-blue-700 font-medium mt-1 truncate">
                  {lang.subtext}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Proceed Button */}
      <div className="pt-4 border-t border-slate-200 mt-2">
        <button
          onClick={onProceed}
          className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          <span>{t('continueBtn', selectedLanguage)}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
