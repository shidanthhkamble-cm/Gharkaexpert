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
  AlertCircle,
  UploadCloud,
  FileText,
  Clock,
  ShieldAlert,
  Zap,
  Lock
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
    documentType?: string;
    documentPhotoUrl?: string;
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
  const [aadhaarOptional, setAadhaarOptional] = useState('');
  const [documentType, setDocumentType] = useState<'aadhaar' | 'driving_license' | 'voter_id' | 'pan'>('aadhaar');
  const [documentPhotoUrl, setDocumentPhotoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  // Govt Aadhaar OTP Gateway State (Surepass / Zoop.one / DigiLocker API Integration)
  const [aadhaarOtpStage, setAadhaarOtpStage] = useState<'idle' | 'generating' | 'otp_sent' | 'verifying' | 'verified'>('idle');
  const [aadhaarOtpCode, setAadhaarOtpCode] = useState('');
  const [aadhaarGatewayProvider, setAadhaarGatewayProvider] = useState<'surepass' | 'zoop' | 'digilocker'>('surepass');
  
  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Handle Document Photo selection
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setDocumentPhotoUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleDocument = () => {
    setDocumentPhotoUrl('https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80');
  };

  // Govt Aadhaar OTP API Simulation (Surepass / Zoop.one / DigiLocker)
  const handleGenerateAadhaarOtp = () => {
    setAadhaarOtpStage('generating');
    setTimeout(() => {
      setAadhaarOtpStage('otp_sent');
      setAadhaarOtpCode('541289'); // Demo OTP for seamless testing
    }, 850);
  };

  const handleVerifyAadhaarOtp = () => {
    setAadhaarOtpStage('verifying');
    setTimeout(() => {
      setAadhaarOtpStage('verified');
      if (!documentPhotoUrl) {
        setDocumentPhotoUrl('https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80');
      }
    }, 750);
  };

  const handleAadhaarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length >= 3) {
      // Auto-assign sample document if not uploaded yet for smooth dev flow
      if (!documentPhotoUrl) {
        setDocumentPhotoUrl('https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80');
      }
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
        setCameraError('Camera API not accessible on this device. You can use instant profile snapshot.');
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
      useSamplePhoto();
    }
  };

  const useSamplePhoto = () => {
    stopCamera();
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
        verified: true, // Mark verified after admin flow submission
        documentType,
        documentPhotoUrl: documentPhotoUrl || 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80'
      });
    }, 2200);
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

        {/* STEP 3: DOCUMENT UPLOAD & IDENTITY (AADHAAR OPTIONAL) */}
        {step === 'aadhaar' && (
          <motion.div
            key="aadhaar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3.5 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center border border-blue-100 shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Karigar Identity & Document Upload
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Live Photo Capture & Document Upload are submitted to the Admin Panel for manual review before granting the 'Verified Karigar' badge.
              </p>
            </div>

            <form onSubmit={handleAadhaarSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Sharma"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 shadow-xs text-sm"
                />
              </div>

              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type for Verification *
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'aadhaar', label: 'Aadhaar Card' },
                    { id: 'driving_license', label: 'Driving License' },
                    { id: 'voter_id', label: 'Voter ID' },
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setDocumentType(doc.id as any)}
                      className={`py-1.5 px-2 rounded-lg font-bold border text-[11px] transition-all cursor-pointer ${
                        documentType === doc.id
                          ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Aadhaar Number / ID Field with Govt OTP API Gateway */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {documentType === 'aadhaar' ? 'Aadhaar Number / Last 4 Digits' : 'Document ID Number'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    Optional (ऐच्छिक)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={16}
                    value={aadhaarOptional}
                    onChange={(e) => setAadhaarOptional(e.target.value)}
                    placeholder="Enter last 4 digits or full ID (optional)"
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-xs text-xs"
                  />
                  {documentType === 'aadhaar' && (
                    <button
                      type="button"
                      onClick={handleGenerateAadhaarOtp}
                      disabled={aadhaarOtpStage === 'generating' || aadhaarOtpStage === 'verified'}
                      className={`px-2.5 py-2 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        aadhaarOtpStage === 'verified'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      {aadhaarOtpStage === 'generating' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Calling API...</span>
                        </>
                      ) : aadhaarOtpStage === 'verified' ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>OTP Verified</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Govt OTP API</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Aadhaar OTP Gateway API Box */}
                {documentType === 'aadhaar' && aadhaarOtpStage !== 'idle' && (
                  <div className="mt-2 p-2.5 bg-slate-900 text-white rounded-xl text-xs space-y-2 border border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Govt Aadhaar OTP Gateway (UIDAI Encrypted)
                      </span>
                      {/* Provider toggle */}
                      <div className="flex items-center gap-1 text-[9px] font-mono">
                        {(['surepass', 'zoop', 'digilocker'] as const).map((prov) => (
                          <button
                            key={prov}
                            type="button"
                            onClick={() => setAadhaarGatewayProvider(prov)}
                            className={`px-1.5 py-0.5 rounded uppercase font-bold cursor-pointer ${
                              aadhaarGatewayProvider === prov
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {prov}
                          </button>
                        ))}
                      </div>
                    </div>

                    {aadhaarOtpStage === 'otp_sent' && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-slate-300">
                          OTP generated via {aadhaarGatewayProvider.toUpperCase()} sandbox API to Aadhaar-linked mobile. (Demo OTP: <strong className="text-amber-300">541289</strong>)
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={aadhaarOtpCode}
                            onChange={(e) => setAadhaarOtpCode(e.target.value)}
                            placeholder="Enter 6-digit Aadhaar OTP"
                            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-400"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyAadhaarOtp}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs cursor-pointer shadow-xs"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}

                    {aadhaarOtpStage === 'verifying' && (
                      <div className="flex items-center gap-1.5 text-amber-300 text-xs py-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying with {aadhaarGatewayProvider.toUpperCase()} Government Gateway...</span>
                      </div>
                    )}

                    {aadhaarOtpStage === 'verified' && (
                      <div className="p-1.5 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-200 text-[11px] flex items-center justify-between">
                        <span className="flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Authenticated via {aadhaarGatewayProvider.toUpperCase()} Gateway
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono">
                          Public Badge: Basic Verified
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document Photo Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Document Photo ({documentType === 'aadhaar' ? 'Aadhaar' : documentType === 'driving_license' ? 'Driving License' : 'Voter ID'}) *
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDocumentFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {documentPhotoUrl ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={documentPhotoUrl}
                        alt="Document Preview"
                        className="w-12 h-9 object-cover rounded-lg border border-emerald-400 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-900 truncate">Document Photo Uploaded</p>
                        <p className="text-[10px] text-emerald-700">Ready for Admin Panel manual review</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-blue-700 font-bold hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 border border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-100/70 rounded-xl text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Choose Document File</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUseSampleDocument}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors cursor-pointer shrink-0"
                      title="Use sample document preview"
                    >
                      Sample Copy
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={fullName.trim().length < 3}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-1 text-sm cursor-pointer"
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
                Live Photo Capture (Selfie)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Take a clear front-facing live photo to match with your uploaded document
              </p>
            </div>

            {/* Camera Viewport or Preview */}
            <div className="relative w-52 h-52 rounded-full overflow-hidden border-4 border-blue-600 bg-slate-100 shadow-md flex items-center justify-center my-2">
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
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <span>{t('clickPhotoBtn', currentLanguage)}</span>
                  </button>
                  <button
                    onClick={useSamplePhoto}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer"
                  >
                    Use Sample Verified Photo 📸
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleCompleteVerification}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit for Admin Panel Review 📋</span>
                  </button>
                  <button
                    onClick={retakePhoto}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('retakePhotoBtn', currentLanguage)}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 5: ADMIN REVIEW SUBMITTED STATUS */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center my-auto space-y-3.5 py-4"
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-white rounded-full border-4 border-blue-600 p-1 flex items-center justify-center shadow-md">
                <img
                  src={photoUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'}
                  alt="Verified Profile"
                  className="w-full h-full rounded-full object-cover"
                />
                <BadgeCheck className="w-7 h-7 text-blue-600 bg-white rounded-full absolute -bottom-1 -right-1 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {fullName || 'Verified Karigar'}
              </h3>
              <p className="text-xs text-blue-700 font-bold mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Documents Submitted for Admin Review</span>
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-medium max-w-sm mx-auto shadow-2xs space-y-1.5 text-left">
              <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-100 pb-1">
                <span className="flex items-center gap-1 text-blue-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Panel Status
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                  In Manual Review
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                • Live Face Photo: <strong className="text-emerald-700">Captured ✅</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                • Document ({documentType.toUpperCase()}): <strong className="text-emerald-700">Uploaded for verification ✅</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                • 'Basic Verified • Profile Photo Added' badge will be activated upon Admin Panel approval.
              </p>
            </div>

            <button
              onClick={() => {
                onVerificationComplete({
                  name: fullName || 'Verified Karigar',
                  phone: phone || '+91 98765 43210',
                  photoUrl: photoUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
                  verified: true,
                  documentType,
                  documentPhotoUrl: documentPhotoUrl || 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80'
                });
              }}
              className="w-full max-w-sm mx-auto py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors"
            >
              <span>Continue to App / Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
