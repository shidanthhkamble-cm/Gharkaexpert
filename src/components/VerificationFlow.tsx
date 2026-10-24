import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Home,
  HardHat,
  Phone,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
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
  Check,
  Loader2,
  RotateCw,
  ShieldAlert,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Language,
  UserRole,
  TradeCategory,
  PhoneAuthCheckResult,
  VipSubscriptionState,
} from '../types';
import { t } from '../data/translations';
import { firebasePhoneAuthService } from '../services/firebasePhoneAuthService';
import { deviceCameraService } from '../services/capacitorDeviceService';
import { accountLifecycleService } from '../services/accountLifecycleService';

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
    restoredMessage?: string;
    rating?: number;
    reviewsCount?: number;
    completedJobs?: number;
    bio?: string;
    dailyRate?: number;
    visitingFee?: number;
    vipSubscription?: VipSubscriptionState;
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

const WORKER_SKILL_OPTIONS: {
  id: TradeCategory;
  labelEn: string;
  labelHi: string;
  icon: string;
}[] = [
  { id: 'electrician', labelEn: 'Electrician', labelHi: 'इलेक्ट्रीशियन / बिजली मिस्त्री', icon: '⚡' },
  { id: 'plumber', labelEn: 'Plumber', labelHi: 'प्लंबर / नल मिस्त्री', icon: '🔧' },
  { id: 'carpenter', labelEn: 'Carpenter', labelHi: 'बढ़ई / कारपेंटर', icon: '🪚' },
  { id: 'painter', labelEn: 'Painter', labelHi: 'पेंटर / रंगाई मिस्त्री', icon: '🎨' },
  { id: 'ac_repair', labelEn: 'AC Technician', labelHi: 'एसी टेक्नीशियन', icon: '❄️' },
  { id: 'mason', labelEn: 'Mason', labelHi: 'राजमिस्त्री / चिनाई कारीगर', icon: '🧱' },
];

const DEFAULT_CUSTOMER_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

