import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Phone, 
  KeyRound, 
  UserCheck, 
  Camera, 
  CheckCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../data/translations';

interface VerificationFlowProps {
  currentLanguage: Language;
  onVerificationComplete: (userData: {
    name: string;
    phone: string;
    photoUrl: string;
    verified: boolean;
  }) => void;
}

export const VerificationFlow: React.FC<VerificationFlowProps> = ({
  currentLanguage,
  onVerificationComplete,
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'aadhaar' | 'camera' | 'success'>('phone');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-fill sample phone or OTP for quick testing
  const handleQuickFillDemo = () => {
    setPhone('9876543210');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length >= 10) {
      setStep('otp');
      // Set dummy OTP
      setOtp(['1', '2', '3', '4', '5', '6']);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length === 6) {
      setStep('aadhaar');
    }
  };

  const handleAadhaarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length >= 3) {
      setStep('camera');
      startCamera();
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } else {
        setCameraError('Camera API not accessible on this device. You can use fallback photo snapshot.');
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera permission not granted or unavailable. Using instant profile capture.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const snapPhoto = () => {
    if (videoRef.current && isCameraActive) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 400;
      canvas.height = videoRef.current.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhotoUrl(dataUrl);
        stopCamera();
      }
    } else {
      // Fallback sample avatar photo
      useSamplePhoto();
    }
  };

  const useSamplePhoto = () => {
    stopCamera();
    // Default avatar
    setPhotoUrl('https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80');
  };

  const retakePhoto = () => {
    setPhotoUrl('');
    startCamera();
  };

  const handleCompleteVerification = () => {
    setStep('success');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      onVerificationComplete({
        name: fullName || 'Verified Karigar',
        phone: phone || '+91 98765 43210',
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
        verified: true,
      });
    }, 1800);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-[580px] w-full bg-slate-50 text-slate-800 p-5 flex flex-col justify-between rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Progress Dots */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 text-xs">
        <span className="font-bold text-blue-700 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> Karigar Registration KYC
        </span>
        <div className="flex items-center gap-1.5">
          {['phone', 'otp', 'aadhaar', 'camera', 'success'].map((st, idx) => (
            <div
              key={st}
              className={`h-2 rounded-full transition-all ${
                st === step
                  ? 'w-6 bg-blue-600'
                  : ['phone', 'otp', 'aadhaar', 'camera', 'success'].indexOf(step) > idx
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: PHONE NUMBER */}
        {step === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center border border-blue-100 shadow-sm">
                <Phone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('phoneLoginTitle', currentLanguage)}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                We will send a 6-digit OTP code to verify your mobile number.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10 Digits)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-blue-700">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-mono text-slate-900 tracking-wider focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="text-xs text-blue-700 font-bold underline hover:text-blue-800"
              >
                ⚡ Click to auto-fill demo number (9876543210)
              </button>

              <button
                type="submit"
                disabled={phone.length < 10}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{t('sendOtpBtn', currentLanguage)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: OTP ENTRY */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center border border-blue-100 shadow-sm">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('enterOtpTitle', currentLanguage)}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Sent to +91 {phone || '9876543210'}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[idx] = e.target.value;
                      setOtp(newOtp);
                    }}
                    className="w-11 h-12 text-center text-xl font-bold font-mono bg-white border border-slate-200 rounded-xl text-blue-700 focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                ))}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs text-blue-900 font-medium">
                Demo Code Auto-Filled: <span className="font-mono font-bold text-blue-700">123456</span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>{t('verifyOtpBtn', currentLanguage)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 3: AADHAAR FULL NAME */}
        {step === 'aadhaar' && (
          <motion.div
            key="aadhaar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center border border-blue-100 shadow-sm">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {t('aadhaarNameTitle', currentLanguage)}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Ensures genuine trust & 'Verified Karigar' badge on your profile.
              </p>
            </div>

            <form onSubmit={handleAadhaarSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (पूरा नाम)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Sharma"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 shadow-sm text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aadhaar Card Last 4 Digits (Optional)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={aadhaarLast4}
                  onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="XXXX 4321"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-sm text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={fullName.trim().length < 3}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2 text-sm"
              >
                <span>Proceed to Live Photo Capture 📸</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 4: LIVE CAMERA PHOTO */}
        {step === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3 my-auto flex flex-col items-center"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                {t('cameraSelfieTitle', currentLanguage)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Take a clear front-facing photo for your Verified Karigar card
              </p>
            </div>

            {/* Camera Viewport or Preview */}
            <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-blue-600 bg-slate-100 shadow-md flex items-center justify-center my-2">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {!photoUrl && !isCameraActive && (
                <div className="p-4 text-center">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto mb-1 animate-pulse" />
                  <p className="text-xs text-slate-500 font-medium">
                    Initializing Camera...
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-center text-xs text-orange-900 max-w-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-orange-600" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Photo Action Buttons */}
            <div className="w-full max-w-xs space-y-2 pt-2">
              {!photoUrl ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={snapPhoto}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <span>{t('clickPhotoBtn', currentLanguage)}</span>
                  </button>
                  <button
                    onClick={useSamplePhoto}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200"
                  >
                    Use Sample Verified Photo 📸
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleCompleteVerification}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirm & Get Badge ✅</span>
                  </button>
                  <button
                    onClick={retakePhoto}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('retakePhotoBtn', currentLanguage)}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 5: SUCCESS BADGE DISPLAY */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center my-auto space-y-4 py-6"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-white rounded-full border-4 border-emerald-500 p-1 flex items-center justify-center shadow-md">
                <img
                  src={photoUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'}
                  alt="Verified Profile"
                  className="w-full h-full rounded-full object-cover"
                />
                <BadgeCheck className="w-8 h-8 text-emerald-600 bg-white rounded-full absolute -bottom-1 -right-1 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {fullName || 'Verified Karigar'}
              </h3>
              <p className="text-xs text-green-700 font-bold mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-green-600" /> {t('verifiedBadgeText', currentLanguage)}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-medium max-w-xs mx-auto shadow-sm">
              Aadhaar Verified ID • Direct Customer Access Ready
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
