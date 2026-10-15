import { VipPlanTier, VipSubscriptionState, PaymentMethodType, PaymentTransactionResult } from '../types';

export interface PlanConfig {
  planType: VipPlanTier;
  title: string;
  tagline: string;
  amount: number;
  durationDays: number;
  perMonthText: string;
  savingsText?: string;
  popular?: boolean;
}

export const VIP_PLANS: Record<VipPlanTier, PlanConfig> = {
  monthly: {
    planType: 'monthly',
    title: 'Monthly VIP Plan',
    tagline: 'Full freedom from interstitial ads • 30 Days',
    amount: 99,
    durationDays: 30,
    perMonthText: '₹99 / Month',
  },
  yearly: {
    planType: 'yearly',
    title: 'Yearly VIP Plan',
    tagline: 'Best Value • 12 Full Months Unlimited Access',
    amount: 999,
    durationDays: 365,
    perMonthText: '₹83 / Month',
    savingsText: 'Save ₹189 (Best Value)',
    popular: true,
  },
};

export const POPULAR_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC', logoBg: 'bg-blue-900', textColor: 'text-white' },
  { id: 'SBI', name: 'State Bank of India', code: 'SBIN', logoBg: 'bg-sky-600', textColor: 'text-white' },
  { id: 'ICICI', name: 'ICICI Bank', code: 'ICIC', logoBg: 'bg-amber-700', textColor: 'text-white' },
  { id: 'AXIS', name: 'Axis Bank', code: 'UTIB', logoBg: 'bg-rose-900', textColor: 'text-white' },
  { id: 'KOTAK', name: 'Kotak Mahindra', code: 'KKBK', logoBg: 'bg-red-700', textColor: 'text-white' },
  { id: 'PNB', name: 'Punjab National Bank', code: 'PUNB', logoBg: 'bg-yellow-800', textColor: 'text-white' },
];

export const ALL_BANKS = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank',
  'IDFC FIRST Bank',
  'Yes Bank',
  'Federal Bank',
  'Bank of India',
  'Central Bank of India',
  'Indian Bank',
];

export const WALLET_PROVIDERS = [
  { id: 'paytm_wallet', name: 'Paytm Wallet', iconBg: 'bg-sky-500', balance: '₹420.00' },
  { id: 'phonepe_wallet', name: 'PhonePe Wallet', iconBg: 'bg-purple-600', balance: '₹150.00' },
  { id: 'amazon_pay', name: 'Amazon Pay Balance', iconBg: 'bg-amber-500', balance: '₹850.00' },
  { id: 'mobikwik', name: 'MobiKwik', iconBg: 'bg-blue-600', balance: '₹95.00' },
];

export const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', shortName: 'GPay', color: 'from-blue-600 via-emerald-600 to-amber-500', icon: 'gpay' },
  { id: 'phonepe', name: 'PhonePe', shortName: 'PhonePe', color: 'bg-purple-600', icon: 'phonepe' },
  { id: 'paytm', name: 'Paytm UPI', shortName: 'Paytm', color: 'bg-sky-500', icon: 'paytm' },
  { id: 'bhim', name: 'BHIM UPI', shortName: 'BHIM', color: 'bg-emerald-600', icon: 'bhim' },
];

export class PaymentService {
  private static STORAGE_KEY = 'gharkaexpert_vip_sub';

  /**
   * Calculate expiry date from today based on plan type
   * Monthly = 30 days from today
   * Yearly = 365 days from today
   */
  public static calculateExpiryDate(planType: VipPlanTier): { expiryDateIso: string; formattedDate: string; days: number } {
    const days = planType === 'yearly' ? 365 : 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);

    const formattedDate = expiry.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      expiryDateIso: expiry.toISOString(),
      formattedDate,
      days,
    };
  }

  /**
   * Generates a unique transaction payment ID in Razorpay style
   */
  public static generatePaymentId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let rand = '';
    for (let i = 0; i < 14; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `pay_${rand}`;
  }

  /**
   * Generates a unique order ID
   */
  public static generateOrderId(): string {
    const chars = '0123456789abcdef';
    let rand = '';
    for (let i = 0; i < 10; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `order_gke_${rand}`;
  }

  /**
   * Generates standard NPCI UPI URI intent for deep-linking into UPI apps on mobile
   */
  public static generateUpiUri(planType: VipPlanTier, app?: string): string {
    const plan = VIP_PLANS[planType];
    const merchantVpa = 'gharkaexpert.billing@icici';
    const merchantName = encodeURIComponent('GharKaExpert Services');
    const transactionNote = encodeURIComponent(`VIP ${plan.title} - 0 Ads`);
    const amount = plan.amount.toFixed(2);
    const orderId = this.generateOrderId();

    // Standard NPCI UPI URI Specification
    let uri = `upi://pay?pa=${merchantVpa}&pn=${merchantName}&am=${amount}&cu=INR&tn=${transactionNote}&tr=${orderId}`;

    if (app === 'gpay') {
      uri += '&source=gpay';
    } else if (app === 'phonepe') {
      uri += '&source=phonepe';
    } else if (app === 'paytm') {
      uri += '&source=paytm';
    }

    return uri;
  }

  /**
   * Creates a complete subscription state object upon successful payment
   */
  public static createSubscriptionFromPayment(result: PaymentTransactionResult): VipSubscriptionState {
    const now = new Date().toISOString();
    return {
      isVipUser: true,
      planType: result.planType,
      planTier: result.planType,
      activatedAt: now,
      expiryDate: result.expiryDate,
      expiresAt: result.expiryDate,
      pricePaid: result.amount,
      paymentId: result.paymentId,
      orderId: result.orderId,
      paymentMethod: result.method,
      paymentGateway: 'Razorpay / Unified UPI Gateway',
    };
  }

  /**
   * Saves VIP subscription state to local storage
   */
  public static saveSubscription(subscription: VipSubscriptionState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscription));
    } catch (e) {
      console.warn('Failed to save VIP subscription to localStorage', e);
    }
  }

  /**
   * Loads VIP subscription from local storage and checks for expiry
   */
  public static loadSubscription(): VipSubscriptionState {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed: VipSubscriptionState = JSON.parse(saved);
        // Verify expiry
        const expiry = parsed.expiryDate || parsed.expiresAt;
        if (expiry) {
          const expTime = new Date(expiry).getTime();
          if (Date.now() > expTime) {
            // Expired
            return { isVipUser: false };
          }
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse VIP subscription from localStorage', e);
    }
    return { isVipUser: false };
  }

  /**
   * Formats ISO date to readable string
   */
  public static formatExpiryDate(isoString?: string): string {
    if (!isoString) return 'Active';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  }

  /**
   * Calculates days remaining until expiration
   */
  public static getRemainingDays(isoString?: string): number {
    if (!isoString) return 0;
    try {
      const diff = new Date(isoString).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }
}
