import React from 'react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  return (
    <div className="min-h-dvh w-full bg-[#172554] text-slate-900 flex flex-col items-center justify-start font-sans">
      <div className="w-full max-w-lg min-h-dvh flex-1 flex flex-col bg-[#1E3A8A] shadow-2xl relative overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};
