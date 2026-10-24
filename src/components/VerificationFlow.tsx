import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Home,
  HardHat,
  Hammer,
  Phone,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
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
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#1E3A8A"/><circle cx="60" cy="46" r="22" fill="#DBEAFE"/><path d="M24 104c6-20 22-30 36-30s30 10 36 30" fill="#DBEAFE"/></svg>'
  );

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
      <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Verify Account Ownership</span>
        </div>

        <p className="text-[11px] text-amber-900 leading-snug">
          A previous account was found for this number. Enter your registered name to restore your account, or start a fresh profile:
        </p>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700">Name Hint:</span>
            <span className="font-mono font-bold text-amber-900">
              {authCheckResult.previousAccountNameHint || '*****'}
            </span>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={securityPromptName}
              onChange={(e) => setSecurityPromptName(e.target.value)}
              placeholder="Enter previous registered name"
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600"
            />
            <button
              type="button"
              onClick={handleVerifySecurityName}
              disabled={isVerifyingSecurityPrompt || !securityPromptName.trim()}
              className="min-h-[40px] px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0 whitespace-nowrap"
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

          <div className="pt-1.5 border-t border-amber-200/70 flex items-center justify-between text-[11px]">
            <span className="text-slate-600">New owner of this number?</span>
            <button
              type="button"
              onClick={handleClaimAsNewSimOwner}
              disabled={isVerifyingSecurityPrompt}
              className="text-blue-700 hover:text-blue-800 font-bold underline cursor-pointer whitespace-nowrap"
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
    }, 200);
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
      }, 200);
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

    if (result.permissionDenied && result.error) {
      setAadhaarUploadError(result.error);
      return;
    }

    if (side === 'front') {
      frontFileInputRef.current?.click();
    } else {
      backFileInputRef.current?.click();
    }
  };

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

    if (result.permissionDenied && result.error) {
      setAadhaarUploadError(result.error);
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
    if (result.permissionDenied && result.error) {
      setCameraError(result.error);
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

  const handleBackNavigation = () => {
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
  };

  return (
    <div className="min-h-dvh flex-1 w-full bg-[#1E3A8A] text-white px-4 py-5 sm:px-6 sm:py-6 flex flex-col justify-start relative overflow-x-hidden">
      {/* Persistent Invisible reCAPTCHA Anchor for Firebase Web Phone Auth */}
      <div id="firebase-recaptcha-container" className="sr-only" aria-hidden="true" />

      {/* Top Navigation & Brand Header Inside Solid Deep Blue Area */}
      <div className="w-full space-y-4 mb-5">
        <div className="flex items-center justify-between min-h-[44px]">
          {step !== 'account_type' ? (
            <button
              type="button"
              onClick={handleBackNavigation}
              className="min-h-[44px] px-3 -ml-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-blue-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Direct Hiring · 0% Commission</span>
            </span>
          )}

          <div className="text-xs font-medium text-blue-100 whitespace-nowrap shrink-0">
            {selectedRole === 'customer' ? 'Customer Account' : 'Karigar Account'}
          </div>
        </div>

        {/* App Logo & Brand Name Positioned Cleanly at Top */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="relative w-14 h-14 bg-white text-[#1E3A8A] rounded-2xl shadow-lg flex items-center justify-center shrink-0">
            <HardHat className="w-7 h-7 text-[#1E3A8A] stroke-[2.2]" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 text-slate-950 rounded-lg flex items-center justify-center shadow-sm">
              <Hammer className="w-3.5 h-3.5 stroke-[2.4]" />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              GharKaExpert
            </h1>
            <p className="text-xs text-blue-100 font-medium mt-0.5 leading-snug">
              {t('tagline', currentLanguage)}
            </p>
          </div>
        </div>
      </div>

      {/* Main White Container Card Wrapping Forms, Inputs & Buttons */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* 1. ACCOUNT TYPE SELECTION                                                 */}
        {/* ========================================================================= */}
        {step === 'account_type' && (
          <motion.div
            key="account_type"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {t('roleTitle', currentLanguage)}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Select your role to sign in or create an account
              </p>
            </div>

            {/* Role Switcher Cards */}
            <div className="space-y-3">
              {/* CUSTOMER OPTION */}
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer ${
                  selectedRole === 'customer'
                    ? 'bg-blue-50/70 border-blue-600'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      selectedRole === 'customer'
                        ? 'bg-[#1E3A8A] text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <Home className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {t('roleCustomer', currentLanguage)}
                      </h3>
                      {selectedRole === 'customer' && (
                        <div className="w-5 h-5 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Hire verified local electricians, plumbers, masons &amp; technicians directly.
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                      6-Digit SMS OTP · No ID Documents Needed
                    </p>
                  </div>
                </div>
              </button>

              {/* WORKER / KARIGAR OPTION */}
              <button
                type="button"
                onClick={() => setSelectedRole('worker')}
                className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer ${
                  selectedRole === 'worker'
                    ? 'bg-amber-50/80 border-amber-500'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      selectedRole === 'worker'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <HardHat className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {t('roleWorker', currentLanguage)}
                      </h3>
                      {selectedRole === 'worker' && (
                        <div className="w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Receive daily bookings, subcontract jobs, showcase your work &amp; get direct calls.
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                      Aadhaar KYC · Verified Karigar Profile
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAccountTypeContinue}
              className="w-full min-h-[48px] py-3.5 px-5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <span>
                {selectedRole === 'customer'
                  ? 'Continue to Customer Login'
                  : 'Continue to Worker Login'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2. CUSTOMER LOGIN SCREEN (WHITE CONTAINER CARD ON DEEP BLUE)              */}
        {/* ========================================================================= */}
        {step === 'customer_phone' && (
          <motion.div
            key="customer_phone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
          >
            {/* Role Tab Switcher Inside White Card for Instant Switching */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('customer');
                  setFirebaseOtpError(null);
                  setStep('customer_phone');
                }}
                className="min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold bg-white text-[#1E3A8A] shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Customer Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('worker');
                  setFirebaseOtpError(null);
                  setStep('worker_phone');
                }}
                className="min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
              >
                Worker Login
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Customer Login</h2>
                <p className="text-xs text-slate-500">
                  Enter your mobile number to receive a 6-digit SMS OTP
                </p>
              </div>
            </div>

            <form onSubmit={handleCustomerPhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-[#1E3A8A] select-none">
                    +91
                  </span>
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
                    className="w-full min-h-[48px] pl-14 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono tabular-nums text-slate-900 tracking-wider focus:bg-white focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-900/15"
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
                className="w-full min-h-[48px] py-3.5 px-5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isSendingFirebaseOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 text-amber-300" />
                    <span>Send 6-Digit SMS OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2B. CUSTOMER OTP VERIFICATION (WHITE CONTAINER CARD ON DEEP BLUE)         */}
        {/* ========================================================================= */}
        {step === 'customer_otp' && (
          <motion.div
            key="customer_otp"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Verify 6-Digit SMS OTP
              </h2>
              <p className="text-xs text-slate-600">
                Code sent via SMS to{' '}
                <strong className="font-mono tabular-nums text-slate-900">+91 {phone}</strong>
              </p>
            </div>

            {firebaseOtpSuccess && !firebaseOtpError && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
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
              <div className="flex justify-between gap-2">
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
                    className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-bold font-mono tabular-nums bg-slate-50 border rounded-xl text-[#1E3A8A] focus:bg-white focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-900/15 transition-colors ${
                      firebaseOtpError ? 'border-rose-300' : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-500">Didn&apos;t receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleResendFirebaseOtp('customer')}
                    disabled={isSendingFirebaseOtp}
                    className="min-h-[36px] px-2 text-[#1E3A8A] font-bold hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSendingFirebaseOtp ? 'animate-spin' : ''}`} />
                    <span>Resend SMS OTP</span>
                  </button>
                ) : (
                  <span className="font-semibold text-slate-600 font-mono tabular-nums">
                    Resend in {resendCountdown}s
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={otp.join('').length !== 6 || isVerifyingFirebaseOtp}
                className="w-full min-h-[48px] py-3.5 px-5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isVerifyingFirebaseOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3. WORKER LOGIN SCREEN (WHITE CONTAINER CARD ON DEEP BLUE)                */}
        {/* ========================================================================= */}
        {step === 'worker_phone' && (
          <motion.div
            key="worker_phone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
          >
            {/* Role Tab Switcher Inside White Card */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('customer');
                  setFirebaseOtpError(null);
                  setStep('customer_phone');
                }}
                className="min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
              >
                Customer Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('worker');
                  setFirebaseOtpError(null);
                  setStep('worker_phone');
                }}
                className="min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold bg-white text-[#1E3A8A] shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Worker Login
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center border border-amber-200 shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Worker / Karigar Login
                </h2>
                <p className="text-xs text-slate-500">
                  Enter your mobile number to receive a 6-digit SMS OTP
                </p>
              </div>
            </div>

            <form onSubmit={handleWorkerPhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-[#1E3A8A] select-none">
                    +91
                  </span>
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
                    className="w-full min-h-[48px] pl-14 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono tabular-nums text-slate-900 tracking-wider focus:bg-white focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-900/15"
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
                className="w-full min-h-[48px] py-3.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
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
        {/* 3B. WORKER OTP VERIFICATION (WHITE CONTAINER CARD ON DEEP BLUE)           */}
        {/* ========================================================================= */}
        {step === 'worker_otp' && (
          <motion.div
            key="worker_otp"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Verify 6-Digit SMS OTP
              </h2>
              <p className="text-xs text-slate-600">
                Code sent via SMS to{' '}
                <strong className="font-mono tabular-nums text-slate-900">+91 {phone}</strong>
              </p>
            </div>

            {firebaseOtpSuccess && !firebaseOtpError && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
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
              <div className="flex justify-between gap-2">
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
                    className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-bold font-mono tabular-nums bg-slate-50 border rounded-xl text-[#1E3A8A] focus:bg-white focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-900/15 transition-colors ${
                      firebaseOtpError ? 'border-rose-300' : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-500">Didn&apos;t receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleResendFirebaseOtp('worker')}
                    disabled={isSendingFirebaseOtp}
                    className="min-h-[36px] px-2 text-[#1E3A8A] font-bold hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSendingFirebaseOtp ? 'animate-spin' : ''}`} />
                    <span>Resend SMS OTP</span>
                  </button>
                ) : (
                  <span className="font-semibold text-slate-600 font-mono tabular-nums">
                    Resend in {resendCountdown}s
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={otp.join('').length !== 6 || isVerifyingFirebaseOtp}
                className="w-full min-h-[48px] py-3.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isVerifyingFirebaseOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying SMS OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3C. WORKER PROFESSIONAL DETAILS (WHITE CARD ON DEEP BLUE)                 */}
        {/* ========================================================================= */}
        {step === 'worker_details' && (
          <motion.div
            key="worker_details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Karigar Professional Details
                </h3>
                <p className="text-xs text-slate-500">
                  Provide your trade skill and service area pincode
                </p>
              </div>
            </div>

            <form onSubmit={handleWorkerDetailsSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Skill / Category (मुख्य काम) *
                </label>
                <div className="relative flex items-center">
                  <Wrench className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={primarySkill}
                    onChange={(e) => setPrimarySkill(e.target.value as TradeCategory)}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-sm focus:bg-white focus:outline-none focus:border-[#1E3A8A] appearance-none cursor-pointer"
                  >
                    {WORKER_SKILL_OPTIONS.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.icon} {skill.labelEn} — {skill.labelHi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold font-mono tabular-nums text-sm focus:bg-white focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area Pincode *
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit PIN"
                      className="w-full min-h-[44px] pl-8 pr-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono tabular-nums font-bold text-sm focus:bg-white focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={fullName.trim().length < 2 || pincode.length !== 6}
                className="w-full min-h-[48px] py-3.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer mt-2 whitespace-nowrap"
              >
                <span>Proceed to Aadhaar KYC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3D. WORKER AADHAAR KYC CAMERA CAPTURE (WHITE CARD ON DEEP BLUE)           */}
        {/* ========================================================================= */}
        {step === 'worker_kyc' && (
          <motion.div
            key="worker_kyc"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Aadhaar KYC Verification</h3>
                <p className="text-xs text-slate-500">
                  Capture Front and Back photos of your Aadhaar card
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-0.5">
              <div className="flex items-center gap-1.5 text-[#1E3A8A] font-bold text-xs">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Encrypted Identity Verification</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Aadhaar details remain private and are never shown to customers. Customers only see your Verified Karigar status.
              </p>
            </div>

            {isAadhaarVerified && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-950">
                    Aadhaar Front &amp; Back Captured
                  </span>
                </div>
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit Aadhaar number"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono tabular-nums text-xs focus:bg-white focus:outline-none focus:border-[#1E3A8A] tracking-wider"
              />
            </div>

            {aadhaarUploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aadhaarUploadError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* 1. Aadhaar Front Photo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>1. Aadhaar Front Photo *</span>
                  </label>
                  {aadhaarFrontUrl && (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Captured
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
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={aadhaarFrontUrl}
                        alt="Aadhaar Front"
                        referrerPolicy="no-referrer"
                        className="w-14 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Front Card Attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCapacitorCameraCapture('front')}
                      className="min-h-[36px] px-2.5 bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
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
                      className="flex-1 min-h-[42px] py-2 px-3 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCapacitorGalleryPick('front')}
                      className="min-h-[42px] py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Gallery</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Aadhaar Back Photo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>2. Aadhaar Back Photo (Address) *</span>
                  </label>
                  {aadhaarBackUrl && (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Captured
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
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={aadhaarBackUrl}
                        alt="Aadhaar Back"
                        referrerPolicy="no-referrer"
                        className="w-14 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Back Card Attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCapacitorCameraCapture('back')}
                      className="min-h-[36px] px-2.5 bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
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
                      className="flex-1 min-h-[42px] py-2 px-3 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCapacitorGalleryPick('back')}
                      className="min-h-[42px] py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Gallery</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border transition-colors ${
                privacyConsentError && !privacyConsent
                  ? 'bg-rose-50 border-rose-300'
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
                  className="mt-0.5 w-4 h-4 text-[#1E3A8A] rounded border-slate-300 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-800 font-medium leading-snug">
                  I authorize <strong>GharKaExpert</strong> to verify my identity documents in accordance with the Privacy Policy.
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
              className="w-full min-h-[48px] py-3.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <span>Proceed to Profile Selfie</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 3E. WORKER LIVE SELFIE CAPTURE (WHITE CARD ON DEEP BLUE)                  */}
        {/* ========================================================================= */}
        {step === 'worker_camera' && (
          <motion.div
            key="worker_camera"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col items-center"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-[#1E3A8A]" />
                Live Profile Selfie
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
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

            <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-[#1E3A8A] bg-slate-100 shadow-sm flex items-center justify-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Captured Profile Selfie"
                  referrerPolicy="no-referrer"
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
                  <Camera className="w-8 h-8 text-[#1E3A8A] mx-auto mb-1" />
                  <p className="text-xs text-slate-600 font-semibold">Ready to Capture</p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-950 max-w-xs">
                <p className="text-[11px] text-amber-900 leading-snug font-medium">{cameraError}</p>
              </div>
            )}

            <div className="w-full space-y-2.5">
              {!photoUrl ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleNativeSelfieCapture}
                    className="w-full min-h-[48px] py-3.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Front Camera</span>
                  </button>

                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={snapPhoto}
                      className="w-full min-h-[44px] py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
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
                    className="w-full min-h-[44px] py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-500" />
                    <span>Upload from Photo Gallery</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCompleteWorkerRegistration}
                    className="w-full min-h-[48px] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Complete KYC &amp; Activate Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="w-full min-h-[44px] py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
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
        {/* 3F. WORKER KYC SUCCESS (WHITE CARD ON DEEP BLUE)                          */}
        {/* ========================================================================= */}
        {step === 'worker_success' && (
          <motion.div
            key="worker_success"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl text-center space-y-4"
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="relative w-full h-full bg-white rounded-full border-4 border-emerald-500 p-1 flex items-center justify-center shadow-sm">
                <img
                  src={photoUrl}
                  alt="Verified Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover"
                />
                <BadgeCheck className="w-7 h-7 text-emerald-600 bg-white rounded-full absolute -bottom-1 -right-1 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-700">
                Verified Karigar Profile Active
              </p>
              <h3 className="text-xl font-extrabold text-slate-900">{fullName}</h3>
              <p className="text-xs text-slate-500 capitalize">
                {primarySkill} · {experienceYears} Years Experience · Pincode {pincode}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 text-left space-y-1.5">
              <p className="font-bold text-slate-900 pb-1 border-b border-slate-200">
                KYC Verification Summary
              </p>
              <p className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Mobile Number</span>
                <strong className="font-mono tabular-nums text-slate-900">+91 {phone}</strong>
              </p>
              <p className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Aadhaar Front &amp; Back</span>
                <strong className="text-emerald-700">Captured</strong>
              </p>
              <p className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Profile Selfie</span>
                <strong className="text-emerald-700">Verified</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinalEnterWorkerApp}
              className="w-full min-h-[48px] py-3.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors whitespace-nowrap"
            >
              <span>Enter Karigar Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiet Footer Note on Deep Blue Canvas */}
      <div className="mt-auto pt-6 pb-2 text-center text-[11px] text-blue-200/90">
        GharKaExpert · Secure SMS Verification powered by Firebase
      </div>
    </div>
  );
};
