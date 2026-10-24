import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
  UserCredential,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export interface FirebasePhoneAuthResponse {
  success: boolean;
  verificationId: string;
  autoVerified?: boolean;
  userCredential?: UserCredential | null;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  userCredential?: UserCredential | null;
  uid?: string;
  error?: string;
}

interface PendingPhoneVerification {
  phone: string;
  e164Phone: string;
  confirmationResult?: ConfirmationResult;
  nativeVerificationId?: string;
  nativeAutoVerifiedUid?: string;
}

class FirebasePhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private recaptchaWidgetContainerId: string | null = null;
  private pendingSessions = new Map<string, PendingPhoneVerification>();

  /**
   * Normalizes phone number to 10-digit Indian mobile number
   */
  public normalizePhone(rawPhone: string): string {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    return digits;
  }

  /**
   * Validates Indian 10-digit mobile number and formats to E.164 (+91XXXXXXXXXX)
   */
  public formatToE164(phone: string): string {
    const clean = this.normalizePhone(phone);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }
    return `+91${clean}`;
  }

  /**
   * Cleanly destroys any existing RecaptchaVerifier instance and resets its DOM container
   */
  public clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch {
        // Ignore cleanup errors on unmounted nodes
      }
      this.recaptchaVerifier = null;
    }

    if (typeof document !== 'undefined' && this.recaptchaWidgetContainerId) {
      const existing = document.getElementById(this.recaptchaWidgetContainerId);
      if (existing) {
        existing.innerHTML = '';
      }
    }
    this.recaptchaWidgetContainerId = null;
  }

  /**
   * Creates a fresh Firebase RecaptchaVerifier attached to a live DOM element
   */
  private async initRecaptchaVerifier(containerId = 'firebase-recaptcha-container'): Promise<RecaptchaVerifier> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Firebase Phone Auth requires a browser or native mobile runtime.');
    }

    this.clearRecaptcha();

    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    } else {
      container.innerHTML = '';
    }

    this.recaptchaWidgetContainerId = containerId;
    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      'expired-callback': () => {
        this.clearRecaptcha();
      },
    });

    await verifier.render();
    this.recaptchaVerifier = verifier;
    return verifier;
  }

  /**
   * Maps Firebase Auth error codes to clear, actionable messages
   */
  private formatFirebaseAuthError(err: unknown): string {
    const firebaseErr = err as { code?: string; message?: string };
    const code = firebaseErr?.code || '';
    const rawMsg = firebaseErr?.message || '';

    if (code === 'auth/invalid-phone-number') {
      return 'Invalid mobile number. Please check the 10-digit number and try again.';
    }
    if (code === 'auth/missing-phone-number') {
      return 'Please enter your 10-digit mobile number.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many OTP requests for this number or device. Please wait a few minutes before trying again.';
    }
    if (code === 'auth/quota-exceeded') {
      return 'SMS OTP quota temporarily exceeded for this project. Please try again later.';
    }
    if (code === 'auth/operation-not-allowed' || rawMsg.includes('OPERATION_NOT_ALLOWED')) {
      return 'Phone SMS Sign-In is not enabled yet in Firebase Console. Please enable Authentication > Sign-in method > Phone in Firebase Console (charming-acronym-rt3g1).';
    }
    if (code === 'auth/unauthorized-domain') {
      return `This domain (${typeof window !== 'undefined' ? window.location.hostname : 'app'}) is not authorized in Firebase Console. Add it under Authentication > Settings > Authorized domains.`;
    }
    if (code === 'auth/captcha-check-failed' || code === 'auth/invalid-app-credential') {
      return 'Security verification (reCAPTCHA) failed. Please refresh and try again.';
    }
    if (code === 'auth/invalid-verification-code') {
      return 'Incorrect 6-digit SMS OTP. Please check your SMS messages and enter the exact code.';
    }
    if (code === 'auth/code-expired' || code === 'auth/session-expired') {
      return 'This SMS OTP has expired. Please tap "Resend SMS OTP" to receive a new code.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network error while contacting Firebase Authentication. Please check your internet connection.';
    }

    return rawMsg || 'Unable to complete SMS authentication. Please try again.';
  }

  /**
   * Sends a real 6-digit SMS OTP via Capacitor Native Firebase Auth (Android/iOS)
   * or Firebase Web SDK signInWithPhoneNumber (Web/PWA).
   */
  public async sendFirebaseSmsOtp(
    phone: string,
    _role: 'customer' | 'worker',
    containerId = 'firebase-recaptcha-container'
  ): Promise<FirebasePhoneAuthResponse> {
    const cleanPhone = this.normalizePhone(phone);
    const fullPhone = this.formatToE164(cleanPhone);

    // 1. Native Android / iOS Capacitor Execution Path
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.removeAllListeners();

        const verificationPromise = new Promise<{
          verificationId?: string;
          autoVerifiedUid?: string;
        }>((resolve, reject) => {
          let settled = false;

          void FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
            if (!settled) {
              settled = true;
              resolve({ verificationId: event.verificationId });
            }
          });

          void FirebaseAuthentication.addListener('phoneVerificationCompleted', (event) => {
            if (!settled) {
              settled = true;
              resolve({ autoVerifiedUid: event.user?.uid });
            }
          });

          void FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
            if (!settled) {
              settled = true;
              reject(new Error(event.message || 'Phone SMS verification failed on device.'));
            }
          });

          FirebaseAuthentication.signInWithPhoneNumber({
            phoneNumber: fullPhone,
          }).catch((err) => {
            if (!settled) {
              settled = true;
              reject(err);
            }
          });
        });

        const nativeResult = await verificationPromise;
        const verificationId = nativeResult.verificationId || 'native_auto_verified';

        this.pendingSessions.set(cleanPhone, {
          phone: cleanPhone,
          e164Phone: fullPhone,
          nativeVerificationId: nativeResult.verificationId,
          nativeAutoVerifiedUid: nativeResult.autoVerifiedUid,
        });

        return {
          success: true,
          verificationId,
          autoVerified: Boolean(nativeResult.autoVerifiedUid),
        };
      } catch (err: unknown) {
        throw new Error(this.formatFirebaseAuthError(err));
      }
    }

    // 2. Standard Firebase JS SDK Execution Path (signInWithPhoneNumber + RecaptchaVerifier)
    try {
      const verifier = await this.initRecaptchaVerifier(containerId);
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, verifier);

      this.pendingSessions.set(cleanPhone, {
        phone: cleanPhone,
        e164Phone: fullPhone,
        confirmationResult,
      });

      return {
        success: true,
        verificationId: confirmationResult.verificationId,
      };
    } catch (err: unknown) {
      this.clearRecaptcha();
      throw new Error(this.formatFirebaseAuthError(err));
    }
  }

  /**
   * Verifies the 6-digit SMS OTP entered by the user against Firebase Authentication
   */
  public async verifyFirebaseSmsOtp(phone: string, enteredCode: string): Promise<VerifyOtpResponse> {
    const cleanPhone = this.normalizePhone(phone);
    const code = enteredCode.replace(/\D/g, '');

    if (code.length !== 6) {
      return {
        success: false,
        verified: false,
        error: 'Please enter the complete 6-digit SMS OTP.',
      };
    }

    const session = this.pendingSessions.get(cleanPhone);
    if (!session) {
      return {
        success: false,
        verified: false,
        error: 'No active SMS verification session found. Please tap "Resend SMS OTP".',
      };
    }

    // 1. Native Android / iOS Capacitor Verification
    if (Capacitor.isNativePlatform()) {
      try {
        if (session.nativeAutoVerifiedUid) {
          this.pendingSessions.delete(cleanPhone);
          return {
            success: true,
            verified: true,
            uid: session.nativeAutoVerifiedUid,
          };
        }

        if (!session.nativeVerificationId) {
          return {
            success: false,
            verified: false,
            error: 'Verification ID missing. Please tap "Resend SMS OTP".',
          };
        }

        const result = await FirebaseAuthentication.confirmVerificationCode({
          verificationId: session.nativeVerificationId,
          verificationCode: code,
        });

        // Sync Firebase JS SDK auth state when possible
        let webCredential: UserCredential | null = null;
        try {
          const phoneCred = PhoneAuthProvider.credential(session.nativeVerificationId, code);
          webCredential = await signInWithCredential(auth, phoneCred);
        } catch {
          // Native auth session already established via Capacitor FirebaseAuthentication
        }

        this.pendingSessions.delete(cleanPhone);
        return {
          success: true,
          verified: true,
          userCredential: webCredential,
          uid: result.user?.uid || webCredential?.user?.uid,
        };
      } catch (err: unknown) {
        return {
          success: false,
          verified: false,
          error: this.formatFirebaseAuthError(err),
        };
      }
    }

    // 2. Standard Firebase JS SDK Confirmation
    if (!session.confirmationResult) {
      return {
        success: false,
        verified: false,
        error: 'Active SMS session expired. Please tap "Resend SMS OTP".',
      };
    }

    try {
      const userCredential = await session.confirmationResult.confirm(code);
      this.pendingSessions.delete(cleanPhone);
      this.clearRecaptcha();

      return {
        success: true,
        verified: true,
        userCredential,
        uid: userCredential.user.uid,
      };
    } catch (err: unknown) {
      return {
        success: false,
        verified: false,
        error: this.formatFirebaseAuthError(err),
      };
    }
  }
}

export const firebasePhoneAuthService = new FirebasePhoneAuthService();
