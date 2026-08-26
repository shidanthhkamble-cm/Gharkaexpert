import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Users, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { SubContractJob, TradeCategory, Language } from '../types';
import { t, getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface SubContractBoardProps {
  jobs: SubContractJob[];
  currentLanguage: Language;
  onPostJob: (job: SubContractJob) => void;
  onCallContractor: (phone: string, name: string) => void;
  onWhatsappContractor: (phone: string, name: string, jobTitle: string) => void;
}

export const SubContractBoard: React.FC<SubContractBoardProps> = ({
  jobs,
  currentLanguage,
  onPostJob,
  onCallContractor,
  onWhatsappContractor,
}) => {
  const [showModal, setShowModal] = useState(false);
  
  // New Job Form State
  const [title, setTitle] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [tradeRequired, setTradeRequired] = useState<TradeCategory>('mason');
  const [workersNeeded, setWorkersNeeded] = useState(4);
  const [city, setCity] = useState('Mumbai');
  const [locationArea, setLocationArea] = useState('Thane West');
  const [dailyWage, setDailyWage] = useState(900);
  const [durationDays, setDurationDays] = useState(7);
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contractorName.trim()) return;

    const newJob: SubContractJob = {
      id: `sc-${Date.now()}`,
      title,
      contractorName,
      contractorPhone: contractorPhone || '+91 98765 43210',
      tradeRequired,
      workersNeeded: Number(workersNeeded),
      city,
      locationArea,
      dailyWage: Number(dailyWage),
      durationDays: Number(durationDays),
      description,
      isUrgent,
      postedTimeAgo: 'Just now',
      applicantsCount: 0,
    };

    onPostJob(newJob);
    setShowModal(false);
    // Reset form
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Post CTA */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            {t('passWorkTab', currentLanguage)}
          </h3>
          <p className="text-xs text-slate-300 font-normal">
            For Contractors & Main Karigars: Post site requirements to hire sub-karigars & helpers
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Post Pass Work</span>
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 bg-slate-900 text-white border rounded-xl shadow-md transition-all relative overflow-hidden ${
              job.isUrgent ? 'border-orange-500/80 ring-1 ring-orange-500/30' : 'border-slate-800'
            }`}
          >
            {job.isUrgent && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                <AlertTriangle className="w-3 h-3 text-white" /> URGENT REQUIREMENT
              </div>
            )}

            <div className="space-y-2">
              <div className="pr-20">
                <span className="px-2.5 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs">
                  <img
                    src={getCategory3DIcon(job.tradeRequired)}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded object-cover"
                  />
                  {getCategoryLabel(job.tradeRequired, currentLanguage)}
                </span>
                <h4 className="font-bold text-base text-white mt-1 leading-snug">
                  {job.title}
                </h4>
              </div>

              {/* Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 px-3 bg-white/5 rounded-lg border border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Daily Wage Rate</span>
                  <span className="font-mono font-bold text-blue-300 text-sm">
                    ₹{job.dailyWage}/day
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Headcount Needed</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> {job.workersNeeded} Workers
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Work Duration</span>
                  <span className="font-bold text-white flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.durationDays} Days
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {job.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {job.locationArea}, {job.city}
                </span>
                <span className="font-mono">{job.postedTimeAgo}</span>
              </div>
            </div>

            {/* Contractor Contact Footer */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Posted By Contractor:</span>
                <span className="text-xs font-bold text-white">{job.contractorName}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCallContractor(job.contractorPhone, job.contractorName)}
                  className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Contractor</span>
                </button>

                <button
                  onClick={() => onWhatsappContractor(job.contractorPhone, job.contractorName, job.title)}
                  className="py-2 px-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white text-green-500" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* POST PASS WORK MODAL */}
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
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white">
                    Post Sub-Contract / Pass Work
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Requirement Title (e.g. Need 5 Helpers for RCC Slab)
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Urgent 4 Masons for Lintel Plaster"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contractor Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      placeholder="e.g. Sharma Constructions"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={contractorPhone}
                      onChange={(e) => setContractorPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Trade Required
                    </label>
                    <select
                      value={tradeRequired}
                      onChange={(e) => setTradeRequired(e.target.value as TradeCategory)}
                      className="w-full px-2 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="mason">Mason</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="painter">Painter</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="helper">Helper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Workers Needed
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={workersNeeded}
                      onChange={(e) => setWorkersNeeded(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Daily Wage (₹)
                    </label>
                    <input
                      type="number"
                      min={300}
                      max={5000}
                      value={dailyWage}
                      onChange={(e) => setDailyWage(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Area / Site Address
                    </label>
                    <input
                      type="text"
                      value={locationArea}
                      onChange={(e) => setLocationArea(e.target.value)}
                      placeholder="e.g. Thane West Site 4B"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Description & Site Facilities
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details about work, tea/food provided, cash/UPI payment terms..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <label className="flex items-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Mark as Urgent Requirement 🚨
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-sm transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Publish Requirement to Board 📋</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
