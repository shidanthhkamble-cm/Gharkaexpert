import React from 'react';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 flex flex-col items-center justify-start font-sans">
      <div className="w-full max-w-lg min-h-screen bg-slate-50 shadow-sm relative overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};
