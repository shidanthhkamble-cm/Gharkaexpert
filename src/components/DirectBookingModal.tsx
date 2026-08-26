import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  ShieldAlert, 
  Send,
  BadgeCheck,
  User
} from 'lucide-react';
import { WorkerProfile, DirectBooking, Language } from '../types';
import { t, getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface DirectBookingModalProps {
  worker: WorkerProfile | null;
  currentLanguage: Language;
  onClose: () => void;
  onConfirmBooking: (booking: DirectBooking) => void;
}

export const DirectBookingModal: React.FC<DirectBookingModalProps> = ({
  worker,
  currentLanguage,
  onClose,
  onConfirmBooking,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-08-05');
  const [timeSlot, setTimeSlot] = useState('09:00 AM (Morning Shift)');
  const [address, setAddress] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!worker) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    const newBooking: DirectBooking = {
      id: `b-${Date.now()}`,
      customerName,
      customerPhone,
      workerId: worker.id,
      workerName: worker.name,
      trade: worker.primaryTrade,
      bookingDate,
      timeSlot,
      address: address || 'Site Address Provided',
      isEmergency,
      notes,
      status: 'accepted',
      createdAt: new Date().toISOString(),
    };

    setSubmitted(true);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

    setTimeout(() => {
      onConfirmBooking(newBooking);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 text-slate-800 space-y-4 shadow-xl my-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 p-0.5 shrink-0 shadow-2xs">
              <img
                src={getCategory3DIcon(worker.primaryTrade)}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Book Verified Karigar
              </h3>
              <p className="text-xs text-blue-700 font-bold flex items-center gap-1">
                <span>{worker.name}</span>
                <span>•</span>
                <span>{getCategoryLabel(worker.primaryTrade, currentLanguage)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Booking Confirmed! ✅
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              We have sent a SMS alert to {worker.name} (+91 {worker.phone}). You will receive a direct confirmation call shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Anand Kulkarni"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Date & Shift */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift / Time Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
                >
                  <option>09:00 AM (Morning Shift)</option>
                  <option>01:00 PM (Afternoon Shift)</option>
                  <option>Immediate Emergency Callout</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Address (स्थानिक पत्ता)
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat No, Building, Landmark, City..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Details / Requirements
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify requirements e.g., 200 sq.ft tile fitting, bathroom leak repair..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Emergency Work Flag */}
            <label className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded bg-white border-slate-300 focus:ring-orange-500"
              />
              <span className="text-xs font-bold text-red-900 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                🚨 Require Emergency Immediate Arrival (Within 1 Hour)
              </span>
            </label>

            {/* Pricing Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Daily Wage Rate:</span>
                <span className="text-sm font-bold text-blue-700 font-mono">
                  ₹{worker.dailyRate} / day
                </span>
              </div>
              <span className="text-[11px] text-green-700 font-bold bg-green-100 px-2.5 py-1 rounded-lg border border-green-200">
                Zero Commission • Pay Directly
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send Booking Request 📅</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
