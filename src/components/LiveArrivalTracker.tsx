import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  AlertCircle, 
  Sparkles, 
  Play, 
  Pause, 
  FastForward, 
  Copy, 
  Check, 
  Phone, 
  MessageSquare,
  Compass,
  Zap,
  Timer,
  ExternalLink,
  MapPinOff,
  User
} from 'lucide-react';
import { DirectBooking, WorkerProfile, Language } from '../types';
import { getCategoryLabel } from '../data/translations';

interface LiveArrivalTrackerProps {
  booking: DirectBooking;
  worker: WorkerProfile;
  currentLanguage: Language;
  onUpdateBooking: (updated: DirectBooking) => void;
  onCallClick: (worker: WorkerProfile) => void;
  onChatClick: (workerId: string) => void;
  onFinishService?: (booking: DirectBooking) => void;
}

// Route waypoint coordinates on an SVG canvas (viewBox 0 0 500 280)
const ROUTE_POINTS = [
  { x: 45, y: 55, label: 'Workshop' },
  { x: 120, y: 55, label: 'Main Link Rd' },
  { x: 185, y: 110, label: 'Metro Junction' },
  { x: 260, y: 110, label: 'Ring Road Flyover' },
  { x: 330, y: 180, label: 'Central Market' },
  { x: 395, y: 180, label: 'Sector 4 Avenue' },
  { x: 455, y: 225, label: 'Customer Site' }
];

// Helper to interpolate position along polyline
function getInterpolatedPoint(progressFraction: number) {
  const totalSegments = ROUTE_POINTS.length - 1;
  const targetIndex = progressFraction * totalSegments;
  const segmentIndex = Math.min(Math.floor(targetIndex), totalSegments - 1);
  const segmentFraction = targetIndex - segmentIndex;

  const p1 = ROUTE_POINTS[segmentIndex];
  const p2 = ROUTE_POINTS[segmentIndex + 1];

  const x = p1.x + (p2.x - p1.x) * segmentFraction;
  const y = p1.y + (p2.y - p1.y) * segmentFraction;

  // Calculate angle for vehicle heading
  const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const angleDeg = (angleRad * 180) / Math.PI;

  return { x, y, angle: angleDeg };
}

