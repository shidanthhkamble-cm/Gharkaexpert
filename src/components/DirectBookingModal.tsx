import React, { useState, useRef } from 'react';
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
  User,
  Navigation,
  Compass,
  Crosshair,
  Layers
} from 'lucide-react';
import { WorkerProfile, DirectBooking, Language } from '../types';
import { t, getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';
import { deviceLocationService } from '../services/capacitorDeviceService';

interface DirectBookingModalProps {
  worker: WorkerProfile | null;
  currentLanguage: Language;
  onClose: () => void;
  onConfirmBooking: (booking: DirectBooking) => void;
}

// Preset neighborhood centers for realistic Indian city geolocations
const LOCATION_PRESETS: { [key: string]: { name: string; lat: number; lng: number } } = {
  mumbai: { name: 'Andheri West / Lokhandwala, Mumbai', lat: 19.1363, lng: 72.8277 },
  pune: { name: 'Kothrud / Karve Road, Pune', lat: 18.5074, lng: 73.8077 },
  delhi: { name: 'Sector 62, Noida / Delhi NCR', lat: 28.6280, lng: 77.3649 },
  hyderabad: { name: 'Madhapur / Hitec City, Hyderabad', lat: 17.4483, lng: 78.3915 },
  bangalore: { name: 'Koramangala 4th Block, Bengaluru', lat: 12.9352, lng: 77.6245 }
};

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
  const [address, setAddress] = useState('Flat 402, Sunshine Heights, Main Road');
  const [isEmergency, setIsEmergency] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Interactive Map Pinning State (drag/drop pin on canvas)
  const defaultCityKey = worker?.city.toLowerCase().includes('pune')
    ? 'pune'
    : worker?.city.toLowerCase().includes('hyderabad')
    ? 'hyderabad'
    : worker?.city.toLowerCase().includes('delhi')
    ? 'delhi'
    : 'mumbai';

  const initialPreset = LOCATION_PRESETS[defaultCityKey] || LOCATION_PRESETS.mumbai;

  // Pin normalized position on interactive map box (percentage 0-100)
  const [pinPos, setPinPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialPreset.lat,
    lng: initialPreset.lng
  });
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  if (!worker) return null;

  // Handle map click or drag to update pin and calculate precise coordinates
  const updatePinFromEvent = (clientX: number, clientY: number) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clampedX = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
    const clampedY = Math.max(12, Math.min(88, ((clientY - rect.top) / rect.height) * 100));

    setPinPos({ x: clampedX, y: clampedY });

    // Derive slight offset from base city coordinates for realistic lat/lng
    const latOffset = ((50 - clampedY) / 100) * 0.04;
    const lngOffset = ((clampedX - 50) / 100) * 0.04;
    const newLat = +(initialPreset.lat + latOffset).toFixed(6);
    const newLng = +(initialPreset.lng + lngOffset).toFixed(6);

    setPinnedCoords({ lat: newLat, lng: newLng });
  };

  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingPin(true);
    updatePinFromEvent(e.clientX, e.clientY);
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingPin) {
      updatePinFromEvent(e.clientX, e.clientY);
    }
  };

  const handleMapMouseUp = () => {
    setIsDraggingPin(false);
  };

  const handleMapTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      updatePinFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Device Geolocation Handshake via @capacitor/geolocation with fallback
  const handleGetCurrentLocation = async () => {
    setIsLocatingGps(true);
    try {
      const pos = await deviceLocationService.getCurrentPosition();
      setPinnedCoords({ lat: pos.latitude, lng: pos.longitude });
      setPinPos({ x: 50, y: 50 });
      setAddress(prev => prev || `Doorstep Location (GPS: ${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`);
    } catch {
      setPinnedCoords({ lat: initialPreset.lat, lng: initialPreset.lng });
    } finally {
      setIsLocatingGps(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    // Generate 4-digit doorstep code
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

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
      pinnedLat: pinnedCoords.lat,
      pinnedLng: pinnedCoords.lng,
      isEmergency,
      notes,
      status: 'accepted',
      startServiceOtp: generatedOtp,
      startWorkCode: generatedOtp,
      otpVerified: false,
      arrivalProgressPercent: 15,
      estimatedArrivalMins: 12,
      currentDistanceKm: 2.8,
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-800 space-y-4 shadow-xl my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
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
            className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors cursor-pointer"
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
              We have dispatched a secure in-app booking alert to {worker.name} (Ext #{worker.id.replace('worker-', '')}) with your pinned site coordinates. All communications, OTP confirmation, and warranty protection remain strictly inside GharKaExpert.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Anand Kulkarni"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Date & Shift */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Date *
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600 text-xs"
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

            {/* INTERACTIVE MAP LOCATION PINNING (DRAG & DROP PIN) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Interactive Map Pinning (Drag pin to exact doorstep)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLocatingGps}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200"
                >
                  <Crosshair className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGps ? 'Locating...' : 'Use My GPS'}</span>
                </button>
              </div>

              {/* Interactive Vector Map Canvas with Drag/Drop Pin */}
              <div
                ref={mapContainerRef}
                onMouseDown={handleMapMouseDown}
                onMouseMove={handleMapMouseMove}
                onMouseUp={handleMapMouseUp}
                onTouchMove={handleMapTouchMove}
                className="relative w-full h-44 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 shadow-inner select-none cursor-crosshair group"
              >
                {/* Visual City Grid Map SVG */}
                <svg viewBox="0 0 400 200" className="w-full h-full pointer-events-none">
                  <defs>
                    <pattern id="modalMapGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#334155" strokeWidth="0.75" />
                    </pattern>
                  </defs>
                  <rect width="400" height="200" fill="#0f172a" />
                  <rect width="400" height="200" fill="url(#modalMapGrid)" />

                  {/* City Landmarks & Roads */}
                  <rect x="40" y="30" width="70" height="45" rx="4" fill="#1e293b" opacity="0.6" />
                  <rect x="130" y="110" width="90" height="60" rx="6" fill="#14532d" opacity="0.3" />
                  <rect x="250" y="40" width="80" height="50" rx="4" fill="#1e293b" opacity="0.6" />

                  {/* Main Arterial Roads */}
                  <path d="M 0 80 L 400 80" stroke="#475569" strokeWidth="10" opacity="0.5" />
                  <path d="M 0 140 L 400 140" stroke="#475569" strokeWidth="8" opacity="0.4" />
                  <path d="M 120 0 L 120 200" stroke="#475569" strokeWidth="10" opacity="0.5" />
                  <path d="M 280 0 L 280 200" stroke="#475569" strokeWidth="8" opacity="0.4" />

                  {/* Road Names */}
                  <text x="10" y="74" fill="#94a3b8" fontSize="8" fontWeight="bold">Main Link Expressway</text>
                  <text x="290" y="30" fill="#94a3b8" fontSize="8" fontWeight="bold">Sector 4 Cross</text>
                  <text x="140" y="145" fill="#86efac" fontSize="8" fontWeight="bold" opacity="0.8">Community Park</text>

                  {/* 1.5km Service Radius Circle */}
                  <circle cx="200" cy="100" r="75" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                </svg>

                {/* Draggable/Placeable Map Pin */}
                <div
                  style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-75 flex flex-col items-center"
                >
                  <div className="bg-slate-900 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-md border border-slate-700 whitespace-nowrap mb-0.5">
                    📍 Drop Here
                  </div>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-rose-500/30 animate-ping absolute -inset-0.5" />
                    <MapPin className="w-7 h-7 text-rose-600 fill-rose-600 filter drop-shadow-md relative z-10" />
                  </div>
                </div>

                {/* Live Pinned Coordinates Badge */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <div className="bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-300 font-mono flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Lat: {pinnedCoords.lat.toFixed(4)}, Lng: {pinnedCoords.lng.toFixed(4)}</span>
                  </div>
                  <span className="bg-slate-900/90 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700">
                    Click/Drag to Reposition
                  </span>
                </div>
              </div>
            </div>

            {/* Address Text Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Address (स्थानिक पत्ता) *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat No, Building, Landmark, City..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 text-xs sm:text-sm"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
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
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Booking Request (With Pinned GPS) 📅</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

