import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Home,
  HardHat,
  Phone,
  KeyRound,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Shield,
  Sparkles,
  UploadCloud,
  Camera,
  RefreshCw,
  FileText,
  Lock,
  AlertCircle,
  BadgeCheck,
  MapPin,
  Briefcase,
  Wrench,
  User,
  Zap,
  Check,
  Info,
  MessageSquare,
  Loader2,
  Send,
  RotateCw,
} from 'lucide-react';
import { Language, UserRole, TradeCategory } from '../types';
import { t } from '../data/translations';
import { whatsAppOtpService } from '../services/whatsappOtpService';
import { googleAuthService } from '../services/authGateways';

interface VerificationFlowProps {
  currentLanguage: Language;
  onVerificationComplete: (userData: {
    name: string;
    phone: string;
    photoUrl: string;
    verified: boolean;
    role: UserRole;
    trade?: TradeCategory;
    experienceYears?: number;
    pincode?: string;
    aadhaarVerified?: boolean;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
  }) => void;
  onCancel?: () => void;
}

type FlowStep =
  | 'account_type'
  | 'customer_phone'
  | 'customer_otp'
  | 'worker_phone'
  | 'worker_otp'
  | 'worker_details'
  | 'worker_kyc'
  | 'worker_camera'
  | 'worker_success';

// Primary Skill Options as specifically requested
const WORKER_SKILL_OPTIONS: { id: TradeCategory; labelEn: string; labelHi: string; icon: string }[] = [
  { id: 'electrician', labelEn: 'Electrician', labelHi: 'इलेक्ट्रीशियन / बिजली मिस्त्री', icon: '⚡' },
  { id: 'plumber', labelEn: 'Plumber', labelHi: 'प्लंबर / नल मिस्त्री', icon: '🔧' },
  { id: 'carpenter', labelEn: 'Carpenter', labelHi: 'बढ़ई / कारपेंटर', icon: '🪚' },
  { id: 'painter', labelEn: 'Painter', labelHi: 'पेंटर / रंगाई मिस्त्री', icon: '🎨' },
  { id: 'ac_repair', labelEn: 'AC Technician', labelHi: 'एसी टेक्नीशियन', icon: '❄️' },
  { id: 'mason', labelEn: 'Mason', labelHi: 'राजमिस्त्री / चिनाई कारीगर', icon: '🧱' },
];