export const LiveArrivalTracker: React.FC<LiveArrivalTrackerProps> = ({
  booking,
  worker,
  currentLanguage,
  onUpdateBooking,
  onCallClick,
  onChatClick,
  onFinishService,
}) => {
  // Ensure we have a valid 4-digit OTP
  const otp = booking.startServiceOtp || '4829';
  const isStarted = booking.status === 'work_started' || booking.status === 'completed';

  // Live progress simulation state
  const [progress, setProgress] = useState(booking.arrivalProgressPercent ?? (isStarted ? 100 : 35));
  const [isSimulating, setIsSimulating] = useState(!isStarted && progress < 100);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Worker OTP entry state
  const [showOtpVerificationInput, setShowOtpVerificationInput] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [activeRolePerspective, setActiveRolePerspective] = useState<'customer' | 'worker'>('customer');

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Work session timer (when service is started)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStarted) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted]);

  // Live progress simulation interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating && progress < 100 && !isStarted) {
      interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 3;
          if (next >= 100) {
            setIsSimulating(false);
            // Worker has arrived
            setShowOtpVerificationInput(true);
            return 100;
          }
          return next;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isSimulating, progress, isStarted]);

  // Sync back progress to booking when it changes significantly
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (booking.arrivalProgressPercent !== progress) {
      onUpdateBooking({
        ...booking,
        arrivalProgressPercent: progress,
        estimatedArrivalMins: Math.max(1, Math.round(15 * (1 - progress / 100)))
      });
    }
  }, [progress]);

  // Current interpolated coordinates on the map
  const currentCoord = getInterpolatedPoint(progress / 100);

  // Distance and ETA calculations
  const totalDistanceKm = 3.2;
  const remainingDistanceKm = Math.max(0.1, +(totalDistanceKm * (1 - progress / 100)).toFixed(1));
  const remainingMins = progress >= 100 ? 0 : Math.max(1, Math.round(15 * (1 - progress / 100)));

  // Dynamic milestone message based on progress
  const getMilestoneText = () => {
    if (progress >= 100) return 'Arrived at your doorstep! Waiting for OTP.';
    if (progress >= 85) return 'Approaching your society gate / building entrance.';
    if (progress >= 60) return 'Turned into Sector 4 Avenue. Smooth traffic.';
    if (progress >= 35) return 'Crossing Metro Junction flyover. Speed: 32 km/h.';
    return 'Dispatched from workshop, en route via Main Link Road.';
  };

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // OTP Input handler
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...enteredOtp];
    newOtp[index] = val.slice(-1);
    setEnteredOtp(newOtp);
    setOtpError(null);

    // Auto-focus next input
    if (val && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = enteredOtp.join('');
    if (code.length !== 4) {
      setOtpError('Please enter all 4 digits of the Start Service OTP.');
      return;
    }

    if (code !== otp) {
      setOtpError('Incorrect OTP. Please check the 4-digit code with the customer.');
      return;
    }

    // Success! Officially start the service
    setOtpSuccess(true);
    setOtpError(null);
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      onUpdateBooking({
        ...booking,
        status: 'work_started',
        otpVerified: true,
        serviceStartedAt: timeStr,
        arrivalProgressPercent: 100,
      });
      setShowOtpVerificationInput(false);
    }, 1200);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3.5">
      {/* Perspective Toggle (Customer vs Karigar verification testing) */}
      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <span className="text-[11px] font-bold text-slate-600 pl-1 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Test Flow Perspective:
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveRolePerspective('customer')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRolePerspective === 'customer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Customer View
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRolePerspective('worker');
              setShowOtpVerificationInput(true);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRolePerspective === 'worker'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Worker View (Enter OTP)
          </button>
        </div>
      </div>

      {/* Interactive Live Arrival Map Canvas */}
      <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
        {/* Map Header Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-extrabold text-white tracking-wide">
              {progress >= 100 ? 'Karigar Arrived' : 'Live GPS Tracking'}
            </span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-md flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              disabled={progress >= 100 || isStarted}
              className={`p-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                isSimulating ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={isSimulating ? 'Pause simulation' : 'Play live simulation'}
            >
              {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span className="text-[10px] hidden sm:inline">{isSimulating ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => {
                const next = Math.min(100, progress + 25);
                setProgress(next);
                if (next >= 100) {
                  setIsSimulating(false);
                  setShowOtpVerificationInput(true);
                }
              }}
              disabled={progress >= 100 || isStarted}
              className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
              title="Step forward +25%"
            >
              <FastForward className="w-3 h-3 text-blue-400" />
              <span>Step +25%</span>
            </button>
          </div>
        </div>

        {/* Vector SVG Map */}
        <div className="relative w-full h-[220px] sm:h-[240px] bg-slate-900 select-none">
          <svg viewBox="0 0 500 280" className="w-full h-full">
            <defs>
              {/* City Map Grid Background Pattern */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>

              {/* Glowing gradients */}
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>

              {/* Pulse shadow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Grid */}
            <rect width="500" height="280" fill="#0f172a" />
            <rect width="500" height="280" fill="url(#grid)" />

            {/* Background City Blocks & Parks */}
            <rect x="50" y="80" width="80" height="60" rx="6" fill="#1e293b" opacity="0.5" />
            <rect x="150" y="140" width="110" height="80" rx="8" fill="#14532d" opacity="0.3" />
            <text x="180" y="185" fill="#86efac" fontSize="9" fontWeight="600" opacity="0.6">City Park</text>

            <rect x="230" y="30" width="90" height="50" rx="6" fill="#1e293b" opacity="0.5" />
            <rect x="350" y="60" width="90" height="80" rx="6" fill="#1e293b" opacity="0.5" />

            {/* Secondary Street Arteries */}
            <path d="M 0 55 L 500 55" stroke="#334155" strokeWidth="8" opacity="0.4" />
            <path d="M 0 110 L 500 110" stroke="#334155" strokeWidth="8" opacity="0.4" />
            <path d="M 0 180 L 500 180" stroke="#334155" strokeWidth="8" opacity="0.4" />
            <path d="M 0 225 L 500 225" stroke="#334155" strokeWidth="8" opacity="0.4" />
            <path d="M 120 0 L 120 280" stroke="#334155" strokeWidth="8" opacity="0.4" />
            <path d="M 260 0 L 260 280" stroke="#334155" strokeWidth="8" opacity="0.4" />
            <path d="M 395 0 L 395 280" stroke="#334155" strokeWidth="8" opacity="0.4" />

            {/* Street Names */}
            <text x="15" y="48" fill="#64748b" fontSize="8" fontWeight="600">Main Link Rd</text>
            <text x="270" y="104" fill="#64748b" fontSize="8" fontWeight="600">Metro Corridor</text>
            <text x="340" y="174" fill="#64748b" fontSize="8" fontWeight="600">Sector 4 Avenue</text>
            <text x="380" y="242" fill="#64748b" fontSize="8" fontWeight="600">Sunshine Colony</text>

            {/* Full Route Path Outline */}
            <path
              d={`M ${ROUTE_POINTS.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke="#0f766e"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />

            {/* Active Moving Route with Flowing Dash Animation */}
            <path
              d={`M ${ROUTE_POINTS.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 6"
              className="animate-pulse"
              filter="url(#glow)"
            />

            {/* Traveled Path (Solid Emerald) */}
            <path
              d={`M ${ROUTE_POINTS[0].x} ${ROUTE_POINTS[0].y} L ${currentCoord.x} ${currentCoord.y}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Origin Point (Workshop Hub) */}
            <circle cx={ROUTE_POINTS[0].x} cy={ROUTE_POINTS[0].y} r="5" fill="#64748b" />
            <text x={ROUTE_POINTS[0].x - 15} y={ROUTE_POINTS[0].y - 10} fill="#94a3b8" fontSize="8" fontWeight="600">
              Workshop
            </text>

            {/* Destination Point (Customer Home Pin) */}
            <g transform={`translate(${ROUTE_POINTS[ROUTE_POINTS.length - 1].x}, ${ROUTE_POINTS[ROUTE_POINTS.length - 1].y})`}>
              {/* Pulsing Target Waves */}
              <circle cx="0" cy="0" r="18" fill="#3b82f6" opacity="0.25" className="animate-ping" />
              <circle cx="0" cy="0" r="10" fill="#2563eb" opacity="0.4" />
              <circle cx="0" cy="0" r="6" fill="#60a5fa" />
              <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            </g>
            <text 
              x={ROUTE_POINTS[ROUTE_POINTS.length - 1].x - 45} 
              y={ROUTE_POINTS[ROUTE_POINTS.length - 1].y + 20} 
              fill="#93c5fd" 
              fontSize="9" 
              fontWeight="bold"
            >
              📍 Your Home Gate
            </text>

            {/* Moving Karigar Vehicle Marker */}
            <g transform={`translate(${currentCoord.x}, ${currentCoord.y})`}>
              {/* Radar pulse around worker */}
              <circle cx="0" cy="0" r="16" fill="#10b981" opacity="0.3" className="animate-ping" />
              <circle cx="0" cy="0" r="11" fill="#047857" stroke="#34d399" strokeWidth="2" />
              
              {/* Direction Indicator */}
              <g transform={`rotate(${currentCoord.angle})`}>
                <polygon points="0,-13 4,-8 -4,-8" fill="#34d399" />
              </g>

              {/* Bike / Worker Icon Symbol */}
              <text x="-4" y="4" fontSize="10">🛵</text>
            </g>

            {/* Moving Label Tag above Karigar */}
            <g transform={`translate(${Math.max(40, Math.min(440, currentCoord.x))}, ${Math.max(22, currentCoord.y - 20)})`}>
              <rect x="-42" y="-12" width="84" height="18" rx="6" fill="#022c22" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="1" fill="#6ee7b7" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                {worker.name.split(' ')[0]} ({progress}%)
              </text>
            </g>
          </svg>
        </div>

        {/* Live Telemetry Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 grid grid-cols-3 divide-x divide-slate-800 text-center text-white">
          <div className="px-1">
            <span className="text-[10px] text-slate-400 block font-medium">Estimated Arrival</span>
            <span className="text-sm sm:text-base font-black text-amber-400">
              {progress >= 100 ? 'At Doorstep' : `${remainingMins} Mins`}
            </span>
          </div>
          <div className="px-1">
            <span className="text-[10px] text-slate-400 block font-medium">Distance Left</span>
            <span className="text-sm sm:text-base font-black text-emerald-400">
              {progress >= 100 ? '0.0 km' : `${remainingDistanceKm} km`}
            </span>
          </div>
          <div className="px-1">
            <span className="text-[10px] text-slate-400 block font-medium">Transit Speed</span>
            <span className="text-sm sm:text-base font-black text-blue-400">
              {progress >= 100 ? '0 km/h' : '28 km/h'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Milestone Status Alert */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          {progress >= 100 ? <CheckCircle2 className="w-4 h-4" /> : <Navigation className="w-4 h-4 animate-spin" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
              {progress >= 100 ? 'Karigar Reached Site' : 'En-Route Update'}
            </h4>
            <span className="text-[10px] font-mono text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
              GPS Verified
            </span>
          </div>
          <p className="text-xs text-emerald-900 font-medium mt-0.5">
            {getMilestoneText()}
          </p>
        </div>
      </div>

      {/* SECURE START SERVICE OTP / CODE VERIFICATION MODULE */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-700/80 rounded-2xl p-4 text-white space-y-3.5 shadow-xl relative overflow-hidden">
        {/* Anti-Bypass Security Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-400/30">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                Start Service Verification Code
              </h4>
              <p className="text-[10px] text-slate-400">Anti-Bypass Protection • 30-Day Platform Warranty</p>
            </div>
          </div>

          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
            isStarted 
              ? 'bg-emerald-500 text-slate-950' 
              : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
          }`}>
            {isStarted ? '✓ JOB STARTED' : 'WAITING FOR OTP'}
          </span>
        </div>

        {/* State A: Job already started with active work timer */}
        {isStarted ? (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl space-y-3 text-center shadow-lg">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider">Service In-Progress at Doorstep</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              OTP verified with <strong>{worker.name}</strong> at <strong>{booking.serviceStartedAt || 'Doorstep'}</strong>.
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-emerald-500/40 shadow-inner">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 font-medium">Work Session Active:</span>
              <span className="text-sm font-mono font-black text-emerald-300">{formatTimer(elapsedSeconds)}</span>
            </div>

            {/* Customer Finish Service Action */}
            {onFinishService && (
              <div className="pt-2 border-t border-emerald-500/30 space-y-1.5">
                <button
                  type="button"
                  onClick={() => onFinishService(booking)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Finish Service (काम पूरा हुआ)</span>
                </button>
                <p className="text-[10px] text-slate-400">
                  The booking stays marked <strong>In-Progress</strong> until you click "Finish Service".
                </p>
              </div>
            )}
          </div>
        ) : (
          /* State B: Customer View or Worker Verification View */
          <div className="space-y-3">
            {/* Customer Display Card */}
            {activeRolePerspective === 'customer' ? (
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    Your Secret 4-Digit Doorstep Code:
                  </span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                    Customer Security
                  </span>
                </div>

                {/* Big Display Digits */}
                <div className="flex items-center justify-center gap-2.5 py-1">
                  {otp.split('').map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-14 bg-slate-950 border-2 border-amber-400/60 rounded-xl flex items-center justify-center text-2xl font-black text-amber-300 tracking-wider shadow-inner font-mono"
                    >
                      {digit}
                    </div>
                  ))}
                </div>

                {/* Instructions and Copy Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleCopyOtp}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOtp ? 'Copied Code' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveRolePerspective('worker');
                      setShowOtpVerificationInput(true);
                    }}
                    className="text-[11px] font-extrabold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Karigar arrived? Enter OTP &rarr;
                  </button>
                </div>

                {/* Security Guidance Pill */}
                <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-lg text-[10px] text-amber-200/90 leading-relaxed flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>DO NOT SHARE OVER PHONE OR CHAT.</strong> Hand over this code only when <strong>{worker.name}</strong> is physically present at your home/site.
                  </span>
                </div>
              </div>
            ) : (
              /* Worker Enters OTP Mode & Two-Way Location View */
              <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-emerald-500/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-emerald-300">
                      Karigar View: Customer Work Location & Navigation
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRolePerspective('customer')}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Switch to Customer View
                  </button>
                </div>

                {/* Customer Pickup / Work Location Card */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Customer Work Location
                        </span>
                        <p className="text-xs font-extrabold text-white leading-snug">
                          {booking.address || 'Doorstep Service Address'}
                        </p>
                        {booking.notes && (
                          <p className="text-[11px] text-amber-300/90 mt-0.5">
                            📍 Landmark / Notes: {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Contact & Masked Telemetry */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold">{booking.customerName || 'Customer'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        (Ext #{booking.customerPhone ? booking.customerPhone.slice(-4) : '2819'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onCallClick(worker)}
                        className="p-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChatClick(worker.id)}
                        className="p-1 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Chat Customer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Worker Turn-by-Turn Navigation Link */}
                <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      Route Navigation
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-black">
                      {remainingDistanceKm} km • ~{remainingMins} mins
                    </span>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.address || 'Doorstep Service Site')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer no-underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Start Turn-by-Turn Navigation</span>
                  </a>
                </div>

                <div className="pt-1">
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    Once at the customer's doorstep, enter their 4-digit secret code to begin service:
                  </p>

                  {/* 4-Box Pin Input */}
                  <div className="flex justify-center gap-2.5 py-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        ref={inputRefs[idx]}
                        type="text"
                        maxLength={1}
                        value={enteredOtp[idx]}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-xl font-mono font-black bg-slate-950 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-400 transition-all shadow-inner"
                      />
                    ))}
                  </div>

                  {/* Error message */}
                  {otpError && (
                    <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded-lg text-[10px] text-rose-300 flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {/* Success celebration */}
                  {otpSuccess && (
                    <div className="p-2 bg-emerald-950/80 border border-emerald-500/60 rounded-lg text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5 animate-bounce mt-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>OTP Verified! Service Started Officially.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEnteredOtp(otp.split(''));
                        setOtpError(null);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700 cursor-pointer"
                    >
                      ⚡ Auto-Fill Code ({otp})
                    </button>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpSuccess}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Code & Start Job</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick In-App Communication Footer */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-500 block">Need gate directions or parking help?</span>
          <span className="text-xs font-extrabold text-slate-800 truncate block">Contact {worker.name}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onCallClick(worker)}
            className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
            title="In-App Masked Call"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </button>

          <button
            onClick={() => onChatClick(worker.id)}
            className="py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
            title="In-App Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
