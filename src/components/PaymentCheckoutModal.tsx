import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Lock,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { VipPlanTier, PaymentMethodType, PaymentTransactionResult } from '../types';
import {
  VIP_PLANS,
  POPULAR_BANKS,
  ALL_BANKS,
  WALLET_PROVIDERS,
  UPI_APPS,
  PaymentService
} from '../services/paymentService';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: VipPlanTier;
  onPaymentSuccess: (result: PaymentTransactionResult) => void;
  onPaymentFailure?: (error: string) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  planType,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const plan = VIP_PLANS[planType] || VIP_PLANS.monthly;

  // Selected tab: 'upi' | 'card' | 'netbanking' | 'wallet'
  const [activeMethod, setActiveMethod] = useState<PaymentMethodType>('upi');

  // Form states
  // UPI
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [customVpa, setCustomVpa] = useState<string>('');
  const [vpaError, setVpaError] = useState<string>('');

  // Card
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardError, setCardError] = useState<string>('');

  // Net Banking
  const [selectedBank, setSelectedBank] = useState<string>('HDFC');
  const [searchBankQuery, setSearchBankQuery] = useState<string>('');

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState<string>('paytm_wallet');

  // Gateway Simulation State: 'idle' | 'processing' | 'otp_verification' | 'success' | 'failure'
  const [gatewayStatus, setGatewayStatus] = useState<
    'idle' | 'processing' | 'otp_verification' | 'success' | 'failure'
  >('idle');
  const [processingStepText, setProcessingStepText] = useState<string>('Connecting to Gateway...');
  const [lastPaymentResult, setLastPaymentResult] = useState<PaymentTransactionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // OTP Simulation State
  const [otpValue, setOtpValue] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(30);

  if (!isOpen) return null;

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    setCardError('');
  };

  // Format Expiry (MM/YY)
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  // Detect card network
  const getCardNetwork = () => {
    const clean = cardNumber.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'MasterCard';
    if (clean.startsWith('60') || clean.startsWith('65') || clean.startsWith('81')) return 'RuPay';
    return null;
  };

  // Execute payment trigger based on selected method
  const handleInitiatePayment = (simulateFailure = false) => {
    setErrorMessage('');

    // Method Validation
    if (activeMethod === 'upi') {
      if (customVpa && !customVpa.includes('@')) {
        setVpaError('Please enter a valid UPI ID (e.g., name@okhdfcbank)');
        return;
      }
    } else if (activeMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 16) {
        setCardError('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setCardError('Please enter valid expiry date (MM/YY)');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setCardError('Please enter valid 3-digit CVV');
        return;
      }

      // Cards trigger authentic 3D-Secure Bank OTP step
      setGatewayStatus('otp_verification');
      setOtpValue('849201'); // prefill demo OTP for painless testing
      return;
    }

    startGatewayProcessing(simulateFailure);
  };

  // Gateway Processing Simulation
  const startGatewayProcessing = (simulateFailure = false) => {
    setGatewayStatus('processing');
    setProcessingStepText('Initializing Secure 256-Bit SSL Handshake...');

    setTimeout(() => {
      if (activeMethod === 'upi') {
        const upiName = customVpa ? customVpa : (UPI_APPS.find(u => u.id === selectedUpiApp)?.name || 'UPI');
        setProcessingStepText(`Requesting UPI Authorization from ${upiName}...`);
      } else if (activeMethod === 'netbanking') {
        setProcessingStepText(`Redirecting to ${selectedBank} Bank Secure Gateway...`);
      } else if (activeMethod === 'wallet') {
        const walletName = WALLET_PROVIDERS.find(w => w.id === selectedWallet)?.name || 'Wallet';
        setProcessingStepText(`Debiting from ${walletName}...`);
      } else {
        setProcessingStepText('Authorizing Payment with Card Issuer...');
      }

      setTimeout(() => {
        if (simulateFailure) {
          setGatewayStatus('failure');
          setErrorMessage('Payment was declined by your bank/provider. No money was deducted.');
          onPaymentFailure?.('Payment declined by provider');
        } else {
          // Success
          const { expiryDateIso } = PaymentService.calculateExpiryDate(planType);
          const paymentId = PaymentService.generatePaymentId();
          const orderId = PaymentService.generateOrderId();

          const result: PaymentTransactionResult = {
            success: true,
            paymentId,
            orderId,
            planType,
            amount: plan.amount,
            method: activeMethod,
            details:
              activeMethod === 'upi'
                ? `UPI (${customVpa || selectedUpiApp.toUpperCase()})`
                : activeMethod === 'card'
                ? `Card ending in ${cardNumber.slice(-4) || '4242'}`
                : activeMethod === 'netbanking'
                ? `${selectedBank} Net Banking`
                : `${selectedWallet} Wallet`,
            expiryDate: expiryDateIso,
          };

          setLastPaymentResult(result);
          setGatewayStatus('success');

          // Trigger state update
          onPaymentSuccess(result);
        }
      }, 1400);
    }, 1000);
  };

  // Submit OTP for 3D Secure Card Payment
  const handleVerifyOtp = (simulateFailure = false) => {
    setGatewayStatus('processing');
    setProcessingStepText('Verifying Bank 3D-Secure OTP...');

    setTimeout(() => {
      if (simulateFailure || (otpValue && otpValue.length < 4)) {
        setGatewayStatus('failure');
        setErrorMessage('Incorrect OTP entered. Transaction cancelled safely.');
        onPaymentFailure?.('Incorrect OTP');
      } else {
        const { expiryDateIso } = PaymentService.calculateExpiryDate(planType);
        const paymentId = PaymentService.generatePaymentId();
        const orderId = PaymentService.generateOrderId();

        const result: PaymentTransactionResult = {
          success: true,
          paymentId,
          orderId,
          planType,
          amount: plan.amount,
          method: 'card',
          details: `Card ending in ${cardNumber.slice(-4) || '4242'}`,
          expiryDate: expiryDateIso,
        };

        setLastPaymentResult(result);
        setGatewayStatus('success');
        onPaymentSuccess(result);
      }
    }, 1200);
  };

  const filteredBanks = ALL_BANKS.filter(b =>
    b.toLowerCase().includes(searchBankQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl text-white shadow-2xl relative overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900/90 via-slate-900 to-amber-950/60 p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Crown className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white">GharKaExpert Checkout</h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-400/30 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> 256-Bit SSL
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 font-medium">
                {plan.title} • {plan.durationDays} Days Unlimited Access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={gatewayStatus === 'processing'}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer disabled:opacity-30"
            title="Cancel & Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pricing Summary Card */}
        <div className="bg-slate-800/60 p-3.5 px-4 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Payable Amount (All Taxes Incl.)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">₹{plan.amount}</span>
              <span className="text-xs text-slate-300 font-semibold">
                / {plan.planType === 'yearly' ? 'Year (₹83/mo)' : 'Month'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {plan.planType === 'yearly' ? '365 Days • Save ₹189' : '30 Days VIP Pass'}
            </span>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              Zero Pop-Up Ads Guaranteed
            </p>
          </div>
        </div>

        {/* MAIN BODY: Depends on gatewayStatus */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* STATE 1: IDLE - METHOD SELECTION */}
          {gatewayStatus === 'idle' && (
            <>
              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/70 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveMethod('upi')}
                  className={`py-2 px-1 text-center rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    activeMethod === 'upi'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[11px] font-bold">UPI Apps</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMethod('card')}
                  className={`py-2 px-1 text-center rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    activeMethod === 'card'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[11px] font-bold">Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMethod('netbanking')}
                  className={`py-2 px-1 text-center rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    activeMethod === 'netbanking'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-[11px] font-bold">Net Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMethod('wallet')}
                  className={`py-2 px-1 text-center rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    activeMethod === 'wallet'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-[11px] font-bold">Wallets</span>
                </button>
              </div>

              {/* METHOD TAB 1: UPI APPS */}
              {activeMethod === 'upi' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Popular 1-Tap UPI Apps
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ⚡ Instant Activation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {UPI_APPS.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => {
                          setSelectedUpiApp(app.id);
                          setCustomVpa('');
                          setVpaError('');
                        }}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                          selectedUpiApp === app.id && !customVpa
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/20'
                            : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${app.color} flex items-center justify-center text-white text-[11px] font-black shadow-xs`}>
                            {app.shortName.slice(0, 2)}
                          </div>
                          <span className="text-xs font-extrabold text-white">{app.name}</span>
                        </div>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            selectedUpiApp === app.id && !customVpa
                              ? 'border-amber-400 bg-amber-400'
                              : 'border-slate-500'
                          }`}
                        >
                          {selectedUpiApp === app.id && !customVpa && (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Or Custom VPA */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      Or Enter UPI ID (VPA)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customVpa}
                        onChange={(e) => {
                          setCustomVpa(e.target.value);
                          setVpaError('');
                        }}
                        placeholder="e.g. mobileNumber@upi or name@okhdfcbank"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    {vpaError && (
                      <p className="text-[11px] text-rose-400 mt-1 font-semibold">{vpaError}</p>
                    )}

                    {/* Quick VPA Suffix Chips */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-400">Quick suffixes:</span>
                      {['@okhdfcbank', '@okaxis', '@ybl', '@paytm'].map((suffix) => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => {
                            const base = customVpa.includes('@') ? customVpa.split('@')[0] : customVpa || 'username';
                            setCustomVpa(base + suffix);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-amber-300 font-medium"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD TAB 2: CREDIT / DEBIT CARDS */}
              {activeMethod === 'card' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Credit or Debit Card
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                      <span>Visa</span> • <span>Mastercard</span> • <span>RuPay</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-bold block mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 8923 1102 9921"
                        maxLength={19}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 tracking-wider"
                      />
                      {getCardNetwork() && (
                        <span className="absolute right-3 top-2.5 text-[10px] font-black uppercase text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {getCardNetwork()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-300 font-bold block mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        placeholder="MM / YY"
                        maxLength={5}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-bold block mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-bold block mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {cardError && (
                    <p className="text-[11px] text-rose-400 font-semibold">{cardError}</p>
                  )}

                  <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>RBI Guidelines Compliant • Encrypted & Tokenized</span>
                  </div>
                </div>
              )}

              {/* METHOD TAB 3: NET BANKING */}
              {activeMethod === 'netbanking' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    Select Popular Indian Bank
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {POPULAR_BANKS.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBank(b.name)}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          selectedBank === b.name
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/20'
                            : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg ${b.logoBg} flex items-center justify-center ${b.textColor} font-black text-[10px]`}>
                          {b.code}
                        </div>
                        <span className="text-[10px] font-bold text-white line-clamp-1">{b.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* All Other Banks Dropdown */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      Or Choose Other Banks
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {ALL_BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* METHOD TAB 4: WALLETS */}
              {activeMethod === 'wallet' && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    Supported Wallets
                  </span>

                  <div className="space-y-2">
                    {WALLET_PROVIDERS.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWallet(w.id)}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                          selectedWallet === w.id
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/20'
                            : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl ${w.iconBg} flex items-center justify-center text-white font-black text-xs`}>
                            {w.name.slice(0, 2)}
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-white">{w.name}</h5>
                            <span className="text-[10px] text-slate-400">Linked Balance Available</span>
                          </div>
                        </div>

                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            selectedWallet === w.id ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                          }`}
                        >
                          {selectedWallet === w.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Action Button: Pay Now */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleInitiatePayment(false)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{plan.amount} Securely Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Cancel or Continue Free */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Cancel & Return
                  </button>

                  {/* Dev Sandbox Toggle for Simulating Failure Scenario */}
                  <button
                    type="button"
                    onClick={() => handleInitiatePayment(true)}
                    className="text-amber-400/80 hover:text-amber-300 underline text-[10px]"
                    title="Test Failure and Retry flow"
                  >
                    [Test Failure Retry]
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STATE 2: 3D SECURE OTP VERIFICATION (For Card payments) */}
          {gatewayStatus === 'otp_verification' && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">Bank 3D-Secure Authentication</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Enter the 6-digit OTP sent to your registered mobile number for card ending in{' '}
                  <span className="font-mono text-amber-300 font-bold">
                    {cardNumber.slice(-4) || '4242'}
                  </span>
                </p>
              </div>

              <div className="max-w-[220px] mx-auto space-y-1.5">
                <input
                  type="text"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="849201"
                  maxLength={6}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold bg-slate-950 border-2 border-amber-400/80 rounded-xl py-2.5 text-white focus:outline-none shadow-inner"
                />
                <span className="text-[10px] text-slate-400 block">
                  Demo OTP pre-filled: 849201
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyOtp(false)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Confirm & Authorize ₹{plan.amount}
                </button>

                <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setGatewayStatus('idle')}
                    className="hover:text-slate-200"
                  >
                    Change Method
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp(true)}
                    className="text-rose-400 hover:text-rose-300 text-[10px]"
                  >
                    [Simulate Card Error]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: PROCESSING OVERLAY */}
          {gatewayStatus === 'processing' && (
            <div className="py-10 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-400" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-white">Processing Payment</h4>
                <p className="text-xs text-amber-200 font-medium animate-pulse">
                  {processingStepText}
                </p>
                <p className="text-[10px] text-slate-400">
                  Please do not refresh or close this window...
                </p>
              </div>
            </div>
          )}

          {/* STATE 4: PAYMENT SUCCESS */}
          {gatewayStatus === 'success' && lastPaymentResult && (
            <div className="py-4 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400/50 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </motion.div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  VIP Membership Activated
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">
                  Payment Successful!
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Your VIP benefits are live instantly across the entire app.
                </p>
              </div>

              {/* Transaction Details Box */}
              <div className="bg-slate-800/80 rounded-2xl p-3.5 text-left border border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-700/60">
                  <span className="text-slate-400 font-semibold">Payment ID:</span>
                  <span className="font-mono text-amber-300 font-bold">{lastPaymentResult.paymentId}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-700/60">
                  <span className="text-slate-400 font-semibold">Amount Paid:</span>
                  <span className="text-white font-black text-sm">₹{lastPaymentResult.amount}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-700/60">
                  <span className="text-slate-400 font-semibold">Method:</span>
                  <span className="text-slate-200 font-medium">{lastPaymentResult.details}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">VIP Valid Until:</span>
                  <span className="text-emerald-400 font-black">
                    {PaymentService.formatExpiryDate(lastPaymentResult.expiryDate)} ({plan.durationDays} Days)
                  </span>
                </div>
              </div>

              {/* Perks confirmation */}
              <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-left space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>VIP Privileges Now Active</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  • <strong>Zero full-screen ads:</strong> Interstitial ads are permanently removed.
                  <br />• <strong>1-Tap Instant Calling:</strong> Call Karigars without waiting delays.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start Enjoying VIP Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STATE 5: PAYMENT FAILURE OR CANCELLED (FRIENDLY RETRY FLOW) */}
          {gatewayStatus === 'failure' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border-2 border-rose-400/50 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Payment Unsuccessful</h3>
                <p className="text-xs text-rose-300 font-medium mt-1">
                  {errorMessage || 'The transaction could not be processed.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Don't worry, no funds were deducted from your account.
                </p>
              </div>

              <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80 text-left text-xs space-y-1.5">
                <p className="font-bold text-slate-200">Recommended Steps:</p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Try another payment app like Google Pay or PhonePe.</li>
                  <li>Verify that your UPI ID or card details are entered correctly.</li>
                  <li>Ensure sufficient balance or credit limit.</li>
                </ul>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setGatewayStatus('idle')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again with Different Method</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Continue Free for Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Trust Footer */}
        <div className="p-2.5 px-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> NPCI & RBI Certified
          </span>
          <span>•</span>
          <span>100% Refundable</span>
          <span>•</span>
          <span>Instant Invoice</span>
        </div>
      </motion.div>
    </div>
  );
};