export const VerificationFlow: React.FC<VerificationFlowProps> = ({
  currentLanguage,
  onVerificationComplete,
}) => {
  // Navigation Step
  const [step, setStep] = useState<FlowStep>('account_type');

  // Account Type Selection State
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');

  // Common Phone & OTP State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // WhatsApp OTP Authentication Gateway State
  const [isSendingWhatsAppOtp, setIsSendingWhatsAppOtp] = useState(false);
  const [isVerifyingWhatsAppOtp, setIsVerifyingWhatsAppOtp] = useState(false);
  const [whatsAppOtpError, setWhatsAppOtpError] = useState<string | null>(null);
  const [whatsAppOtpSuccess, setWhatsAppOtpSuccess] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [lastDispatchedGateway, setLastDispatchedGateway] = useState<'Fast2SMS' | 'MSG91' | 'Standard SMS Gateway' | 'Truecaller 1-Click'>('Fast2SMS');
  const [activeOtpChannel, setActiveOtpChannel] = useState<'whatsapp' | 'sms' | 'truecaller'>('whatsapp');
  const [isTruecallerVerifying, setIsTruecallerVerifying] = useState(false);
  const [isGoogleVerifying, setIsGoogleVerifying] = useState(false);

  // 30-Second Countdown Timer for WhatsApp OTP Resend
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if ((step === 'customer_otp' || step === 'worker_otp') && resendCountdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCountdown]);

  // Worker Professional Details State
  const [fullName, setFullName] = useState('');
  const [primarySkill, setPrimarySkill] = useState<TradeCategory>('electrician');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [pincode, setPincode] = useState('');

  // Worker KYC & Aadhaar Photo Upload State
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyConsentError, setPrivacyConsentError] = useState(false);
  const [aadhaarUploadError, setAadhaarUploadError] = useState<string | null>(null);

  // Aadhaar Document Images (Front & Back)
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string>('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const frontFileInputRef = useRef<HTMLInputElement | null>(null);
  const backFileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick-fill helpers for seamless testing
  const handleQuickFillCustomer = () => {
    setPhone('9876543210');
  };

  const handleQuickFillWorker = () => {
    setPhone('9812345678');
    setFullName('Ramesh Sharma');
    setPrimarySkill('electrician');
    setExperienceYears(6);
    setPincode('400001');
  };

  // Step 1: Handle Account Type Selection Continue
  const handleAccountTypeContinue = () => {
    if (selectedRole === 'customer') {
      setStep('customer_phone');
    } else {
      setStep('worker_phone');
    }
  };

  // Send WhatsApp OTP via Fast2SMS / MSG91 API Gateway
  const sendWhatsAppOtpCode = async (targetPhone: string, role: 'customer' | 'worker') => {
    setIsSendingWhatsAppOtp(true);
    setWhatsAppOtpError(null);
    setWhatsAppOtpSuccess(null);
    setActiveOtpChannel('whatsapp');
    try {
      const resp = await whatsAppOtpService.sendWhatsAppOtp(targetPhone, role);
      setLastDispatchedGateway(resp.gateway);
      setWhatsAppOtpSuccess(`Verification code dispatched to your WhatsApp number via ${resp.gateway} Gateway.`);
      setResendCountdown(30);
      setCanResend(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network timeout reaching WhatsApp API gateway. Please try again.';
      setWhatsAppOtpError(msg);
    } finally {
      setIsSendingWhatsAppOtp(false);
    }
  };

  // Fallback: Send Standard SMS OTP if WhatsApp unavailable
  const sendSmsOtpFallback = async (role: 'customer' | 'worker') => {
    setIsSendingWhatsAppOtp(true);
    setWhatsAppOtpError(null);
    setWhatsAppOtpSuccess(null);
    try {
      const resp = await whatsAppOtpService.sendFallbackSmsOtp(phone, role);
      setActiveOtpChannel('sms');
      setLastDispatchedGateway('Standard SMS Gateway');
      setWhatsAppOtpSuccess(`SMS OTP dispatched directly to +91 ${phone} via Standard Telecom SMS.`);
      setResendCountdown(30);
      setCanResend(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send SMS OTP. Please check phone number.';
      setWhatsAppOtpError(msg);
    } finally {
      setIsSendingWhatsAppOtp(false);
    }
  };

  // 1-Click Login via Truecaller Verified SIM Handshake
  const handleTruecallerLogin = async (role: 'customer' | 'worker') => {
    if (phone.trim().length < 10) {
      setWhatsAppOtpError('Please enter a valid 10-digit mobile number before using Truecaller 1-Click.');
      return;
    }

    setIsTruecallerVerifying(true);
    setWhatsAppOtpError(null);

    try {
      const resp = await whatsAppOtpService.verifyWithTruecaller(phone);
      if (resp.verified) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (role === 'customer') {
          setTimeout(() => {
            onVerificationComplete({
              name: 'Verified Customer (Truecaller)',
              phone: `+91 ${phone}`,
              photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
              verified: true,
              role: 'customer',
            });
          }, 400);
        } else {
          // Worker advances directly past phone verification to details
          setStep('worker_details');
        }
      } else {
        setWhatsAppOtpError(resp.error || 'Truecaller 1-Click verification failed.');
      }
    } catch {
      setWhatsAppOtpError('Truecaller verification service timed out. Please use WhatsApp OTP.');
    } finally {
      setIsTruecallerVerifying(false);
    }
  };

  // 1-Click Primary Customer Sign-In with Google
  const handleGoogleCustomerLogin = async () => {
    setIsGoogleVerifying(true);
    setWhatsAppOtpError(null);
    try {
      const resp = await googleAuthService.signInWithGoogle();
      if (resp.success) {
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          onVerificationComplete({
            name: resp.user.name,
            phone: '+91 98765 43210',
            photoUrl: resp.user.picture,
            verified: true,
            role: 'customer',
          });
        }, 350);
      }
    } catch {
      setWhatsAppOtpError('Google Sign-In was cancelled or timed out. You can use Phone / WhatsApp OTP.');
    } finally {
      setIsGoogleVerifying(false);
    }
  };

  // Customer Phone Submit -> triggers WhatsApp OTP dispatch
  const handleCustomerPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length >= 10) {
      setOtp(['', '', '', '', '', '']);
      setStep('customer_otp');
      await sendWhatsAppOtpCode(phone, 'customer');
    }
  };

  // Resend WhatsApp OTP
  const handleResendWhatsAppOtp = async (role: 'customer' | 'worker') => {
    if (!canResend || isSendingWhatsAppOtp) return;
    setOtp(['', '', '', '', '', '']);
    await sendWhatsAppOtpCode(phone, role);
  };

  // Customer OTP Verify -> Navigates DIRECTLY to Home Screen
  const handleCustomerOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setWhatsAppOtpError('Please enter the complete 6-digit WhatsApp code.');
      return;
    }

    setIsVerifyingWhatsAppOtp(true);
    setWhatsAppOtpError(null);

    try {
      const result = await whatsAppOtpService.verifyWhatsAppOtp(phone, enteredCode);
      if (result.verified) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        // Direct Navigation to Home as Customer (No Aadhaar or documents collected)
        setTimeout(() => {
          onVerificationComplete({
            name: 'Home Owner (Customer)',
            phone: phone ? `+91 ${phone}` : '+91 98765 43210',
            photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            verified: true,
            role: 'customer',
          });
        }, 400);
      } else {
        setWhatsAppOtpError(result.error || 'Invalid 6-digit WhatsApp code. Please check WhatsApp.');
      }
    } catch {
      setWhatsAppOtpError('Network timeout verifying code. Please check connection and retry.');
    } finally {
      setIsVerifyingWhatsAppOtp(false);
    }
  };

  // Worker Phone Submit -> triggers WhatsApp OTP dispatch
  const handleWorkerPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length >= 10) {
      setOtp(['', '', '', '', '', '']);
      setStep('worker_otp');
      await sendWhatsAppOtpCode(phone, 'worker');
    }
  };

  // Worker OTP Verify -> Navigates to Worker Details Form
  const handleWorkerOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setWhatsAppOtpError('Please enter the complete 6-digit WhatsApp code.');
      return;
    }

    setIsVerifyingWhatsAppOtp(true);
    setWhatsAppOtpError(null);

    try {
      const result = await whatsAppOtpService.verifyWhatsAppOtp(phone, enteredCode);
      if (result.verified) {
        setStep('worker_details');
      } else {
        setWhatsAppOtpError(result.error || 'Invalid 6-digit WhatsApp code. Please check WhatsApp.');
      }
    } catch {
      setWhatsAppOtpError('Network timeout verifying code. Please check connection and retry.');
    } finally {
      setIsVerifyingWhatsAppOtp(false);
    }
  };

  // Worker Details Submit -> Navigates to KYC Verification
  const handleWorkerDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length >= 2 && pincode.trim().length === 6) {
      setStep('worker_kyc');
    }
  };

  // File Upload Handlers for Aadhaar Front & Back Photo Verification
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const url = uploadEvent.target.result as string;
          setter(url);
          setAadhaarUploadError(null);
          // If both front and back will be present, mark verified
          if (side === 'front' && aadhaarBackUrl) {
            setIsAadhaarVerified(true);
          } else if (side === 'back' && aadhaarFrontUrl) {
            setIsAadhaarVerified(true);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleAadhaarFront = () => {
    setAadhaarFrontUrl('https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80');
    setAadhaarUploadError(null);
    if (aadhaarBackUrl) {
      setIsAadhaarVerified(true);
    }
  };

  const handleUseSampleAadhaarBack = () => {
    setAadhaarBackUrl('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80');
    setAadhaarUploadError(null);
    if (aadhaarFrontUrl) {
      setIsAadhaarVerified(true);
    }
  };

  // Worker KYC Continue -> Camera Selfie with Privacy Policy Consent & Aadhaar Photos Check
  const handleWorkerKycContinue = () => {
    if (!aadhaarFrontUrl || !aadhaarBackUrl) {
      setAadhaarUploadError('Please upload both Front and Back photos of your Aadhaar card.');
      return;
    }
    setAadhaarUploadError(null);

    if (!privacyConsent) {
      setPrivacyConsentError(true);
      return;
    }
    setPrivacyConsentError(false);
    setIsAadhaarVerified(true);
    setStep('worker_camera');
    startCamera();
  };

  // Live Camera Management with Device Permission Request
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Explicitly request front-facing selfie camera with fallback to any camera
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'user' },
              width: { ideal: 640 },
              height: { ideal: 640 },
            },
          });
        } catch {
          // Fallback if specific facingMode constraint fails on certain hardware/browsers
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        }

        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
          };
          setIsCameraActive(true);
        }
      } else {
        setCameraError('Camera API not accessible in this browser view. You can use sample profile photo.');
      }
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error) ? err.message : String(err);
      if (errorMsg.includes('Permission') || errorMsg.includes('denied') || errorMsg.includes('NotAllowedError')) {
        setCameraError('Camera permission requested. Please allow camera access in browser prompt, or proceed with verified photo.');
      } else {
        setCameraError('Unable to open live camera device. You can proceed with instant sample photo.');
      }
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
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPhotoUrl(dataUrl);
        stopCamera();
      }
    } else {
      setCameraError('Camera is not active. Please enable camera permission and start the live preview to capture selfie.');
    }
  };

  const retakePhoto = () => {
    setPhotoUrl('');
    startCamera();
  };

  // Final Worker Submission
  const handleCompleteWorkerRegistration = () => {
    setStep('worker_success');
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const handleFinalEnterWorkerApp = () => {
    onVerificationComplete({
      name: fullName || 'Verified Karigar',
      phone: phone ? `+91 ${phone}` : '+91 98123 45678',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
      verified: true,
      role: 'worker',
      trade: primarySkill,
      experienceYears: experienceYears || 5,
      pincode: pincode || '400001',
      aadhaarVerified: true,
      aadhaarFrontUrl,
      aadhaarBackUrl,
    });
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-[620px] w-full bg-slate-50 text-slate-800 p-4 sm:p-5 flex flex-col justify-between rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Top Header & Breadcrumb / Back Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs mb-3">
        {step !== 'account_type' ? (
          <button
            type="button"
            onClick={() => {
              if (step === 'customer_phone' || step === 'worker_phone') {
                setStep('account_type');
              } else if (step === 'customer_otp') {
                setStep('customer_phone');
                setWhatsAppOtpError(null);
                setWhatsAppOtpSuccess(null);
              } else if (step === 'worker_otp') {
                setStep('worker_phone');
                setWhatsAppOtpError(null);
                setWhatsAppOtpSuccess(null);
              } else if (step === 'worker_details') {
                setStep('worker_otp');
              } else if (step === 'worker_kyc') {
                setStep('worker_details');
              } else if (step === 'worker_camera') {
                setStep('worker_kyc');
              }
            }}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-700 font-bold transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <span className="font-bold text-blue-700 flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            GharKaExpert Registration
          </span>
        )}

        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {selectedRole === 'customer' ? 'Customer Flow' : 'Worker KYC'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* 1. INITIAL ACCOUNT TYPE SELECTION SCREEN                                  */}
        {/* ========================================================================= */}
        {step === 'account_type' && (
          <motion.div
            key="account_type"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                <Sparkles className="w-3.5 h-3.5" /> Step 1: Select Account Type
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t('roleTitle', currentLanguage)}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Choose how you will be using GharKaExpert today
              </p>
            </div>

            {/* Selection Cards */}
            <div className="space-y-3 pt-1">
              {/* CUSTOMER CARD */}
              <div
                onClick={() => setSelectedRole('customer')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'customer'
                    ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl shadow-sm shrink-0 transition-colors ${
                    selectedRole === 'customer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Home className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        {t('roleCustomer', currentLanguage)}
                      </h3>
                      {selectedRole === 'customer' && (
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Hire trusted local electricians, plumbers, masons & repair experts. Zero middlemen commission.
                    </p>
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md text-[10px] font-bold">
                        💬 WhatsApp OTP Login
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                        ✓ No ID Documents Required
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WORKER / MESTRI / CONTRACTOR CARD */}
              <div
                onClick={() => setSelectedRole('worker')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedRole === 'worker'
                    ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl shadow-sm shrink-0 transition-colors ${
                    selectedRole === 'worker' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <HardHat className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        {t('roleWorker', currentLanguage)}
                      </h3>
                      {selectedRole === 'worker' && (
                        <div className="w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Get daily customer bookings, pass work contracts, showcase your portfolio and receive direct calls.
                    </p>
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-bold">
                        🛡️ Aadhaar KYC Verified
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                        ⭐ "Verified Karigar" Badge
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleAccountTypeContinue}
                className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98] cursor-pointer"
              >
                <span>
                  {selectedRole === 'customer'
                    ? 'Continue as Customer (Grahak) ➡️'
                    : 'Register as Mestri / Contractor ➡️'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2. CUSTOMER FLOW: SIGN IN (PRIMARY: GOOGLE, SECONDARY: PHONE/WHATSAPP OTP) */}
        {/* ========================================================================= */}
        {step === 'customer_phone' && (
          <motion.div
            key="customer_phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center border border-blue-200 shadow-xs">
                <Home className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Customer Sign-In
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Choose your preferred quick sign-in method
              </p>
            </div>

            {/* Reassurance Notice */}
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero brokerage direct hiring • No Aadhaar upload needed for customers</span>
            </div>

            {/* PRIMARY: CONTINUE WITH GOOGLE 1-CLICK */}
            <div className="space-y-2">
              <button
                type="button"
                id="btn-customer-google-signin"
                onClick={handleGoogleCustomerLogin}
                disabled={isGoogleVerifying || isSendingWhatsAppOtp}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-slate-400 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 text-sm cursor-pointer disabled:opacity-50 relative group"
              >
                {isGoogleVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Connecting to Google Identity...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google 'G' Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-slate-900 font-extrabold">Continue with Google</span>
                    <span className="ml-auto text-[10px] bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded-full">
                      Fastest 1-Click
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* DIVIDER */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                or continue with phone
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* SECONDARY OPTION: PHONE / WHATSAPP OTP */}
            <form onSubmit={handleCustomerPhoneSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (for WhatsApp / SMS OTP)
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
                    className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 tracking-wider focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleQuickFillCustomer}
                  className="text-xs text-blue-700 font-bold underline hover:text-blue-800 cursor-pointer"
                >
                  ⚡ Auto-fill demo number (9876543210)
                </button>
              </div>

              <button
                type="submit"
                id="btn-customer-whatsapp-otp"
                disabled={phone.length < 10 || isSendingWhatsAppOtp || isGoogleVerifying}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSendingWhatsAppOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting WhatsApp Gateway...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-emerald-100 fill-emerald-100/20" />
                    <span>Continue with Phone / WhatsApp OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2. CUSTOMER FLOW: OTP VERIFY -> DIRECT TO HOME SCREEN                    */}
        {/* ========================================================================= */}
        {step === 'customer_otp' && (
          <motion.div
            key="customer_otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md shadow-emerald-200">
                {activeOtpChannel === 'sms' ? (
                  <Phone className="w-7 h-7 text-white" />
                ) : (
                  <MessageSquare className="w-7 h-7 fill-white/20" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {activeOtpChannel === 'sms' ? 'SMS Code Verification' : 'WhatsApp Verification'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {activeOtpChannel === 'sms'
                  ? '6-digit SMS verification code sent to your number:'
                  : '6-digit code sent to your WhatsApp number:'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-mono font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>+91 {phone || '9876543210'}</span>
              </div>
            </div>

            {/* Success Dispatch Alert */}
            {whatsAppOtpSuccess && !whatsAppOtpError && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {activeOtpChannel === 'sms'
                    ? '6-digit code sent via SMS to your mobile number'
                    : '6-digit code sent to your WhatsApp number'}
                </span>
              </div>
            )}

            {/* Error or Timeout Alert */}
            {whatsAppOtpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 font-medium flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Verification Alert</p>
                  <p className="text-[11px] text-rose-700 leading-snug">{whatsAppOtpError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCustomerOtpVerify} className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[idx] = e.target.value.replace(/\D/g, '');
                      setOtp(newOtp);
                      if (e.target.value && e.target.nextElementSibling instanceof HTMLInputElement) {
                        e.target.nextElementSibling.focus();
                      }
                    }}
                    className={`w-11 h-12 text-center text-xl font-bold font-mono bg-white border rounded-xl text-emerald-700 focus:outline-none focus:border-emerald-600 shadow-xs transition-colors ${
                      whatsAppOtpError ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Gateway & Delivery Info */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {activeOtpChannel === 'sms'
                    ? 'Standard Telecom SMS Gateway (Fallback Active)'
                    : 'Fast2SMS / MSG91 Official WhatsApp Gateway'}
                </span>
              </div>

              {/* 30-Second Countdown & Resend Button */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">Didn't receive code?</span>
                {canResend ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResendWhatsAppOtp('customer')}
                      disabled={isSendingWhatsAppOtp}
                      className="text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isSendingWhatsAppOtp ? 'animate-spin' : ''}`} />
                      <span>Resend OTP via WhatsApp</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => sendSmsOtpFallback('customer')}
                      disabled={isSendingWhatsAppOtp}
                      className="text-blue-700 font-bold hover:text-blue-800 cursor-pointer"
                    >
                      Via SMS
                    </button>
                  </div>
                ) : (
                  <span className="font-semibold text-slate-500 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Resend OTP in <strong>{resendCountdown}s</strong>
                  </span>
                )}
              </div>

              {/* Secondary Fallback Trigger if WhatsApp is delayed */}
              <div className="pt-0.5 flex justify-center">
                <button
                  type="button"
                  onClick={() => sendSmsOtpFallback('customer')}
                  disabled={isSendingWhatsAppOtp}
                  className="text-[11px] text-slate-500 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>WhatsApp unavailable? Send OTP via Standard SMS</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={otp.join('').length !== 6 || isVerifyingWhatsAppOtp}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingWhatsAppOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying {activeOtpChannel === 'sms' ? 'SMS Code' : 'with WhatsApp Gateway'}...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP & Enter Home Screen 🚀</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. WORKER FLOW: PHONE NUMBER                                              */}
        {/* ========================================================================= */}
        {step === 'worker_phone' && (
          <motion.div
            key="worker_phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center border border-amber-200 shadow-xs">
                <HardHat className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Karigar / Contractor Registration
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Enter your WhatsApp mobile number for instant 6-digit OTP verification
              </p>
            </div>

            <form onSubmit={handleWorkerPhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (for Customer Calls & WhatsApp) *
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
                    placeholder="9812345678"
                    className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-mono text-slate-900 tracking-wider focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickFillWorker}
                className="text-xs text-blue-700 font-bold underline hover:text-blue-800 cursor-pointer block"
              >
                ⚡ Click to auto-fill sample worker data
              </button>

              <button
                type="submit"
                disabled={phone.length < 10 || isSendingWhatsAppOtp || isTruecallerVerifying}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSendingWhatsAppOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting WhatsApp Gateway...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-emerald-100 fill-emerald-100/20" />
                    <span>Send 6-Digit WhatsApp OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Alternative 1-Click Login: Truecaller Instant Handshake */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">or instant login</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={() => handleTruecallerLogin('worker')}
                disabled={isTruecallerVerifying || isSendingWhatsAppOtp}
                className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
              >
                {isTruecallerVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>Verifying with Truecaller 1-Click...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-sky-600 text-sky-600" />
                    <span>Truecaller 1-Click Login (Instant Verified SIM)</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. WORKER FLOW: OTP VERIFY                                                */}
        {/* ========================================================================= */}
        {step === 'worker_otp' && (
          <motion.div
            key="worker_otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 my-auto"
          >
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md shadow-emerald-200">
                {activeOtpChannel === 'sms' ? (
                  <Phone className="w-7 h-7 text-white" />
                ) : (
                  <MessageSquare className="w-7 h-7 fill-white/20" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {activeOtpChannel === 'sms' ? 'Worker SMS Verification' : 'Worker WhatsApp Verification'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {activeOtpChannel === 'sms'
                  ? '6-digit SMS verification code sent to your number:'
                  : '6-digit code sent to your WhatsApp number:'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-mono font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>+91 {phone || '9812345678'}</span>
              </div>
            </div>

            {/* Success Dispatch Alert */}
            {whatsAppOtpSuccess && !whatsAppOtpError && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {activeOtpChannel === 'sms'
                    ? '6-digit code sent via SMS to your mobile number'
                    : '6-digit code sent to your WhatsApp number'}
                </span>
              </div>
            )}

            {/* Error or Timeout Alert */}
            {whatsAppOtpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 font-medium flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Verification Alert</p>
                  <p className="text-[11px] text-rose-700 leading-snug">{whatsAppOtpError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleWorkerOtpVerify} className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[idx] = e.target.value.replace(/\D/g, '');
                      setOtp(newOtp);
                      if (e.target.value && e.target.nextElementSibling instanceof HTMLInputElement) {
                        e.target.nextElementSibling.focus();
                      }
                    }}
                    className={`w-11 h-12 text-center text-xl font-bold font-mono bg-white border rounded-xl text-emerald-700 focus:outline-none focus:border-emerald-600 shadow-xs transition-colors ${
                      whatsAppOtpError ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Gateway & Delivery Info */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {activeOtpChannel === 'sms'
                    ? 'Standard Telecom SMS Gateway (Fallback Active)'
                    : 'Fast2SMS / MSG91 Official WhatsApp Gateway'}
                </span>
              </div>

              {/* 30-Second Countdown & Resend Button */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">Didn't receive code?</span>
                {canResend ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResendWhatsAppOtp('worker')}
                      disabled={isSendingWhatsAppOtp}
                      className="text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isSendingWhatsAppOtp ? 'animate-spin' : ''}`} />
                      <span>Resend OTP via WhatsApp</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => sendSmsOtpFallback('worker')}
                      disabled={isSendingWhatsAppOtp}
                      className="text-blue-700 font-bold hover:text-blue-800 cursor-pointer"
                    >
                      Via SMS
                    </button>
                  </div>
                ) : (
                  <span className="font-semibold text-slate-500 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Resend OTP in <strong>{resendCountdown}s</strong>
                  </span>
                )}
              </div>

              {/* Secondary Fallback Trigger if WhatsApp is delayed */}
              <div className="pt-0.5 flex justify-center">
                <button
                  type="button"
                  onClick={() => sendSmsOtpFallback('worker')}
                  disabled={isSendingWhatsAppOtp}
                  className="text-[11px] text-slate-500 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>WhatsApp unavailable? Send OTP via Standard SMS</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={otp.join('').length !== 6 || isVerifyingWhatsAppOtp}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingWhatsAppOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying {activeOtpChannel === 'sms' ? 'SMS Code' : 'with WhatsApp Gateway'}...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Profile Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. WORKER FLOW: DETAILS (Full Name, Primary Skill, Experience, Pincode)   */}
        {/* ========================================================================= */}
        {step === 'worker_details' && (
          <motion.div
            key="worker_details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3.5 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center border border-blue-200 shadow-xs">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Karigar Professional Details
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Provide your core skills and service coverage area
              </p>
            </div>

            <form onSubmit={handleWorkerDetailsSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Primary Skill / Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Skill / Category (मुख्य काम) *
                </label>
                <div className="relative flex items-center">
                  <Wrench className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={primarySkill}
                    onChange={(e) => setPrimarySkill(e.target.value as TradeCategory)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-blue-600 shadow-2xs appearance-none cursor-pointer"
                  >
                    {WORKER_SKILL_OPTIONS.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.icon} {skill.labelEn} — {skill.labelHi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Work Experience & Service Area Pincode in 2 Columns */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Work Experience (Years) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Years) *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      required
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Service Area Pincode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Area Pincode *
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 400001"
                      className="w-full pl-8 pr-2.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={fullName.trim().length < 2 || pincode.length !== 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer mt-2"
              >
                <span>Proceed to Aadhaar KYC Verification ➡️</span>
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. WORKER FLOW: KYC VERIFICATION (Aadhaar Front & Back, Clean UI, Privacy)*/}
        {/* ========================================================================= */}
        {step === 'worker_kyc' && (
          <motion.div
            key="worker_kyc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3.5 my-auto max-h-[500px] overflow-y-auto pr-1"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center border border-blue-200 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Aadhaar KYC Verification
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Upload your Aadhaar details to earn the trusted "Verified Karigar" badge
              </p>
            </div>

            {/* MANDATORY PRIVACY NOTE */}
            <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-2xl space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-blue-700 shrink-0" />
                <span>🔒 Privacy Protected (Admin Panel Only)</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-normal">
                Your Aadhaar card images and numbers are strictly private. They are NEVER shared with customers. Customers on the app will only see your public <strong>"Verified Karigar"</strong> trust badge.
              </p>
            </div>

            {/* SIMPLE AADHAAR VERIFIED STATUS INDICATOR */}
            {isAadhaarVerified && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-full">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                      Aadhaar Photos Uploaded
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                        FRONT & BACK READY
                      </span>
                    </h4>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Both sides captured & stored securely for Admin review
                    </p>
                  </div>
                </div>
                <BadgeCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              </div>
            )}

            {/* Aadhaar Number (Optional / Display) */}
            <div className="space-y-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Aadhaar Number (12 Digits)
                </label>
                <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Photo Verification Mode
                </span>
              </div>
              <input
                type="text"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit Aadhaar number (matching card)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600 tracking-wider"
              />
              <p className="text-[10px] text-slate-500">
                * Upload clear photos of your original Aadhaar card below (Front & Back). No OTP required.
              </p>
            </div>

            {/* Upload Error Banner if submitted without both photos */}
            {aadhaarUploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aadhaarUploadError}</span>
              </div>
            )}

            {/* DOCUMENT UPLOADS: AADHAAR FRONT & AADHAAR BACK (ADDRESS) */}
            <div className="space-y-3">
              {/* 1. Aadhaar Front Image */}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Aadhaar Front Photo (Name, Photo & DOB) *</span>
                  </label>
                  {aadhaarFrontUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Uploaded
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={frontFileInputRef}
                  onChange={(e) => handleFileChange(e, setAadhaarFrontUrl, 'front')}
                  accept="image/*"
                  className="hidden"
                />

                {aadhaarFrontUrl ? (
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={aadhaarFrontUrl}
                        alt="Aadhaar Front"
                        className="w-12 h-8 object-cover rounded-lg border border-slate-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">Aadhaar Front Card Photo</p>
                        <p className="text-[10px] text-slate-500">Private Admin Copy Attached</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => frontFileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => frontFileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/60 rounded-xl text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Front Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUseSampleAadhaarFront}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shrink-0 cursor-pointer"
                    >
                      Sample Front
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Aadhaar Back Image (Address) */}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Aadhaar Back Photo (Complete Address & QR) *</span>
                  </label>
                  {aadhaarBackUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Uploaded
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={backFileInputRef}
                  onChange={(e) => handleFileChange(e, setAadhaarBackUrl, 'back')}
                  accept="image/*"
                  className="hidden"
                />

                {aadhaarBackUrl ? (
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={aadhaarBackUrl}
                        alt="Aadhaar Back"
                        className="w-12 h-8 object-cover rounded-lg border border-slate-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">Aadhaar Back Photo (Address)</p>
                        <p className="text-[10px] text-slate-500">Address verified for local dispatch</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => backFileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => backFileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/60 rounded-xl text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Back Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUseSampleAadhaarBack}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shrink-0 cursor-pointer"
                    >
                      Sample Back
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PUBLIC BADGE PREVIEW */}
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-sm space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Public Customer View Preview:
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{fullName || 'Ramesh Sharma'}</p>
                  <p className="text-xs text-slate-300 capitalize">
                    {primarySkill} • {experienceYears} Yrs Exp • Pincode {pincode || '400001'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-full shadow-xs">
                  <BadgeCheck className="w-4 h-4 text-slate-950" />
                  Verified Karigar
                </span>
              </div>
            </div>

            {/* EXPLICIT PRIVACY POLICY CONSENT CHECKBOX (DPDP ACT COMPLIANT) */}
            <div className={`p-3 rounded-2xl border transition-colors ${
              privacyConsentError && !privacyConsent
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => {
                    setPrivacyConsent(e.target.checked);
                    if (e.target.checked) setPrivacyConsentError(false);
                  }}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-800 font-medium leading-snug">
                  I allow <strong>GharKaExpert</strong> to verify my identity documents under the <strong>Privacy Policy</strong>.
                </span>
              </label>
              {privacyConsentError && !privacyConsent && (
                <p className="text-[11px] text-rose-600 font-bold mt-1.5 pl-6 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Please allow GharKaExpert to verify your identity documents under the Privacy Policy.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleWorkerKycContinue}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-1"
            >
              <span>Proceed to Selfie & Profile Photo 📸</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. WORKER FLOW: SELFIE / PROFILE PHOTO CAPTURE                            */}
        {/* ========================================================================= */}
        {step === 'worker_camera' && (
          <motion.div
            key="worker_camera"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3 my-auto flex flex-col items-center"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Live Face Selfie Capture
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Take a clear front-facing selfie to complete your Karigar Profile
              </p>
            </div>

            {/* Camera Viewport */}
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-600 bg-slate-100 shadow-md flex items-center justify-center my-2">
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
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1 animate-pulse" />
                  <p className="text-xs text-slate-500 font-medium">Initializing Camera...</p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-center text-xs text-orange-950 max-w-xs space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-center gap-1.5 font-semibold text-orange-900">
                  <AlertCircle className="w-4 h-4 shrink-0 text-orange-600" />
                  <span>Camera Access Alert</span>
                </div>
                <p className="text-[11px] text-orange-800 leading-snug">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Camera Permission</span>
                </button>
              </div>
            )}

            <div className="w-full max-w-xs space-y-2 pt-1">
              {!photoUrl ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={snapPhoto}
                    disabled={!isCameraActive}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('clickPhotoBtn', currentLanguage)}</span>
                  </button>
                  {!isCameraActive && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Start Front Camera</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCompleteWorkerRegistration}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Complete KYC & Get Verified Badge 📋</span>
                  </button>
                  <button
                    type="button"
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

        {/* ========================================================================= */}
        {/* 3. WORKER FLOW: SUCCESS CONFIRMATION & LAUNCH DASHBOARD                   */}
        {/* ========================================================================= */}
        {step === 'worker_success' && (
          <motion.div
            key="worker_success"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center my-auto space-y-4 py-2"
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-white rounded-full border-4 border-emerald-500 p-1 flex items-center justify-center shadow-md">
                <img
                  src={photoUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'}
                  alt="Verified Profile"
                  className="w-full h-full rounded-full object-cover"
                />
                <BadgeCheck className="w-7 h-7 text-emerald-600 bg-white rounded-full absolute -bottom-1 -right-1 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black mb-1">
                ✓ Aadhaar Verified • Verified Karigar Active
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {fullName || 'Ramesh Sharma'}
              </h3>
              <p className="text-xs text-slate-500 capitalize">
                {primarySkill} • {experienceYears} Years Experience • Pincode {pincode || '400001'}
              </p>
            </div>

            {/* Status Checklist Card */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 max-w-sm mx-auto shadow-2xs text-left space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-slate-900">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  KYC Verification Status
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                  APPROVED
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Aadhaar Front Image: <strong>Verified</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Aadhaar Back Image (Address): <strong>Verified</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Privacy Mode: <strong>Data visible only in Admin Panel</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Public Badge: <strong>"Verified Karigar" Active on App</strong></span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalEnterWorkerApp}
              className="w-full max-w-sm mx-auto py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Enter Karigar Dashboard 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
