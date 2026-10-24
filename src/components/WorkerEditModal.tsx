import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Save,
  Upload,
  BadgeCheck,
  DollarSign,
  Plus,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Camera,
  User,
} from 'lucide-react';
import { WorkerProfile, PortfolioItem } from '../types';
import { deviceCameraService } from '../services/capacitorDeviceService';

interface WorkerEditModalProps {
  worker: WorkerProfile;
  onSave: (updatedWorker: WorkerProfile) => void;
  onClose: () => void;
  onOpenSoftDelete?: () => void;
}

export const WorkerEditModal: React.FC<WorkerEditModalProps> = ({
  worker,
  onSave,
  onClose,
  onOpenSoftDelete,
}) => {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(worker.photoUrl);
  const [dailyRate, setDailyRate] = useState(worker.dailyRate || 950);
  const [sqftRate, setSqftRate] = useState(worker.sqftRate || 25);
  const [visitingFee, setVisitingFee] = useState(worker.visitingFee || 200);
  const [pricingType, setPricingType] = useState(worker.pricingType || 'daily');
  const [bio, setBio] = useState(worker.bio || '');
  const [city, setCity] = useState(worker.city || '');
  const [phone] = useState(worker.phone || '');
  const [aadhaarVerified, setAadhaarVerified] = useState(worker.aadhaarVerified || false);
  const [aadhaarNumber, setAadhaarNumber] = useState(worker.aadhaarNumberMasked || '');
  const [aadhaarCardPhoto, setAadhaarCardPhoto] = useState<string>('');

  // Portfolio items
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(worker.portfolio || []);
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const kycInputRef = useRef<HTMLInputElement | null>(null);
  const portfolioInputRef = useRef<HTMLInputElement | null>(null);

  const readInputFile = (e: React.ChangeEvent<HTMLInputElement>, onLoad: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        onLoad(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureProfileSelfie = async () => {
    const res = await deviceCameraService.captureSelfiePhoto();
    if (res.success && res.dataUrl) {
      setProfilePhotoUrl(res.dataUrl);
    } else if (!res.cancelled) {
      profileInputRef.current?.click();
    }
  };

  const handlePickProfileGallery = async () => {
    const res = await deviceCameraService.pickGalleryPhoto('Select Profile Photo');
    if (res.success && res.dataUrl) {
      setProfilePhotoUrl(res.dataUrl);
    } else if (!res.cancelled) {
      profileInputRef.current?.click();
    }
  };

  const handleCaptureAadhaarDoc = async () => {
    const res = await deviceCameraService.captureDocumentPhoto('Aadhaar ID Card');
    if (res.success && res.dataUrl) {
      setAadhaarCardPhoto(res.dataUrl);
      setAadhaarVerified(true);
    } else if (!res.cancelled) {
      kycInputRef.current?.click();
    }
  };

  const handleCapturePortfolioPhoto = async () => {
    setPortfolioError(null);
    const res = await deviceCameraService.captureDocumentPhoto('Completed Work Photo');
    if (res.success && res.dataUrl) {
      setNewImageUrl(res.dataUrl);
    } else if (!res.cancelled) {
      portfolioInputRef.current?.click();
    }
  };

  const handlePickPortfolioGallery = async () => {
    setPortfolioError(null);
    const res = await deviceCameraService.pickGalleryPhoto('Select Work Photo');
    if (res.success && res.dataUrl) {
      setNewImageUrl(res.dataUrl);
    } else if (!res.cancelled) {
      portfolioInputRef.current?.click();
    }
  };

  const handleAddPortfolio = () => {
    if (!newTitle.trim()) {
      setPortfolioError('Please enter a project title.');
      return;
    }
    if (!newImageUrl.trim()) {
      setPortfolioError('Please capture or select a photo of your work.');
      return;
    }

    const newItem: PortfolioItem = {
      id: `p-${Date.now()}`,
      title: newTitle.trim(),
      category: worker.primaryTrade,
      imageUrl: newImageUrl,
      description: 'Completed site work uploaded by Karigar.',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setPortfolio([newItem, ...portfolio]);
    setNewTitle('');
    setNewImageUrl('');
    setPortfolioError(null);
  };

  const handleRemovePortfolio = (id: string) => {
    setPortfolio(portfolio.filter((p) => p.id !== id));
  };

  const handleSaveProfile = () => {
    const updated: WorkerProfile = {
      ...worker,
      photoUrl: profilePhotoUrl,
      dailyRate: Number(dailyRate),
      sqftRate: Number(sqftRate),
      visitingFee: Number(visitingFee),
      pricingType,
      bio,
      city,
      phone,
      aadhaarVerified: aadhaarVerified || Boolean(aadhaarCardPhoto),
      aadhaarNumberMasked: aadhaarNumber,
      portfolio,
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
              <h3 className="font-extrabold text-base text-white">Karigar Profile &amp; Rates</h3>
              <p className="text-xs text-blue-300">Update photo, rates, KYC &amp; work portfolio</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Profile Photo Camera Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={profilePhotoUrl}
                alt={worker.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-600 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Profile Photo</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Capture a selfie or choose from gallery
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={profileInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => readInputFile(e, setProfilePhotoUrl)}
            />

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCaptureProfileSelfie}
                className="py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={handlePickProfileGallery}
                className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Gallery</span>
              </button>
            </div>
          </div>

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
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  pricingType === 'visiting'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🛠️ Visiting Fee
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
                    City Visiting &amp; Inspection Fee (₹):
                  </label>
                  <input
                    type="number"
                    value={visitingFee}
                    onChange={(e) => setVisitingFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-sm text-amber-700 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Displayed to customers prior to inspection. Final repair quote is shared post-inspection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bio & Location Edit */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900">Karigar Bio &amp; City</h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Service City / Location:
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Bio / Work Description:
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Aadhaar KYC Camera Capture */}
          <div className="space-y-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                Aadhaar Verification (KYC)
              </h4>
              {(aadhaarVerified || aadhaarCardPhoto) && (
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  Verified Karigar ✓
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-800">
              Capture your Aadhaar card using your phone camera to maintain your Verified Karigar badge.
            </p>

            <input
              type="file"
              ref={kycInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) =>
                readInputFile(e, (url) => {
                  setAadhaarCardPhoto(url);
                  setAadhaarVerified(true);
                })
              }
            />

            {aadhaarCardPhoto && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200">
                <img
                  src={aadhaarCardPhoto}
                  alt="Captured Aadhaar Document"
                  className="w-12 h-8 object-cover rounded border border-slate-200"
                />
                <span className="text-xs font-bold text-emerald-900">
                  ID Card Photo Captured
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                placeholder="Enter Aadhaar Number"
                className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleCaptureAadhaarDoc}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture ID</span>
              </button>
            </div>
          </div>

          {/* Portfolio Showcase Manager */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Work Portfolio Photos
            </h4>

            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
              {portfolio.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <span className="font-bold text-slate-800 truncate">{item.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePortfolio(item.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (portfolioError) setPortfolioError(null);
                }}
                placeholder="Project Title (e.g., Modular Kitchen / Bathroom Tile Work)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />

              <input
                type="file"
                ref={portfolioInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => readInputFile(e, setNewImageUrl)}
              />

              {newImageUrl && (
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2">
                    <img
                      src={newImageUrl}
                      alt="New work preview"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <span className="text-xs font-semibold text-slate-700">Work photo ready</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewImageUrl('')}
                    className="text-xs text-rose-600 font-bold px-2 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {portfolioError && (
                <p className="text-[11px] text-rose-600 font-semibold">{portfolioError}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCapturePortfolioPhoto}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={handlePickPortfolioGallery}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddPortfolio}
                  className="ml-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 shrink-0 space-y-2">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile &amp; Rates</span>
          </button>

          {onOpenSoftDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSoftDelete();
              }}
              className="w-full py-2 text-rose-600 hover:text-rose-700 text-xs font-bold hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deactivate Account (Preserves Ratings &amp; History)</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
