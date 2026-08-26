import React, { useState } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  const [isFrameMode, setIsFrameMode] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-6 font-sans">
      {/* Top Outer Controls Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-3 px-2 text-xs text-slate-400 font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-amber-400 font-bold">GharKaExpert App Preview</span>
        </div>

        <button
          onClick={() => setIsFrameMode(!isFrameMode)}
          className="py-1 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1.5 transition-colors text-[11px]"
        >
          {isFrameMode ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Screen View</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Mobile Frame View</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container or Simulated Phone Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          isFrameMode
            ? 'max-w-[420px] bg-slate-900 border-[8px] border-slate-800 rounded-[40px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative min-h-[720px]'
            : 'max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden min-h-[700px]'
        }`}
      >
        {/* Mobile Status Bar in Frame Mode */}
        {isFrameMode && (
          <div className="bg-slate-950 text-slate-300 px-6 py-2 flex items-center justify-between text-[11px] font-mono select-none z-40 border-b border-slate-800/60">
            <span>09:41 AM</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-slate-400" />
              <Wifi className="w-3 h-3 text-slate-400" />
              <Battery className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        )}

        {/* Content App */}
        <div className="w-full">{children}</div>

        {/* Mobile Bottom Home Bar Indicator in Frame Mode */}
        {isFrameMode && (
          <div className="py-2 bg-slate-950 flex justify-center items-center">
            <div className="w-32 h-1 bg-slate-700 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