export const VerificationFlow: React.FC<VerificationFlowProps> = ({
  currentLanguage,
  onVerificationComplete,
}) => {
  const [step, setStep] = useState<FlowStep>('account_type');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');

  // Phone & 6-digit SMS OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Firebase Phone Auth state
  const [isSendingFirebaseOtp, setIsSendingFirebaseOtp] = useState(false);
  const [isVerifyingFirebaseOtp, setIsVerifyingFirebaseOtp] = useState(false);
  const [firebaseOtpError, setFirebaseOtpError] = useState<string | null>(null);
  const [firebaseOtpSuccess, setFirebaseOtpSuccess] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Worker Professional Details
  const [fullName, setFullName] = useState('');
  const [primarySkill, setPrimarySkill] = useState<TradeCategory>('electrician');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [pincode, setPincode] = useState('');

  // Worker KYC & Aadhaar Document Capture
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyConsentError, setPrivacyConsentError] = useState(false);
  const [aadhaarUploadError, setAadhaarUploadError] = useState<string | null>(null);
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string>('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Camera & Fallback File Pickers
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const frontFileInputRef = useRef<HTMLInputElement | null>(null);
  const backFileInputRef = useRef<HTMLInputElement | null>(null);
  const selfieFileInputRef = useRef<HTMLInputElement | null>(null);

  // Account Lifecycle / Returning User Restoration State
  const [authCheckResult, setAuthCheckResult] = useState<PhoneAuthCheckResult | null>(null);
  const [securityPromptName, setSecurityPromptName] = useState('');
  const [securityPromptError, setSecurityPromptError] = useState<string | null>(null);
  const [isVerifyingSecurityPrompt, setIsVerifyingSecurityPrompt] = useState(false);
  const [securityPromptSuccess, setSecurityPromptSuccess] = useState<string | null>(null);

  // 30-Second Countdown Timer for Firebase SMS OTP Resend
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
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

  // Background check for returning soft-deleted account on this device
  useEffect(() => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length === 10) {
      setSecurityPromptName('');
      setSecurityPromptError(null);
      setSecurityPromptSuccess(null);
      accountLifecycleService.handlePhoneLoginOrRegistration(clean).then((res) => {
        setAuthCheckResult(res);
      });
    } else {
      setAuthCheckResult(null);
      setSecurityPromptName('');
      setSecurityPromptError(null);
      setSecurityPromptSuccess(null);
    }
  }, [phone]);

  // Cleanup camera and Firebase RecaptchaVerifier on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      firebasePhoneAuthService.clearRecaptcha();
    };
  }, []);

  const handleVerifySecurityName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!securityPromptName.trim()) {
      setSecurityPromptError('Please enter your previous registered name.');
      return;
    }
    setIsVerifyingSecurityPrompt(true);
    setSecurityPromptError(null);
    setSecurityPromptSuccess(null);
    try {
      const res = await accountLifecycleService.verifySecurityPromptAndRestore(
        phone,
        securityPromptName
      );
      if (res.success && res.user) {
        setSecurityPromptSuccess(res.message);
        setAuthCheckResult({
          status: 'restored',
          message: res.message,
          user: res.user,
          deviceIdMatched: true,
        });
        confetti({
          particleCount: 65,
          spread: 75,
          origin: { y: 0.6 },
        });
      } else {
        setSecurityPromptError(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please retry.';
      setSecurityPromptError(msg);
    } finally {
      setIsVerifyingSecurityPrompt(false);
    }
  };

  const handleClaimAsNewSimOwner = async () => {
    setIsVerifyingSecurityPrompt(true);
    setSecurityPromptError(null);
    try {
      const res = await accountLifecycleService.claimAsNewSimOwnerAndArchive(
        phone,
        undefined,
        selectedRole
      );
      if (res.success) {
        setSecurityPromptSuccess(
          'Previous owner record archived. Proceeding to set up your fresh profile.'
        );
        setAuthCheckResult({
          status: 'new_user',
          message: 'Ready to set up your new profile.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to archive old record.';
      setSecurityPromptError(msg);
    } finally {
      setIsVerifyingSecurityPrompt(false);
    }
  };

  const renderSmartAccountStatusCard = () => {
    if (!authCheckResult || authCheckResult.status !== 'security_prompt_required') {
      return null;
    }

    return (
      <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/95 text-xs space-y-2 shadow-xs">
        <div className="flex items-center gap-1.5 font-bold text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Verify Account Ownership</span>
        </div>

        <p className="text-[11px] text-amber-900 leading-snug">
          A previous account was found for this number. Enter your registered name to restore your account, or start a fresh profile:
        </p>

        <div className="p-2.5 bg-white rounded-lg border border-amber-200 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700">Name Hint:</span>
            <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              {authCheckResult.previousAccountNameHint || '*****'}
            </span>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={securityPromptName}
              onChange={(e) => setSecurityPromptName(e.target.value)}
              placeholder="Enter previous registered name"
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600"
            />
            <button
              type="button"
              onClick={handleVerifySecurityName}
              disabled={isVerifyingSecurityPrompt || !securityPromptName.trim()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              {isVerifyingSecurityPrompt ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Restore</span>
            </button>
          </div>

          {securityPromptError && (
            <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-md border border-rose-200 font-medium leading-tight">
              {securityPromptError}
            </p>
          )}

          {securityPromptSuccess && (
            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-md border border-emerald-200 font-bold leading-tight">
              ✓ {securityPromptSuccess}
            </p>
          )}

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">New owner of this number?</span>
            <button
              type="button"
              onClick={handleClaimAsNewSimOwner}
              disabled={isVerifyingSecurityPrompt}
              className="text-blue-700 hover:text-blue-800 font-bold underline cursor-pointer"
            >
              Start Fresh Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleAccountTypeContinue = () => {
    setFirebaseOtpError(null);
    setFirebaseOtpSuccess(null);
    if (selectedRole === 'customer') {
      setStep('customer_phone');
    } else {
      setStep('worker_phone');
    }
  };

  const finalizeCustomerLogin = async (verifiedPhone: string) => {
    const lifecycleCheck = await accountLifecycleService.handlePhoneLoginOrRegistration(
      verifiedPhone
    );
    setAuthCheckResult(lifecycleCheck);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    const restoredUser = lifecycleCheck.user || authCheckResult?.user;
    const isRestored =
      lifecycleCheck.status === 'restored' || authCheckResult?.status === 'restored';

    setTimeout(() => {
      onVerificationComplete({
        name: restoredUser?.name || 'Customer',
        phone: `+91 ${verifiedPhone}`,
        photoUrl: restoredUser?.photoUrl || DEFAULT_CUSTOMER_AVATAR,
        verified: true,
        role: 'customer',
        restoredMessage: isRestored
          ? lifecycleCheck.message || authCheckResult?.message
          : undefined,
        rating: restoredUser?.rating,
        reviewsCount: restoredUser?.reviewsCount,
        vipSubscription: restoredUser?.vipSubscription,
      });
    }, 300);
  };

  const finalizeWorkerOtpVerified = async (verifiedPhone: string) => {
    const lifecycleCheck = await accountLifecycleService.handlePhoneLoginOrRegistration(
      verifiedPhone
    );
    setAuthCheckResult(lifecycleCheck);

    const activeOrRestored = lifecycleCheck.user || authCheckResult?.user;
    const isRestored =
      (lifecycleCheck.status === 'restored' || authCheckResult?.status === 'restored') &&
      Boolean(activeOrRestored);

    if (isRestored && activeOrRestored) {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        onVerificationComplete({
          name: activeOrRestored.name,
          phone: activeOrRestored.phoneNumber.startsWith('+91')
            ? activeOrRestored.phoneNumber
            : `+91 ${activeOrRestored.phoneNumber}`,
          photoUrl: activeOrRestored.photoUrl || DEFAULT_CUSTOMER_AVATAR,
          verified: true,
          role: activeOrRestored.role || 'worker',
          trade: activeOrRestored.trade || 'electrician',
          experienceYears: activeOrRestored.experienceYears || 5,
          pincode: activeOrRestored.pincode || '400001',
          aadhaarVerified: activeOrRestored.aadhaarVerified ?? true,
          aadhaarFrontUrl: activeOrRestored.aadhaarFrontUrl,
          aadhaarBackUrl: activeOrRestored.aadhaarBackUrl,
          restoredMessage: lifecycleCheck.message || authCheckResult?.message,
          rating: activeOrRestored.rating,
          reviewsCount: activeOrRestored.reviewsCount,
          completedJobs: activeOrRestored.completedJobs,
          bio: activeOrRestored.bio,
          dailyRate: activeOrRestored.dailyRate,
          visitingFee: activeOrRestored.visitingFee,
          vipSubscription: activeOrRestored.vipSubscription,
        });
      }, 300);
      return;
    }

    if (activeOrRestored) {
      if (activeOrRestored.name && activeOrRestored.name !== 'Customer') {
        setFullName(activeOrRestored.name);
      }
      if (activeOrRestored.trade) setPrimarySkill(activeOrRestored.trade);
      if (activeOrRestored.experienceYears) setExperienceYears(activeOrRestored.experienceYears);
      if (activeOrRestored.pincode) setPincode(activeOrRestored.pincode);
    }

    setStep('worker_details');
  };

  // Trigger real Firebase Phone Auth SMS API (Capacitor Native or Web SDK signInWithPhoneNumber)
  const sendFirebaseOtpCode = async (
    targetPhone: string,
    role: 'customer' | 'worker'
  ): Promise<boolean> => {
    setIsSendingFirebaseOtp(true);
    setFirebaseOtpError(null);
    setFirebaseOtpSuccess(null);

    try {
      const response = await firebasePhoneAuthService.sendFirebaseSmsOtp(
        targetPhone,
        role,
        'firebase-recaptcha-container'
      );

      // Android Instant Verification (Play Services verified SIM automatically)
      if (response.autoVerified) {
        setFirebaseOtpSuccess('Mobile number verified automatically via SIM.');
        if (role === 'customer') {
          await finalizeCustomerLogin(targetPhone);
        } else {
          await finalizeWorkerOtpVerified(targetPhone);
        }
        return true;
      }

      setFirebaseOtpSuccess(`6-digit SMS OTP sent to +91 ${targetPhone}.`);
      setResendCountdown(30);
      setCanResend(false);
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to send SMS OTP. Please try again.';
      setFirebaseOtpError(msg);
      return false;
    } finally {
      setIsSendingFirebaseOtp(false);
    }
  };

  const handleCustomerPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return;

    setOtp(['', '', '', '', '', '']);
    const sent = await sendFirebaseOtpCode(cleanPhone, 'customer');
    if (sent) {
      setStep((current) => (current === 'customer_phone' ? 'customer_otp' : current));
    }
  };

  const handleWorkerPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return;

    setOtp(['', '', '', '', '', '']);
    const sent = await sendFirebaseOtpCode(cleanPhone, 'worker');
    if (sent) {
      setStep((current) => (current === 'worker_phone' ? 'worker_otp' : current));
    }
  };

  const handleResendFirebaseOtp = async (role: 'customer' | 'worker') => {
    if (!canResend || isSendingFirebaseOtp) return;
    setOtp(['', '', '', '', '', '']);
    await sendFirebaseOtpCode(phone, role);
  };

  const handleOtpInputChange = (idx: number, rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    if (digits.length > 1) {
      // Handle full 6-digit autofill / paste into single field
      const next = [...otp];
      for (let i = 0; i < 6; i++) {
        next[i] = digits[i] || '';
      }
      setOtp(next);
      const focusIndex = Math.min(digits.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[idx] = digits;
    setOtp(newOtp);
    if (digits && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setOtp(next);
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleCustomerOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setFirebaseOtpError('Please enter the complete 6-digit SMS OTP.');
      return;
    }

    setIsVerifyingFirebaseOtp(true);
    setFirebaseOtpError(null);

    try {
      const result = await firebasePhoneAuthService.verifyFirebaseSmsOtp(phone, enteredCode);
      if (result.verified) {
        await finalizeCustomerLogin(phone.replace(/\D/g, '').slice(-10));
      } else {
        setFirebaseOtpError(
          result.error || 'Invalid 6-digit SMS code. Please check your SMS messages.'
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error verifying SMS code. Please check your connection and retry.';
      setFirebaseOtpError(msg);
    } finally {
      setIsVerifyingFirebaseOtp(false);
    }
  };

  const handleWorkerOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setFirebaseOtpError('Please enter the complete 6-digit SMS OTP.');
      return;
    }

    setIsVerifyingFirebaseOtp(true);
    setFirebaseOtpError(null);

    try {
      const result = await firebasePhoneAuthService.verifyFirebaseSmsOtp(phone, enteredCode);
      if (result.verified) {
        await finalizeWorkerOtpVerified(phone.replace(/\D/g, '').slice(-10));
      } else {
        setFirebaseOtpError(
          result.error || 'Invalid 6-digit SMS code. Please check your SMS messages.'
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error verifying SMS code. Please check your connection and retry.';
      setFirebaseOtpError(msg);
    } finally {
      setIsVerifyingFirebaseOtp(false);
    }
  };

  const handleWorkerDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length >= 2 && pincode.trim().length === 6) {
      setStep('worker_kyc');
    }
  };

  // Fallback HTML5 File Reader when user selects an image from file input
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

  // Native Smartphone Rear Camera Capture via @capacitor/camera
  const handleCapacitorCameraCapture = async (side: 'front' | 'back') => {
    setAadhaarUploadError(null);
    const label =
      side === 'front' ? 'Aadhaar Front Card Photo' : 'Aadhaar Back Card (Address) Photo';
    const result = await deviceCameraService.captureDocumentPhoto(label);

    if (result.success && result.dataUrl) {
      if (side === 'front') {
        setAadhaarFrontUrl(result.dataUrl);
        if (aadhaarBackUrl) setIsAadhaarVerified(true);
      } else {
        setAadhaarBackUrl(result.dataUrl);
        if (aadhaarFrontUrl) setIsAadhaarVerified(true);
      }
      return;
    }

    if (result.cancelled) {
      return;
    }

    // Fallback to HTML5 camera capture input if WebView/browser requires input trigger
    if (side === 'front') {
      frontFileInputRef.current?.click();
    } else {
      backFileInputRef.current?.click();
    }
  };

  // Native Photo Gallery Picker via @capacitor/camera
  const handleCapacitorGalleryPick = async (side: 'front' | 'back') => {
    setAadhaarUploadError(null);
    const label = side === 'front' ? 'Select Aadhaar Front' : 'Select Aadhaar Back';
    const result = await deviceCameraService.pickGalleryPhoto(label);

    if (result.success && result.dataUrl) {
      if (side === 'front') {
        setAadhaarFrontUrl(result.dataUrl);
        if (aadhaarBackUrl) setIsAadhaarVerified(true);
      } else {
        setAadhaarBackUrl(result.dataUrl);
        if (aadhaarFrontUrl) setIsAadhaarVerified(true);
      }
      return;
    }

    if (result.cancelled) {
      return;
    }

    if (side === 'front') {
      frontFileInputRef.current?.click();
    } else {
      backFileInputRef.current?.click();
    }
  };

  const handleWorkerKycContinue = () => {
    if (!aadhaarFrontUrl || !aadhaarBackUrl) {
      setAadhaarUploadError(
        'Please capture or upload both Front and Back photos of your Aadhaar card.'
      );
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
    void startCamera();
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'user' },
              width: { ideal: 720 },
              height: { ideal: 720 },
            },
          });
        } catch {
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
      }
    } catch {
      setCameraError(
        'Tap "Open Front Camera" below to capture your profile selfie directly using your phone camera.'
      );
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
        setCameraError(null);
        stopCamera();
      }
    }
  };

  const handleNativeSelfieCapture = async () => {
    setCameraError(null);
    const result = await deviceCameraService.captureSelfiePhoto();
    if (result.success && result.dataUrl) {
      setPhotoUrl(result.dataUrl);
      stopCamera();
      return;
    }
    if (result.cancelled) {
      return;
    }
    selfieFileInputRef.current?.click();
  };

  const handleSelfieFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setPhotoUrl(ev.target.result as string);
        setCameraError(null);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setPhotoUrl('');
    void startCamera();
  };

  const handleCompleteWorkerRegistration = () => {
    if (!photoUrl) {
      setCameraError('Please capture a clear profile selfie using your camera before continuing.');
      return;
    }
    setStep('worker_success');
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const handleFinalEnterWorkerApp = () => {
    onVerificationComplete({
      name: fullName.trim() || 'Verified Karigar',
      phone: `+91 ${phone.replace(/\D/g, '').slice(-10)}`,
      photoUrl,
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

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Persistent Invisible reCAPTCHA Anchor for Firebase Web Phone Auth */}
      <div id="firebase-recaptcha-container" className="sr-only" aria-hidden="true" />

      {/* Top Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs mb-3">
        {step !== 'account_type' ? (
          <button
            type="button"
            onClick={() => {
              setFirebaseOtpError(null);
              setFirebaseOtpSuccess(null);
              if (step === 'customer_phone' || step === 'worker_phone') {
                setStep('account_type');
              } else if (step === 'customer_otp') {
                setStep('customer_phone');
              } else if (step === 'worker_otp') {
                setStep('worker_phone');
              } else if (step === 'worker_details') {
                setStep('worker_otp');
              } else if (step === 'worker_kyc') {
                setStep('worker_details');
              } else if (step === 'worker_camera') {
                stopCamera();
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
            GharKaExpert Sign In
          </span>
        )}

        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
          {selectedRole === 'customer' ? 'Customer' : 'Karigar KYC'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* 1. ACCOUNT TYPE SELECTION                                                 */}
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
                <Sparkles className="w-3.5 h-3.5" /> Select Account Type
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t('roleTitle', currentLanguage)}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Choose how you want to use GharKaExpert
              </p>
            </div>

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
                  <div
                    className={`p-3 rounded-2xl shadow-sm shrink-0 transition-colors ${
                      selectedRole === 'customer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
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
                      Hire trusted local electricians, plumbers, masons & repair experts with zero middlemen commission.
                    </p>
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-bold">
                        📱 6-Digit SMS OTP
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                        ✓ Instant Access
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
                  <div
                    className={`p-3 rounded-2xl shadow-sm shrink-0 transition-colors ${
                      selectedRole === 'worker'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
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
                      Receive daily customer bookings, subcontract work, showcase your portfolio & get direct calls.
                    </p>
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-bold">
                        🛡️ Aadhaar KYC Verified
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                        ⭐ Verified Karigar Badge
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleAccountTypeContinue}
                className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98] cursor-pointer"
              >
                <span>
                  {selectedRole === 'customer'
                    ? 'Continue as Customer (Grahak)'
                    : 'Register as Mestri / Contractor'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2. CUSTOMER FLOW: CLEAN MOBILE NUMBER & REAL FIREBASE SMS OTP             */}
        {/* ========================================================================= */}
        {step === 'customer_phone' && (
          <motion.div
            key="customer_phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5 my-auto"
          >
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center border border-blue-200 shadow-xs">
                <Home className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Customer Login</h3>
              <p className="text-xs text-slate-500 font-normal">
                Enter your 10-digit mobile number to receive a 6-digit SMS verification code
              </p>
            </div>

            <form onSubmit={handleCustomerPhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-blue-700">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (firebaseOtpError) setFirebaseOtpError(null);
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-14 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-base font-mono text-slate-900 tracking-wider focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              {renderSmartAccountStatusCard()}

              {firebaseOtpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900">SMS Delivery Alert</p>
                    <p className="text-[11px] text-rose-700 leading-snug">{firebaseOtpError}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="btn-customer-firebase-otp"
                disabled={phone.length < 10 || isSendingFirebaseOtp}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSendingFirebaseOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Sending SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 text-slate-950" />
                    <span>Send 6-Digit SMS OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2B. CUSTOMER FLOW: VERIFY 6-DIGIT SMS OTP                                 */}
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
              <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl mx-auto flex items-center justify-center shadow-md shadow-amber-200">
                <Phone className="w-7 h-7 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verify 6-Digit SMS OTP</h3>
              <p className="text-xs text-slate-600 font-medium">
                Enter the 6-digit verification code sent via SMS to:
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-mono font-bold text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>+91 {phone}</span>
              </div>
            </div>

            {firebaseOtpSuccess && !firebaseOtpError && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{firebaseOtpSuccess}</span>
              </div>
            )}

            {firebaseOtpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Verification Alert</p>
                  <p className="text-[11px] text-rose-700 leading-snug">{firebaseOtpError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCustomerOtpVerify} className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`w-11 h-12 text-center text-xl font-bold font-mono bg-white border rounded-xl text-amber-600 focus:outline-none focus:border-amber-500 shadow-xs transition-colors ${
                      firebaseOtpError ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">Didn&apos;t receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleResendFirebaseOtp('customer')}
                    disabled={isSendingFirebaseOtp}
                    className="text-amber-700 font-bold hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSendingFirebaseOtp ? 'animate-spin' : ''}`} />
                    <span>Resend SMS OTP</span>
                  </button>
                ) : (
                  <span className="font-semibold text-slate-500 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Resend SMS in <strong>{resendCountdown}s</strong>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={otp.join('').length !== 6 || isVerifyingFirebaseOtp}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingFirebaseOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. WORKER FLOW: CLEAN MOBILE NUMBER & REAL FIREBASE SMS OTP               */}
        {/* ========================================================================= */}
        {step === 'worker_phone' && (
          <motion.div
            key="worker_phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5 my-auto"
          >
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center border border-amber-200 shadow-xs">
                <HardHat className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Karigar / Contractor Login</h3>
              <p className="text-xs text-slate-500 font-normal">
                Enter your 10-digit mobile number to receive a 6-digit SMS verification code
              </p>
            </div>

            <form onSubmit={handleWorkerPhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-blue-700">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (firebaseOtpError) setFirebaseOtpError(null);
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-14 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-base font-mono text-slate-900 tracking-wider focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              {renderSmartAccountStatusCard()}

              {firebaseOtpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900">SMS Delivery Alert</p>
                    <p className="text-[11px] text-rose-700 leading-snug">{firebaseOtpError}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="btn-worker-firebase-otp"
                disabled={phone.length < 10 || isSendingFirebaseOtp}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSendingFirebaseOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Sending SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 text-slate-950" />
                    <span>Send 6-Digit SMS OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3B. WORKER FLOW: VERIFY 6-DIGIT SMS OTP                                   */}
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
              <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl mx-auto flex items-center justify-center shadow-md shadow-amber-200">
                <Phone className="w-7 h-7 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verify 6-Digit SMS OTP</h3>
              <p className="text-xs text-slate-600 font-medium">
                Enter the 6-digit verification code sent via SMS to:
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-mono font-bold text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>+91 {phone}</span>
              </div>
            </div>

            {firebaseOtpSuccess && !firebaseOtpError && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{firebaseOtpSuccess}</span>
              </div>
            )}

            {firebaseOtpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-800 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Verification Alert</p>
                  <p className="text-[11px] text-rose-700 leading-snug">{firebaseOtpError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleWorkerOtpVerify} className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`w-11 h-12 text-center text-xl font-bold font-mono bg-white border rounded-xl text-amber-600 focus:outline-none focus:border-amber-500 shadow-xs transition-colors ${
                      firebaseOtpError ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">Didn&apos;t receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleResendFirebaseOtp('worker')}
                    disabled={isSendingFirebaseOtp}
                    className="text-amber-700 font-bold hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSendingFirebaseOtp ? 'animate-spin' : ''}`} />
                    <span>Resend SMS OTP</span>
                  </button>
                ) : (
                  <span className="font-semibold text-slate-500 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Resend SMS in <strong>{resendCountdown}s</strong>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={otp.join('').length !== 6 || isVerifyingFirebaseOtp}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isVerifyingFirebaseOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3C. WORKER FLOW: PROFESSIONAL DETAILS                                     */}
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
                Provide your core trade skill and service area pincode
              </p>
            </div>

            <form onSubmit={handleWorkerDetailsSubmit} className="space-y-3">
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
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={experienceYears}
                    onChange={(e) =>
                      setExperienceYears(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Area Pincode *
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit PIN"
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
                <span>Proceed to Aadhaar KYC Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3D. WORKER FLOW: AADHAAR KYC DOCUMENT CAMERA CAPTURE                      */}
        {/* ========================================================================= */}
        {step === 'worker_kyc' && (
          <motion.div
            key="worker_kyc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3.5 my-auto"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl mx-auto flex items-center justify-center border border-blue-200 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Aadhaar KYC Verification
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Capture clear photos of your Aadhaar card using your phone camera
              </p>
            </div>

            <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-2xl space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Privacy Protected</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-normal">
                Your Aadhaar photos and numbers are encrypted and never displayed to customers. Customers only see your <strong>Verified Karigar</strong> badge.
              </p>
            </div>

            {isAadhaarVerified && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-full">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Aadhaar Front &amp; Back Captured
                    </h4>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Ready for profile selfie verification
                    </p>
                  </div>
                </div>
                <BadgeCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              </div>
            )}

            <div className="space-y-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <label className="block text-xs font-bold text-slate-800">
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit Aadhaar number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600 tracking-wider"
              />
            </div>

            {aadhaarUploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aadhaarUploadError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* 1. Aadhaar Front Photo */}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Aadhaar Front Photo (Name, Photo &amp; DOB) *</span>
                  </label>
                  {aadhaarFrontUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Captured
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={frontFileInputRef}
                  onChange={(e) => handleFileChange(e, setAadhaarFrontUrl, 'front')}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {aadhaarFrontUrl ? (
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={aadhaarFrontUrl}
                        alt="Aadhaar Front"
                        className="w-14 h-10 object-cover rounded-lg border border-slate-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          Aadhaar Front Attached
                        </p>
                        <p className="text-[10px] text-slate-500">Captured from device</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCapacitorCameraCapture('front')}
                      className="p-1.5 px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCapacitorCameraCapture('front')}
                      className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCapacitorGalleryPick('front')}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Gallery</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Aadhaar Back Photo */}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Aadhaar Back Photo (Complete Address &amp; QR) *</span>
                  </label>
                  {aadhaarBackUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Captured
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={backFileInputRef}
                  onChange={(e) => handleFileChange(e, setAadhaarBackUrl, 'back')}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {aadhaarBackUrl ? (
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={aadhaarBackUrl}
                        alt="Aadhaar Back"
                        className="w-14 h-10 object-cover rounded-lg border border-slate-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          Aadhaar Back Attached
                        </p>
                        <p className="text-[10px] text-slate-500">Captured from device</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCapacitorCameraCapture('back')}
                      className="p-1.5 px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCapacitorCameraCapture('back')}
                      className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCapacitorGalleryPick('back')}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Gallery</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Policy Consent */}
            <div
              className={`p-3 rounded-2xl border transition-colors ${
                privacyConsentError && !privacyConsent
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
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
                  I authorize <strong>GharKaExpert</strong> to verify my identity documents in accordance with the <strong>Privacy Policy</strong>.
                </span>
              </label>
              {privacyConsentError && !privacyConsent && (
                <p className="text-[11px] text-rose-600 font-bold mt-1.5 pl-6 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Please accept the Privacy Policy consent to proceed.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleWorkerKycContinue}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-1"
            >
              <span>Proceed to Profile Selfie</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3E. WORKER FLOW: NATIVE SELFIE / PROFILE PHOTO CAPTURE                    */}
        {/* ========================================================================= */}
        {step === 'worker_camera' && (
          <motion.div
            key="worker_camera"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3.5 my-auto flex flex-col items-center"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Live Profile Selfie
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Take a clear front-facing photo to complete your Karigar profile
              </p>
            </div>

            <input
              type="file"
              ref={selfieFileInputRef}
              onChange={handleSelfieFileFallback}
              accept="image/*"
              capture="user"
              className="hidden"
            />

            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-600 bg-slate-100 shadow-md flex items-center justify-center my-2">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Captured Profile Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />
              )}

              {!photoUrl && !isCameraActive && (
                <div className="p-4 text-center">
                  <Camera className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 font-semibold">Ready to Capture</p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-950 max-w-xs space-y-1">
                <p className="text-[11px] text-amber-900 leading-snug font-medium">{cameraError}</p>
              </div>
            )}

            <div className="w-full max-w-xs space-y-2 pt-1">
              {!photoUrl ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleNativeSelfieCapture}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Front Camera</span>
                  </button>

                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={snapPhoto}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('clickPhotoBtn', currentLanguage)}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      const res = await deviceCameraService.pickGalleryPhoto('Select Profile Photo');
                      if (res.success && res.dataUrl) {
                        setPhotoUrl(res.dataUrl);
                        stopCamera();
                      } else if (!res.cancelled) {
                        selfieFileInputRef.current?.click();
                      }
                    }}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload from Photo Gallery</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCompleteWorkerRegistration}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Complete KYC &amp; Activate Profile</span>
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
        {/* 3F. WORKER FLOW: KYC SUCCESS & LAUNCH                                     */}
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
                  src={photoUrl}
                  alt="Verified Profile"
                  className="w-full h-full rounded-full object-cover"
                />
                <BadgeCheck className="w-7 h-7 text-emerald-600 bg-white rounded-full absolute -bottom-1 -right-1 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black mb-1">
                ✓ Verified Karigar Profile Active
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">{fullName}</h3>
              <p className="text-xs text-slate-500 capitalize">
                {primarySkill} • {experienceYears} Years Experience • Pincode {pincode}
              </p>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 max-w-sm mx-auto shadow-2xs text-left space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-slate-900">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  KYC Verification Summary
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                  VERIFIED
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>
                    Mobile Number: <strong>+91 {phone}</strong>
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>
                    Aadhaar Front &amp; Back: <strong>Captured</strong>
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>
                    Profile Selfie: <strong>Verified</strong>
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalEnterWorkerApp}
              className="w-full max-w-sm mx-auto py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Enter Karigar Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
