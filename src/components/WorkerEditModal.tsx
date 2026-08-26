import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Save, 
  Upload, 
  CheckCircle, 
  BadgeCheck, 
  DollarSign, 
  Plus, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { WorkerProfile, PortfolioItem, TradeCategory } from '../types';

interface WorkerEditModalProps {
  worker: WorkerProfile;
  onSave: (updatedWorker: WorkerProfile) => void;
  onClose: () => void;
}

export const WorkerEditModal: React.FC<WorkerEditModalProps> = ({
  worker,
  onSave,
  onClose,
}) => {
  const [dailyRate, setDailyRate] = useState(worker.dailyRate || 950);
  const [sqftRate, setSqftRate] = useState(worker.sqftRate || 25);
  const [visitingFee, setVisitingFee] = useState(worker.visitingFee || 200);
  const [pricingType, setPricingType] = useState(worker.pricingType || 'daily');
  const [bio, setBio] = useState(worker.bio || '');
  const [city, setCity] = useState(worker.city || '');
  const [phone, setPhone] = useState(worker.phone || '');
  const [aadhaarVerified, setAadhaarVerified] = useState(worker.aadhaarVerified || false);
  const [aadhaarNumber, setAadhaarNumber] = useState(worker.aadhaarNumberMasked || 'XXXX-XXXX-8821');
  const [aadhaarUploaded, setAadhaarUploaded] = useState(false);

  // Portfolio items
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(worker.portfolio || []);
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddPortfolio = () => {
    if (!newTitle.trim()) return;
    const newItem: PortfolioItem = {
      id: `p-${Date.now()}`,
      title: newTitle,
      category: worker.primaryTrade,
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      description: 'Recent project completed with 100% quality guarantee.',
      date: 'Just now'
    };
    setPortfolio([...portfolio, newItem]);
    setNewTitle('');
    setNewImageUrl('');
  };

  const handleRemovePortfolio = (id: string) => {
    setPortfolio(portfolio.filter(p => p.id !== id));
  };

  const handleSaveProfile = () => {
    const updated: WorkerProfile = {
      ...worker,
      dailyRate: Number(dailyRate),
      sqftRate: Number(sqftRate),
      visitingFee: Number(visitingFee),
      pricingType,
      bio,
      city,
      phone,
      aadhaarVerified: aadhaarVerified || aadhaarUploaded,
      aadhaarNumberMasked: aadhaarNumber,
      portfolio
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Karigar Rate & Profile Edit</h3>
              <p className="text-xs text-blue-300">Update rates, Aadhaar KYC & Portfolio</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Rate & Pricing Model Configuration */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" /> Service Rates Setup
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                0% Commission
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPricingType('daily')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  pricingType === 'daily'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏠 Daily Wage / Dihadi
              </button>

              <button
                type="button"
                onClick={() => setPricingType('visiting')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  pricingType === 'visiting'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🛠️ City Visiting Fee (Mechanic)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {pricingType === 'daily' ? (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Daily Wage Rate (₹ / day):
                    </label>
                    <input
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Per Sq. Ft Charge (₹ / sq.ft):
                    </label>
                    <input
                      type="number"
                      value={sqftRate}
                      onChange={(e) => setSqftRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    City Visiting & Inspection Fee (₹):
                  </label>
                  <input
                    type="number"
                    value={visitingFee}
                    onChange={(e) => setVisitingFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-sm text-amber-700 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    This charge is displayed to customers before inspection. Post-inspection total quote is sent after checking vehicle/appliances.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bio & Location Edit */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900">Karigar Bio & City</h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Service City / Location:</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Bio / Work Description:</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Aadhaar KYC Verification Upload Module */}
          <div className="space-y-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                Aadhaar Verification (KYC)
              </h4>
              {(aadhaarVerified || aadhaarUploaded) && (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  Verified Karigar ✓
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-800">
              Upload your Aadhaar ID photo to get the green <BadgeCheck className="w-3.5 h-3.5 inline text-emerald-600" /> Verified Karigar badge on your profile.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                placeholder="Aadhaar Masked Number"
                className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  setAadhaarUploaded(true);
                  setAadhaarVerified(true);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload ID</span>
              </button>
            </div>
          </div>

          {/* Portfolio Showcase Manager */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Portfolio Photos Showcase
            </h4>

            {/* List */}
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
              {portfolio.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{item.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePortfolio(item.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New Project Title (e.g., Modular Kitchen / Engine Overhaul)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Image URL (or leave blank for sample photo)"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddPortfolio}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Rates</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
