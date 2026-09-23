import React from 'react';
import { 
  Users, 
  ImageIcon, 
  Building2, 
  CalendarCheck, 
  History
} from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavBarProps {
  activeTab: 'workers' | 'portfolio' | 'passwork' | 'bookings';
  onTabChange: (tab: 'workers' | 'portfolio' | 'passwork' | 'bookings') => void;
  bookingsCount: number;
  currentRole: UserRole;
  subContractJobsCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  bookingsCount,
  currentRole,
  subContractJobsCount
}) => {
  return (
    <nav 
      id="bottom-app-navigation"
      aria-label="Bottom Navigation"
      className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] py-1 px-2 select-none"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* TAB 1: Karigars / Workers */}
        <button
          id="nav-tab-workers"
          type="button"
          onClick={() => onTabChange('workers')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer min-w-[62px] ${
            activeTab === 'workers'
              ? 'text-blue-700 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'workers' ? 'bg-blue-50 text-blue-700' : ''}`}>
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">
            Karigars
          </span>
        </button>

        {/* TAB 2: Work Photos / Portfolio */}
        <button
          id="nav-tab-portfolio"
          type="button"
          onClick={() => onTabChange('portfolio')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer min-w-[62px] ${
            activeTab === 'portfolio'
              ? 'text-blue-700 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'portfolio' ? 'bg-blue-50 text-blue-700' : ''}`}>
            <ImageIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">
            Photos
          </span>
        </button>

        {/* TAB 3: Sub-Contracts / Passwork */}
        <button
          id="nav-tab-passwork"
          type="button"
          onClick={() => onTabChange('passwork')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer min-w-[62px] ${
            activeTab === 'passwork'
              ? 'text-blue-700 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'passwork' ? 'bg-blue-50 text-blue-700' : ''}`}>
            <Building2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">
            Passwork
          </span>
          {subContractJobsCount > 0 && (
            <span className="absolute 1 top-0.5 right-2 px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full">
              {subContractJobsCount}
            </span>
          )}
        </button>

        {/* TAB 4: Bookings / History */}
        <button
          id="nav-tab-bookings-history"
          type="button"
          onClick={() => onTabChange('bookings')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer min-w-[70px] ${
            activeTab === 'bookings'
              ? 'text-blue-700 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-700' : ''}`}>
            <History className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">
            {currentRole === 'worker' ? 'Jobs / History' : 'Bookings / History'}
          </span>
          {bookingsCount > 0 && (
            <span className="absolute top-0.5 right-2 px-1 bg-blue-600 text-white text-[9px] font-black rounded-full">
              {bookingsCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
