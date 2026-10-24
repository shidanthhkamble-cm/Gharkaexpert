import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  X,
  CheckCircle,
  FolderPlus,
  MapPin,
  Calendar,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { PortfolioItem, TradeCategory, Language } from '../types';
import { t, getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';
import { deviceCameraService } from '../services/capacitorDeviceService';

interface WorkPortfolioProps {
  portfolio: PortfolioItem[];
  currentLanguage: Language;
  onAddPortfolioItem: (item: PortfolioItem) => void;
}

export const WorkPortfolio: React.FC<WorkPortfolioProps> = ({
  portfolio,
  currentLanguage,
  onAddPortfolioItem,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TradeCategory>('mason');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImg, setSelectedImg] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCaptureCamera = async () => {
    setUploadError(null);
    const res = await deviceCameraService.captureDocumentPhoto('Capture Completed Site Work');
    if (res.success && res.dataUrl) {
      setSelectedImg(res.dataUrl);
      return;
    }
    if (!res.cancelled) {
      fileInputRef.current?.click();
    }
  };

  const handlePickGallery = async () => {
    setUploadError(null);
    const res = await deviceCameraService.pickGalleryPhoto('Select Project Photo');
    if (res.success && res.dataUrl) {
      setSelectedImg(res.dataUrl);
      return;
    }
    if (!res.cancelled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImg(reader.result as string);
        setUploadError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImg) {
      setUploadError('Please capture a photo using your camera or select one from your gallery.');
      return;
    }
    if (!title.trim()) return;

    const newItem: PortfolioItem = {
      id: `p-${Date.now()}`,
      title: title.trim(),
      category,
      imageUrl: selectedImg,
      description: description.trim() || 'Completed site work.',
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      location: location.trim() || 'Verified Site',
    };

    onAddPortfolioItem(newItem);
    setShowModal(false);
    setTitle('');
    setDescription('');
    setLocation('');
    setSelectedImg('');
    setUploadError(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Upload CTA */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            {t('portfolioTab', currentLanguage)}
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Showcase your completed site work to build trust &amp; get direct hiring calls
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Work</span>
        </button>
      </div>

      {/* Portfolio Grid Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {portfolio.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between text-slate-800"
          >
            <div className="relative h-44 bg-slate-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/95 backdrop-blur-md text-blue-700 rounded-lg text-[11px] font-bold border border-blue-200 shadow-sm flex items-center gap-1.5">
                <img
                  src={getCategory3DIcon(item.category)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded object-cover"
                />
                <span>{getCategoryLabel(item.category, currentLanguage)}</span>
              </div>
            </div>

            <div className="p-3.5 space-y-1">
              <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-normal">
                {item.description}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  {item.location || 'Site Location'}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {item.date}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* UPLOAD WORK PHOTO MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-100 space-y-4 shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white">Add Project Photo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Project Photo *
                  </label>
                  <div className="relative h-44 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 flex items-center justify-center">
                    {selectedImg ? (
                      <img
                        src={selectedImg}
                        alt="Project Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-1.5">
                        <Camera className="w-8 h-8 text-amber-400 mx-auto" />
                        <p className="text-xs text-slate-300 font-semibold">
                          Capture your completed site work
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={handleCaptureCamera}
                      className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePickGallery}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Photo Gallery</span>
                    </button>
                  </div>

                  {uploadError && (
                    <p className="mt-2 text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Title (काम का शीर्षक) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 3 BHK Tile Fitting & Plaster"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Trade Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TradeCategory)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="mason">Mason / Rajmistri</option>
                      <option value="carpenter">Carpenter / Sutar</option>
                      <option value="painter">Painter / Rangari</option>
                      <option value="plumber">Plumber / Nal Karigar</option>
                      <option value="electrician">Electrician / Bijli</option>
                      <option value="ac_repair">AC Technician</option>
                      <option value="helper">Helper / Labor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Location / Area
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Andheri West"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description / Details
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the work completed..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-sm transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save to My Portfolio</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
