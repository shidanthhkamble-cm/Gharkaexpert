import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Users, 
  Building2, 
  ImageIcon, 
  CalendarCheck, 
  Sparkles,
  PhoneCall,
  HardHat,
  BadgeCheck,
  RotateCcw,
  Plus,
  DollarSign,
  Edit,
  SlidersHorizontal,
  Navigation,
  Zap,
  Phone,
  ChevronRight,
  CheckCircle2,
  Star,
  Clock,
  MapPin,
  History,
  Crown,
  ShieldCheck,
  UserX
} from 'lucide-react';

import { 
  Language, 
  UserRole, 
  TradeCategory, 
  WorkerProfile, 
  PortfolioItem, 
  SubContractJob, 
  DirectBooking, 
  Conversation, 
  ChatMessage, 
  PostInspectionQuote, 
  WorkerReview,
  VipPlanTier,
  VipSubscriptionState,
  PaymentTransactionResult,
  UserAccountDocument
} from './types';
import { t, getCategoryLabel } from './data/translations';
import { INITIAL_WORKERS, INITIAL_SUB_CONTRACTS } from './data/initialData';
import { INITIAL_CONVERSATIONS } from './data/initialChats';

// Components
import { MobileDeviceFrame } from './components/MobileDeviceFrame';
import { SplashScreen } from './components/SplashScreen';
import { LanguageSelector } from './components/LanguageSelector';
import { SafetyWarningModal } from './components/SafetyWarningModal';
import { VerificationFlow } from './components/VerificationFlow';
import { RoleSelector } from './components/RoleSelector';
import { Header } from './components/Header';
import { CategoryGrid } from './components/CategoryGrid';
import { WorkerCard } from './components/WorkerCard';
import { WorkerDetailModal } from './components/WorkerDetailModal';
import { WorkPortfolio } from './components/WorkPortfolio';
import { SubContractBoard } from './components/SubContractBoard';
import { DirectCommModal } from './components/DirectCommModal';
import { DirectBookingModal } from './components/DirectBookingModal';
import { ChatModal } from './components/ChatModal';
import { InboxModal } from './components/InboxModal';

// GharKaExpert New Feature Components
import { BannerAd, NativeAdCard, InterstitialAdModal } from './components/AdMobComponents';
import { admobService, ADMOB_CONFIG } from './services/admobService';
import { VipPaywallModal } from './components/VipPaywallModal';
import { PaymentCheckoutModal } from './components/PaymentCheckoutModal';
import { PaymentService } from './services/paymentService';
import { accountLifecycleService } from './services/accountLifecycleService';
import { SoftDeleteAccountModal } from './components/SoftDeleteAccountModal';
import { EmergencyDispatchModal } from './components/EmergencyDispatchModal';
import { CategoryActionModal } from './components/CategoryActionModal';
import { PostInspectionQuoteModal } from './components/PostInspectionQuoteModal';
import { JobTrackerModal } from './components/JobTrackerModal';
import { WorkerEditModal } from './components/WorkerEditModal';
import { WorkerRatingModal } from './components/WorkerRatingModal';
import { ServiceHistoryView } from './components/ServiceHistoryView';
import { BottomNavBar } from './components/BottomNavBar';

export default function App() {
  // Onboarding Step Flow
  const [onboardingStep, setOnboardingStep] = useState<
    'splash' | 'language' | 'safety' | 'verification' | 'role' | 'home'
  >('splash');

  // App Settings
  const [currentLanguage, setCurrentLanguage] = useState<Language>('hi');
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // User Profile Data
  const [userProfile, setUserProfile] = useState<{
    name: string;
    phone: string;
    photoUrl: string;
    verified: boolean;
  }>(() => {
    const current = accountLifecycleService.getCurrentUser();
    if (current && !current.isDeleted) {
      return {
        name: current.name,
        phone: current.phoneNumber.startsWith('+91') ? current.phoneNumber : `+91 ${current.phoneNumber}`,
        photoUrl: current.photoUrl,
        verified: true,
      };
    }
    return {
      name: 'Ramesh Sharma',
      phone: '+91 98765 43210',
      photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
      verified: true,
    };
  });

  const [showSoftDeleteModal, setShowSoftDeleteModal] = useState<boolean>(false);

  // VIP Subscription State (Monetization: Free vs VIP Tiered Model)
  const [vipSubscription, setVipSubscription] = useState<VipSubscriptionState>(() => {
    return PaymentService.loadSubscription();
  });

  const [showVipPaywall, setShowVipPaywall] = useState<boolean>(false);
  const [vipPaywallReason, setVipPaywallReason] = useState<'ad_skipped' | 'direct_call' | 'header_badge' | 'general'>('general');
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutPlanTier, setCheckoutPlanTier] = useState<VipPlanTier>('yearly');

  // Main Home State
  const [activeTab, setActiveTab] = useState<'workers' | 'portfolio' | 'passwork' | 'bookings'>('workers');
  const [selectedCategory, setSelectedCategory] = useState<TradeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmergencyOnly, setIsEmergencyOnly] = useState(false);
  const [fairRotationEnabled, setFairRotationEnabled] = useState(true);

  // Data Collections
  const [workersList, setWorkersList] = useState<WorkerProfile[]>(INITIAL_WORKERS);
  const [subContractJobs, setSubContractJobs] = useState<SubContractJob[]>(INITIAL_SUB_CONTRACTS);
  const [myBookings, setMyBookings] = useState<DirectBooking[]>([
    {
      id: 'booking-live-1',
      customerName: 'Customer',
      customerPhone: '+91 98765 43210',
      workerId: 'w-1',
      workerName: 'Ramesh Sharma (Rajmistri)',
      trade: 'mason',
      bookingDate: 'Today (Live GPS)',
      timeSlot: 'En Route (8 Mins)',
      address: 'Flat 402, Sunshine Heights, Mumbai',
      pinnedLat: 19.1363,
      pinnedLng: 72.8277,
      isEmergency: false,
      notes: 'Bathroom tile setting & masonry repair',
      status: 'in_transit',
      startServiceOtp: '7419',
      startWorkCode: '7419',
      otpVerified: false,
      arrivalProgressPercent: 45,
      estimatedArrivalMins: 8,
      currentDistanceKm: 1.8,
      totalPaidAmount: 950,
      invoiceNumber: 'GKE-INV-841920',
      createdAt: new Date().toISOString()
    },
    {
      id: 'booking-hist-2',
      customerName: 'Customer',
      customerPhone: '+91 98765 43210',
      workerId: 'w-2',
      workerName: 'Mukesh Carpenter',
      trade: 'carpenter',
      bookingDate: 'Yesterday, 18 Sep',
      timeSlot: '11:00 AM - 01:00 PM',
      address: 'Shop 12, Linking Road, Bandra West, Mumbai',
      pinnedLat: 19.0600,
      pinnedLng: 72.8340,
      isEmergency: false,
      notes: 'Modular kitchen cabinet hinge repair & plywood fitting',
      status: 'completed',
      startServiceOtp: '3821',
      startWorkCode: '3821',
      otpVerified: true,
      serviceStartedAt: '11:15 AM',
      serviceFinishedAt: '12:45 PM',
      completedAtDate: '18 Sep 2026',
      totalPaidAmount: 850,
      invoiceNumber: 'GKE-INV-719342',
      rating: 5,
      review: {
        bookingId: 'booking-hist-2',
        workerId: 'w-2',
        workerName: 'Mukesh Carpenter',
        customerName: 'Customer',
        stars: 5,
        tags: ['Arrived on Time', 'Professional & Polite', 'High Quality Work'],
        comment: 'Clean woodwork and fixed our cabinet flawlessly. Very respectful.',
        createdAt: '2026-09-18T13:00:00Z'
      },
      createdAt: '2026-09-18T10:00:00Z'
    },
    {
      id: 'booking-hist-3',
      customerName: 'Customer',
      customerPhone: '+91 98765 43210',
      workerId: 'w-3',
      workerName: 'Sanjay Plumber',
      trade: 'plumber',
      bookingDate: '15 Sep 2026',
      timeSlot: '04:00 PM - 05:30 PM',
      address: 'B-204, Green Acres, Andheri East, Mumbai',
      pinnedLat: 19.1197,
      pinnedLng: 72.8464,
      isEmergency: true,
      notes: 'Emergency pipeline leakage under kitchen sink',
      status: 'completed',
      startServiceOtp: '6194',
      startWorkCode: '6194',
      otpVerified: true,
      serviceStartedAt: '04:10 PM',
      serviceFinishedAt: '05:05 PM',
      completedAtDate: '15 Sep 2026',
      totalPaidAmount: 700,
      invoiceNumber: 'GKE-INV-612089',
      rating: 5,
      review: {
        bookingId: 'booking-hist-3',
        workerId: 'w-3',
        workerName: 'Sanjay Plumber',
        customerName: 'Customer',
        stars: 5,
        tags: ['Arrived on Time', '0% Brokerage Honest Pricing'],
        comment: 'Rapid emergency response. Replaced worn valve within 45 mins.',
        createdAt: '2026-09-15T17:15:00Z'
      },
      createdAt: '2026-09-15T15:30:00Z'
    },
    {
      id: 'booking-hist-4',
      customerName: 'Customer',
      customerPhone: '+91 98765 43210',
      workerId: 'w-4',
      workerName: 'Sunil Electrician',
      trade: 'electrician',
      bookingDate: '12 Sep 2026',
      timeSlot: '02:00 PM - 03:00 PM',
      address: 'Plot 88, Juhu Tara Road, Mumbai',
      isEmergency: false,
      notes: 'Main distribution board circuit breaker tripping inspection',
      status: 'cancelled',
      cancellationReason: 'Customer resolved issue independently by resetting main MCB switch.',
      totalPaidAmount: 0,
      invoiceNumber: 'GKE-CAN-419082',
      createdAt: '2026-09-12T13:00:00Z'
    }
  ]);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);

  // Modals State
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<WorkerProfile | null>(null);
  const [commModal, setCommModal] = useState<{
    worker: WorkerProfile | null;
    mode: 'call' | 'whatsapp' | null;
  }>({ worker: null, mode: null });
  const [bookingWorker, setBookingWorker] = useState<WorkerProfile | null>(null);
  const [activeChatWorkerId, setActiveChatWorkerId] = useState<string | null>(null);
  const [showInboxModal, setShowInboxModal] = useState(false);

  // GharKaExpert Category Action Modal States (isActionModalOpen and modalCategory)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<TradeCategory>('plumber');
  const [showEmergencyDispatch, setShowEmergencyDispatch] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [interstitialTitle, setInterstitialTitle] = useState('GharKaExpert Partner Sponsor');
  const [interstitialSubtitle, setInterstitialSubtitle] = useState<string | undefined>(undefined);
  const [dispatchWithAd, setDispatchWithAd] = useState<boolean>(true);

  type PendingAdAction =
    | { type: 'call'; worker: WorkerProfile }
    | { type: 'whatsapp'; worker: WorkerProfile }
    | { type: 'instant_dispatch'; category: TradeCategory; targetWorker?: WorkerProfile }
    | { type: 'booking_tracker'; booking: DirectBooking };

  const [pendingAdAction, setPendingAdAction] = useState<PendingAdAction | null>(null);
  const [activeTrackerBooking, setActiveTrackerBooking] = useState<DirectBooking | null>(null);
  const [ratingModalData, setRatingModalData] = useState<{ booking: DirectBooking; worker: WorkerProfile } | null>(null);
  const [adminAlertMessage, setAdminAlertMessage] = useState<string | null>(null);

  // Initialize Google AdMob SDK & preload interstitial ads
  useEffect(() => {
    void admobService.initialize();
  }, []);

  // Ensure native banner only shows on Home screen and interstitial ('home_ads') stays preloaded
  useEffect(() => {
    if (onboardingStep === 'home') {
      if (!vipSubscription.isVipUser) {
        void admobService.loadInterstitialAd(ADMOB_CONFIG.interstitialAdUnitId);
      }
    } else {
      void admobService.removeHomeBanner();
    }
  }, [onboardingStep, vipSubscription.isVipUser]);

  // Trigger Google AdMob Interstitial Ad or Proceed Directly based on VIP status
  const handleInitiateContact = (worker: WorkerProfile, mode: 'call' | 'whatsapp') => {
    const proceedDirectly = () => {
      setCommModal({
        worker,
        mode,
      });
    };

    const showAdThenProceed = () => {
      setPendingAdAction({ type: mode, worker });
      setInterstitialTitle(
        mode === 'call'
          ? `Connecting Masked Call to ${worker.name} • Google AdMob`
          : `Connecting In-App Chat with ${worker.name} • Google AdMob`
      );
      setInterstitialSubtitle(
        mode === 'call'
          ? `Encrypted in-app routing to ${worker.name} (Ext #${worker.id.replace('worker-', '')}) with platform warranty protection.`
          : `Opening secure in-app messaging with ${worker.name}. Anti-bypass platform protected.`
      );
      setShowInterstitialAd(true);
    };

    // Requirement:
    // if (!user.isVipUser) { showInterstitialAdThenProceed(); } else { proceedDirectly(); }
    admobService.handleHighIntentAction({
      user: vipSubscription,
      onShowInterstitial: showAdThenProceed,
      onProceedDirectly: proceedDirectly,
    });
  };

  // When user clicks ANY skill category icon (Plumbing, Carpentry, Mason, AC, etc.) or '⚡ 2 Options' badge
  const handleCategoryIconClick = (cat: TradeCategory | 'all') => {
    if (cat === 'all') {
      setSelectedCategory('all');
      setIsActionModalOpen(false);
      return;
    }
    // Strictly update selected category to the actively tapped skill
    setSelectedCategory(cat);
    setModalCategory(cat);
    setIsActionModalOpen(true);
  };

  // Option 1: 'Instant Dispatch'
  // Automatically search and connect with an available worker within a strict 1.5km radius using Fair Rotation algorithm.
  const handleInstantDispatchFromCategory = (category: TradeCategory) => {
    setIsActionModalOpen(false);
    setSelectedCategory(category);
    const catLabel = getCategoryLabel(category, currentLanguage) || category;

    const proceedDirectly = () => {
      setShowEmergencyDispatch(true);
    };

    const showAdThenProceed = () => {
      setPendingAdAction({ type: 'instant_dispatch', category });
      setInterstitialTitle(`Instant Dispatch: ${catLabel} • Google AdMob`);
      setInterstitialSubtitle(
        `Auto-matching available ${catLabel} within a strict 1.5km radius using Fair Rotation algorithm. Auto-initiating masked call with 0% commission.`
      );
      setShowInterstitialAd(true);
    };

    admobService.handleHighIntentAction({
      user: vipSubscription,
      onShowInterstitial: showAdThenProceed,
      onProceedDirectly: proceedDirectly,
    });
  };

  // Option 2: 'Browse Profiles'
  // Let the user scroll down to view worker profiles, check details, and call or connect manually.
  const handleBrowseProfilesFromCategory = (category: TradeCategory) => {
    setIsActionModalOpen(false);
    setSelectedCategory(category);
    setActiveTab('workers');
    setTimeout(() => {
      const el = document.getElementById('karigar-profiles-list');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
  };

  // Post inspection quote modal state
  const [quoteModalState, setQuoteModalState] = useState<{
    show: boolean;
    mode: 'worker_create' | 'customer_view';
    worker: WorkerProfile | null;
    bookingId?: string;
  }>({ show: false, mode: 'customer_view', worker: null });

  // Worker profile edit modal state
  const [editingWorkerProfile, setEditingWorkerProfile] = useState<WorkerProfile | null>(null);

  // Unread messages count
  const totalUnreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  // Open Chat Handler for a given Worker (with optional initial message)
  const handleOpenChatForWorker = (worker: WorkerProfile, initialMessage?: string) => {
    const existing = conversations.find(c => c.workerId === worker.id);
    if (!existing) {
      const newConv: Conversation = {
        workerId: worker.id,
        workerName: worker.name,
        workerPhoto: worker.photoUrl,
        workerTrade: worker.primaryTrade,
        workerPhone: `Ext #${worker.id.replace('worker-', '')} [Masked]`,
        dailyRate: worker.dailyRate,
        lastMessage: initialMessage || 'In-app chat started',
        lastTimestamp: 'Just now',
        unreadCount: 0,
        messages: initialMessage ? [{
          id: `msg-${Date.now()}`,
          sender: 'customer',
          text: initialMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }] : [],
      };
      setConversations(prev => [newConv, ...prev]);
    } else {
      if (initialMessage) {
        setConversations(prev => prev.map(c => c.workerId === worker.id ? {
          ...c,
          unreadCount: 0,
          lastMessage: initialMessage,
          lastTimestamp: 'Just now',
          messages: [...c.messages, {
            id: `msg-${Date.now()}`,
            sender: 'customer',
            text: initialMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        } : c));
      } else {
        setConversations(prev => prev.map(c => c.workerId === worker.id ? { ...c, unreadCount: 0 } : c));
      }
    }
    setActiveChatWorkerId(worker.id);
  };

  // Send Message Handler
  const handleSendMessage = (workerId: string, text: string, imageUrl?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text,
      imageUrl,
      timestamp: timeStr,
      status: 'sent',
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.workerId === workerId) {
          return {
            ...c,
            lastMessage: text || (imageUrl ? '📷 Sent a photo' : ''),
            lastTimestamp: timeStr,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  };

  // Flattened Portfolio Items for Gallery View
  const allPortfolioItems: PortfolioItem[] = workersList.flatMap(
    (w) => w.portfolio || []
  );

  // Filtered & Fair-Rotated Workers
  // When a specific category is tapped, do NOT show all skills combined. Strictly filter only the exact skill selected.
  const filteredWorkers = workersList
    .filter((worker) => {
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : worker.primaryTrade === selectedCategory;
      const matchesEmergency = !isEmergencyOnly || worker.isEmergencyAvailable;
      const matchesSearch =
        worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.bio.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesEmergency && matchesSearch;
    })
    .sort((a, b) => {
      if (fairRotationEnabled) {
        // Boost new Karigars and workers with 0 recent bookings to top
        const scoreA = (a.isNewKarigar ? 10 : 0) + (a.recentBookingCount === 0 ? 5 : 0);
        const scoreB = (b.isNewKarigar ? 10 : 0) + (b.recentBookingCount === 0 ? 5 : 0);
        return scoreB - scoreA;
      }
      return b.rating - a.rating;
    });

  // Onboarding Action Handlers
  const handleSplashProceed = () => setOnboardingStep('language');
  const handleLanguageProceed = () => {
    setOnboardingStep('safety');
    setShowSafetyModal(true);
  };
  const handleSafetyAccept = () => {
    setShowSafetyModal(false);
    setOnboardingStep('verification');
  };
  const handleVerificationComplete = (data: {
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
  }) => {
    setUserProfile({
      name: data.name,
      phone: data.phone,
      photoUrl: data.photoUrl,
      verified: data.verified,
    });
    setCurrentRole(data.role);

    // Save or update in persistent Firestore collection
    accountLifecycleService.saveOrUpdateUser({
      phoneNumber: data.phone,
      name: data.name,
      photoUrl: data.photoUrl,
      role: data.role,
      trade: data.trade,
      experienceYears: data.experienceYears,
      pincode: data.pincode,
      aadhaarVerified: data.aadhaarVerified,
      aadhaarFrontUrl: data.aadhaarFrontUrl,
      aadhaarBackUrl: data.aadhaarBackUrl,
      rating: data.rating,
      reviewsCount: data.reviewsCount,
      completedJobs: data.completedJobs,
      bio: data.bio,
      dailyRate: data.dailyRate,
      visitingFee: data.visitingFee,
      vipSubscription: data.vipSubscription,
    });

    if (data.vipSubscription) {
      setVipSubscription(data.vipSubscription);
      PaymentService.saveSubscription(data.vipSubscription);
    }

    if (data.restoredMessage) {
      setAdminAlertMessage(data.restoredMessage);
    }

    if (data.role === 'worker') {
      const newWorker: WorkerProfile = {
        id: `worker-my-${Date.now()}`,
        name: data.name,
        phone: data.phone,
        aadhaarVerified: data.aadhaarVerified ?? true,
        aadhaarNumberMasked: '•••• •••• ' + data.phone.slice(-4),
        photoUrl: data.photoUrl,
        role: 'worker',
        primaryTrade: data.trade || 'electrician',
        pricingType: 'daily',
        dailyRate: data.dailyRate || 750,
        visitingFee: data.visitingFee || 299,
        rating: data.rating || 5.0,
        reviewsCount: data.reviewsCount || 1,
        experienceYears: data.experienceYears || 5,
        city: data.pincode ? `Area Pincode ${data.pincode}` : 'Mumbai',
        distanceKm: 0.5,
        isEmergencyAvailable: true,
        isAvailableToday: true,
        bio: data.bio || `Verified Karigar specializing in ${data.trade || 'repair'} work with ${data.experienceYears || 5} years experience. Pincode ${data.pincode || '400001'}.`,
        languagesSpoken: ['Hindi', 'English'],
        portfolio: [],
        completedJobs: data.completedJobs || 0,
        recentBookingCount: 0,
        isNewKarigar: !data.rating,
      };
      setWorkersList(prev => [newWorker, ...prev.filter(w => w.id !== newWorker.id && w.phone !== data.phone)]);
    }

    // Direct navigation to home screen upon OTP verification for customers or KYC completion for workers
    setOnboardingStep('home');
  };

  // Soft Delete Account Handler (Step 1 & 2: Update isDeleted: true, deletedAt: timestamp, and signOut)
  const handleSoftDeleteAccount = async () => {
    try {
      const result = await accountLifecycleService.softDeleteAccount();
      setShowSoftDeleteModal(false);
      setAdminAlertMessage(
        `🗑️ Account Soft-Deleted: Your past ratings & profile (${userProfile.name}) are safely preserved. Log back in with ${userProfile.phone} anytime to instantly restore your history!`
      );
      // Navigate to verification/login screen
      setOnboardingStep('verification');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error soft-deleting account';
      setAdminAlertMessage(msg);
    }
  };
  const handleRoleProceed = () => setOnboardingStep('home');

  // Add Portfolio Item Handler
  const handleAddPortfolioItem = (newItem: PortfolioItem) => {
    setWorkersList((prev) =>
      prev.map((w, idx) => {
        if (idx === 0) {
          return {
            ...w,
            portfolio: [newItem, ...(w.portfolio || [])],
          };
        }
        return w;
      })
    );
  };

  // Add Sub Contract Job Handler
  const handlePostSubContract = (newJob: SubContractJob) => {
    setSubContractJobs((prev) => [newJob, ...prev]);
  };

  // Direct Booking Confirm
  const handleConfirmBooking = (newBooking: DirectBooking) => {
    const code = newBooking.startWorkCode || newBooking.startServiceOtp || Math.floor(1000 + Math.random() * 9000).toString();
    const bookingWithOtp: DirectBooking = {
      ...newBooking,
      startServiceOtp: code,
      startWorkCode: code,
      otpVerified: false,
      arrivalProgressPercent: newBooking.arrivalProgressPercent ?? 20,
      estimatedArrivalMins: newBooking.estimatedArrivalMins ?? 12,
      currentDistanceKm: newBooking.currentDistanceKm ?? 2.4,
    };
    setMyBookings((prev) => [bookingWithOtp, ...prev]);

    const proceedDirectly = () => {
      setActiveTrackerBooking(bookingWithOtp);
    };

    const showAdThenProceed = () => {
      setPendingAdAction({ type: 'booking_tracker', booking: bookingWithOtp });
      setInterstitialTitle('Booking Confirmed! Google AdMob Sponsor Offer');
      setInterstitialSubtitle('Your Karigar appointment is locked. Sponsored by Google AdMob.');
      setShowInterstitialAd(true);
    };

    admobService.handleHighIntentAction({
      user: vipSubscription,
      onShowInterstitial: showAdThenProceed,
      onProceedDirectly: proceedDirectly,
    });
  };

  // Worker Emergency Match Acceptance
  const handleEmergencyWorkerAccepted = (worker: WorkerProfile) => {
    setShowEmergencyDispatch(false);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const emergencyBooking: DirectBooking = {
      id: `booking-${Date.now()}`,
      customerName: userProfile.name,
      customerPhone: userProfile.phone,
      workerId: worker.id,
      workerName: worker.name,
      trade: selectedCategory !== 'all' ? selectedCategory : worker.primaryTrade,
      bookingDate: 'Today (Instant Dispatch)',
      timeSlot: 'Live GPS (15 Mins)',
      address: 'Current Live GPS Location (Doorstep)',
      pinnedLat: 19.1363,
      pinnedLng: 72.8277,
      isEmergency: true,
      notes: 'Instant Direct Connect Dispatch',
      status: 'in_transit',
      startServiceOtp: code,
      startWorkCode: code,
      otpVerified: false,
      arrivalProgressPercent: 25,
      estimatedArrivalMins: 11,
      currentDistanceKm: 1.5,
      createdAt: new Date().toISOString()
    };
    setMyBookings((prev) => [emergencyBooking, ...prev]);

    const proceedDirectly = () => {
      setActiveTrackerBooking(emergencyBooking);
    };

    const showAdThenProceed = () => {
      setPendingAdAction({ type: 'booking_tracker', booking: emergencyBooking });
      setInterstitialTitle(`Karigar Dispatched: ${worker.name} • Google AdMob`);
      setInterstitialSubtitle(`Live GPS tracking for ${worker.name} will begin once sponsor message completes.`);
      setShowInterstitialAd(true);
    };

    admobService.handleHighIntentAction({
      user: vipSubscription,
      onShowInterstitial: showAdThenProceed,
      onProceedDirectly: proceedDirectly,
    });
  };

  // Send Post-Inspection Quote Handler
  const handleSendQuote = (amount: number, description: string, hasVoiceNote: boolean) => {
    const newQuote: PostInspectionQuote = {
      id: `q-${Date.now()}`,
      bookingId: quoteModalState.bookingId || 'booking-1',
      workerId: quoteModalState.worker?.id || 'w-m1',
      workerName: quoteModalState.worker?.name || 'Karigar',
      totalAmount: amount,
      description,
      hasVoiceNote,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const targetId = quoteModalState.bookingId || activeTrackerBooking?.id;
    setMyBookings(prev => prev.map(b => b.id === targetId ? { ...b, quote: newQuote } : b));

    if (activeTrackerBooking && activeTrackerBooking.id === targetId) {
      setActiveTrackerBooking({ ...activeTrackerBooking, quote: newQuote });
    }

    setQuoteModalState({ show: false, mode: 'customer_view', worker: null });
    setInterstitialTitle('Quote Sent - AdMob Partner Sponsor');
    setShowInterstitialAd(true);
  };

  // Customer "Finish Service" Control & Review Trigger
  const handleCustomerFinishService = (bookingToFinish: DirectBooking) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: DirectBooking = {
      ...bookingToFinish,
      status: 'completed',
      serviceFinishedAt: timeStr,
    };
    setActiveTrackerBooking(null);
    setMyBookings(prev => prev.map(b => b.id === updated.id ? updated : b));

    const workerObj = workersList.find(w => w.id === updated.workerId) || workersList[0];
    setRatingModalData({ booking: updated, worker: workerObj });
  };

  // Submit Worker Review (1 to 5 stars, behavior tags, and admin flagging)
  const handleSubmitWorkerReview = ({
    stars,
    tags,
    comment,
    isFlagged,
    flagReason,
  }: {
    stars: number;
    tags: string[];
    comment: string;
    isFlagged: boolean;
    flagReason?: string;
  }) => {
    if (!ratingModalData) return;
    const { booking, worker } = ratingModalData;

    const newReview: WorkerReview = {
      id: `rev-${Date.now()}`,
      bookingId: booking.id,
      workerId: worker.id,
      workerName: worker.name,
      customerName: booking.customerName || userProfile.name,
      stars,
      tags,
      comment,
      isFlaggedForAdminReview: isFlagged,
      createdAt: new Date().toISOString(),
    };

    // Calculate score
    const newRating = isFlagged || stars <= 2
      ? Math.max(1.0, +((worker.rating * worker.reviewsCount + stars) / (worker.reviewsCount + 1) - 0.4).toFixed(1))
      : +((worker.rating * worker.reviewsCount + stars) / (worker.reviewsCount + 1)).toFixed(1);

    // Update worker profile with new rating and Admin flag if applicable
    setWorkersList(prev => prev.map(w => {
      if (w.id === worker.id) {
        return {
          ...w,
          rating: newRating,
          reviewsCount: w.reviewsCount + 1,
          completedJobs: w.completedJobs + 1,
          isFlaggedInAdmin: isFlagged ? true : w.isFlaggedInAdmin,
          flagReason: isFlagged ? flagReason : w.flagReason,
          adminFlaggedAt: isFlagged ? new Date().toLocaleString() : w.adminFlaggedAt,
        };
      }
      return w;
    }));

    // Update booking object with completed review
    const updatedBooking: DirectBooking = {
      ...booking,
      status: 'completed',
      rating: stars,
      review: newReview,
    };
    setMyBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));

    if (isFlagged) {
      setAdminAlertMessage(`⚠️ Admin Quality Alert: Karigar ${worker.name} flagged for review (${flagReason || 'Low Rating / Behavior'}). Immediate investigation logged.`);
    }

    setRatingModalData(null);
  };

  return (
    <MobileDeviceFrame>
      <div
        className={`min-h-dvh flex-1 w-full flex flex-col justify-between select-none relative ${
          onboardingStep === 'home'
            ? 'bg-slate-50 text-slate-800'
            : 'bg-[#1E3A8A] text-white'
        }`}
      >
        {/* ONBOARDING FLOW SCREENS */}
        {onboardingStep === 'splash' && (
          <SplashScreen
            currentLanguage={currentLanguage}
            onProceed={handleSplashProceed}
          />
        )}

        {onboardingStep === 'language' && (
          <LanguageSelector
            selectedLanguage={currentLanguage}
            onSelectLanguage={(lang) => setCurrentLanguage(lang)}
            onProceed={handleLanguageProceed}
          />
        )}

        {onboardingStep === 'verification' && (
          <VerificationFlow
            currentLanguage={currentLanguage}
            onVerificationComplete={handleVerificationComplete}
          />
        )}

        {onboardingStep === 'role' && (
          <RoleSelector
            currentRole={currentRole}
            currentLanguage={currentLanguage}
            onSelectRole={(role) => setCurrentRole(role)}
            onProceed={handleRoleProceed}
          />
        )}

        {/* STRICT SAFETY WARNING DIALOG MODAL */}
        {showSafetyModal && (
          <SafetyWarningModal
            currentLanguage={currentLanguage}
            onAccept={handleSafetyAccept}
          />
        )}

        {/* MAIN HOME SCREEN */}
        {onboardingStep === 'home' && (
          <div className="flex flex-col min-h-dvh flex-1 pb-16 bg-slate-50">
            {/* Header */}
            <Header
              currentLanguage={currentLanguage}
              onLanguageChange={(lang) => setCurrentLanguage(lang)}
              currentRole={currentRole}
              onRoleToggle={() =>
                setCurrentRole(currentRole === 'customer' ? 'worker' : 'customer')
              }
              isEmergencyOnly={isEmergencyOnly}
              onToggleEmergency={() => setIsEmergencyOnly(!isEmergencyOnly)}
              userName={userProfile.name}
              userPhoto={userProfile.photoUrl}
              onOpenInbox={() => setShowInboxModal(true)}
              unreadCount={totalUnreadCount}
              vipSubscription={vipSubscription}
              onOpenVipPaywall={() => {
                setVipPaywallReason('header_badge');
                setShowVipPaywall(true);
              }}
            />

            {/* Main Content Area */}
            <main className="p-3 sm:p-5 space-y-4 max-w-4xl mx-auto w-full">
              {/* Top Banner: 0% Commission & Role Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={userProfile.photoUrl}
                      alt={userProfile.name}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
                    />
                    <BadgeCheck className="w-4 h-4 text-emerald-400 bg-slate-900 rounded-full absolute -bottom-1 -right-1" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-white">{userProfile.name}</h3>
                      <span className="text-[9px] text-emerald-300 font-extrabold bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded uppercase">
                        ✅ Verified Karigar
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      0% Commission • <span className="text-amber-300 font-bold capitalize">{currentRole} Mode</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentRole === 'worker' && (
                    <button
                      onClick={() => {
                        const loggedInWorker = workersList[0];
                        setEditingWorkerProfile(loggedInWorker);
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-xs cursor-pointer"
                      title="Edit Rates & Profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">My Rates</span>
                    </button>
                  )}

                  {/* Soft Delete Account & Sign Out Button */}
                  <button
                    onClick={() => setShowSoftDeleteModal(true)}
                    className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-rose-200 rounded-xl text-xs flex items-center gap-1 font-bold border border-slate-700 hover:border-rose-700/60 transition-colors cursor-pointer"
                    title="Soft Delete Account (Past history & ratings safely preserved)"
                  >
                    <UserX className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Delete Account</span>
                  </button>

                  <button
                    onClick={() => setOnboardingStep('language')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1 font-bold border border-slate-700 cursor-pointer"
                    title="Re-run Onboarding / Switch Language"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* VIP Subscription Card: Free user sees Yellow VIP Banner, VIP user sees 'VIP Member Active' badge */}
              {!vipSubscription.isVipUser ? (
                <div 
                  onClick={() => {
                    setVipPaywallReason('general');
                    setShowVipPaywall(true);
                  }}
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] border border-amber-300"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-slate-950 tracking-tight">
                          Upgrade to VIP • ₹99/mo or ₹999/yr
                        </span>
                        <span className="bg-slate-950 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                          No Full-Screen Ads
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-800 font-bold truncate">
                        Block all full-screen pop-ups & connect direct calls instantly with 0 waiting!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="py-1.5 px-3 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl shrink-0 shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Plans</span>
                    <ChevronRight className="w-3 h-3 text-amber-300" />
                  </button>
                </div>
              ) : (
                /* VIP Member Active Badge Card (Yellow Banner is hidden, VIP Active is displayed) */
                <div 
                  onClick={() => {
                    setVipPaywallReason('general');
                    setShowVipPaywall(true);
                  }}
                  className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 border-2 border-amber-400/70 hover:border-amber-400 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <Crown className="w-5 h-5 fill-slate-950 text-slate-950 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                          VIP Member Active
                        </span>
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          {vipSubscription.planType === 'yearly' ? 'Yearly VIP (₹999)' : 'Monthly VIP (₹99)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 font-medium truncate mt-0.5">
                        Zero Pop-Up Ads Active • Valid until {PaymentService.formatExpiryDate(vipSubscription.expiryDate || vipSubscription.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-bold text-xs rounded-xl shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3 h-3 text-amber-300" />
                  </button>
                </div>
              )}

              {/* Service Categories Grid */}
              <CategoryGrid
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  handleCategoryIconClick(cat);
                }}
                currentLanguage={currentLanguage}
              />

              {/* Search Bar & Fair Rotation Filter Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search GharKaExpert by name, city, skill (e.g., Ramesh, Bike Mechanic, Tile)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-slate-700">Fair Rotation Algorithm:</span>
                  </div>

                  <button
                    onClick={() => setFairRotationEnabled(!fairRotationEnabled)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${
                      fairRotationEnabled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span>{fairRotationEnabled ? '🌱 Boost New/Low-Booking Talent ON' : 'Highest Rated First'}</span>
                  </button>
                </div>
              </div>

              {/* Active Tracker Bar (if active booking exists or any in_transit / accepted booking) */}
              {(() => {
                const activeJob = activeTrackerBooking || myBookings.find(b => b.status === 'in_transit' || b.status === 'accepted' || b.status === 'work_started');
                if (!activeJob) return null;

                const workerObj = workersList.find(w => w.id === activeJob.workerId);
                const distanceVal = activeJob.currentDistanceKm ?? (activeJob.status === 'work_started' ? 0.0 : 1.8);
                const etaMins = activeJob.estimatedArrivalMins ?? (activeJob.status === 'work_started' ? 0 : 8);
                const code = activeJob.startWorkCode || activeJob.startServiceOtp;

                return (
                  <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-emerald-500/80 rounded-2xl text-white shadow-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping absolute -inset-0.5" />
                          <div className="w-3 h-3 bg-emerald-400 rounded-full relative z-10" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              {activeJob.status === 'work_started' ? '🛠️ WORK IN PROGRESS' : '🛵 LIVE WORKER EN ROUTE'}
                            </span>
                            <span className="text-xs font-black text-white truncate">
                              {activeJob.workerName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {activeJob.trade.toUpperCase()} • {activeJob.address}
                          </p>
                        </div>
                      </div>

                      {code && (
                        <div className="text-right shrink-0 bg-amber-400/10 border border-amber-400/40 rounded-xl px-2.5 py-1">
                          <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">
                            Start Work Code
                          </span>
                          <span className="text-sm font-black font-mono text-amber-400 tracking-wider">
                            {code}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Telemetry row: Worker Distance, ETA, and Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs gap-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px]">Distance:</span>
                          <strong className="text-emerald-300 font-mono text-xs">
                            {activeJob.status === 'work_started' ? 'At Site (0.0 km)' : `${distanceVal} km`}
                          </strong>
                        </div>

                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[11px]">ETA:</span>
                          <strong className="text-blue-300 font-mono text-xs">
                            {activeJob.status === 'work_started' ? 'Arrived' : `~${etaMins} mins`}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {workerObj && (
                          <button
                            onClick={() => handleInitiateContact(workerObj, 'call')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Worker</span>
                          </button>
                        )}

                        <button
                          onClick={() => setActiveTrackerBooking(activeJob)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Track Live Map</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Main Content Tabs */}
              <div className="flex border-b border-slate-200 font-bold text-xs text-slate-500 overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setActiveTab('workers')}
                  className={`py-2.5 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'workers'
                      ? 'border-blue-600 text-blue-700 font-extrabold'
                      : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Karigars ({filteredWorkers.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`py-2.5 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'portfolio'
                      ? 'border-blue-600 text-blue-700 font-extrabold'
                      : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Work Photos</span>
                </button>

                <button
                  onClick={() => setActiveTab('passwork')}
                  className={`py-2.5 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'passwork'
                      ? 'border-blue-600 text-blue-700 font-extrabold'
                      : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Sub-Contracts ({subContractJobs.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-2.5 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'bookings'
                      ? 'border-blue-600 text-blue-700 font-extrabold'
                      : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>{currentRole === 'worker' ? 'Job History' : 'Bookings & History'} ({myBookings.length})</span>
                </button>
              </div>

              {/* TAB 1: WORKERS LIST WITH NATIVE ADMOB CARD */}
              {activeTab === 'workers' && (
                <div id="karigar-profiles-list" className="space-y-3">
                  {/* Sub-Contract & Co-Worker Dispatch Option for Main Contractors / Raj Mestris */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-300/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                            Raj Mestri & Contractor Hub
                          </span>
                          <span className="text-xs font-black text-amber-950">
                            Sub-Contract / Co-Worker Dispatch
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 mt-0.5 font-medium">
                          Assign excess work or subcontract tasks to verified laborers, plumbers, carpenters & helpers within the network.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        onClick={() => setActiveTab('passwork')}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Sub-Contract Tasks ({subContractJobs.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Verified Karigars & Direct Connect Header */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">
                            🔒 Masked Routing
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900">
                            Verified Karigar Profiles & In-App Connect
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                          Personal numbers shielded. Connect directly via <strong className="text-emerald-700">Call via App (Masked)</strong> or <strong className="text-blue-700">In-App Chat / Book</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-center">
                      <span className="text-emerald-700">🔒 Anti-Bypass Protected</span>
                      <span>•</span>
                      <span>30-Day Platform Warranty</span>
                    </div>
                  </div>

                  {filteredWorkers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {filteredWorkers.map((worker, index) => (
                        <React.Fragment key={worker.id}>
                          <WorkerCard
                            worker={worker}
                            currentLanguage={currentLanguage}
                            onSelectWorker={(w) => setSelectedWorkerDetail(w)}
                            onChatClick={(w) => handleOpenChatForWorker(w)}
                            onCallClick={(w) => handleInitiateContact(w, 'call')}
                            onWhatsappClick={(w) => handleInitiateContact(w, 'whatsapp')}
                          />
                          {/* Inject Native Ad after every 3 workers */}
                          {index === 2 && <div className="sm:col-span-2"><NativeAdCard /></div>}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                      <HardHat className="w-10 h-10 text-slate-400 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">
                        No Karigars found matching filter
                      </h4>
                      <p className="text-xs text-slate-500">
                        Try clearing trade filters or emergency toggle.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setIsEmergencyOnly(false);
                          setSearchQuery('');
                        }}
                        className="py-1.5 px-3.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PORTFOLIO GALLERY */}
              {activeTab === 'portfolio' && (
                <WorkPortfolio
                  portfolio={allPortfolioItems}
                  currentLanguage={currentLanguage}
                  onAddPortfolioItem={handleAddPortfolioItem}
                />
              )}

              {/* TAB 3: SUB-CONTRACT BOARD / PASS WORK */}
              {activeTab === 'passwork' && (
                <SubContractBoard
                  jobs={subContractJobs}
                  currentLanguage={currentLanguage}
                  onPostJob={handlePostSubContract}
                  onCallContractor={(phone, name) =>
                    handleInitiateContact({
                      id: 'c-temp',
                      name,
                      phone,
                      aadhaarVerified: true,
                      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
                      role: 'worker',
                      primaryTrade: 'mason',
                      pricingType: 'daily',
                      dailyRate: 1000,
                      visitingFee: 200,
                      recentBookingCount: 1,
                      rating: 5,
                      reviewsCount: 12,
                      experienceYears: 10,
                      city: 'Mumbai',
                      distanceKm: 2,
                      isEmergencyAvailable: true,
                      isAvailableToday: true,
                      bio: 'Contractor',
                      languagesSpoken: ['Hindi'],
                      portfolio: [],
                      completedJobs: 50,
                    }, 'call')
                  }
                  onWhatsappContractor={(phone, name, jobTitle) =>
                    handleInitiateContact({
                      id: 'c-temp',
                      name,
                      phone,
                      aadhaarVerified: true,
                      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
                      role: 'worker',
                      primaryTrade: 'mason',
                      pricingType: 'daily',
                      dailyRate: 1000,
                      visitingFee: 200,
                      recentBookingCount: 1,
                      rating: 5,
                      reviewsCount: 12,
                      experienceYears: 10,
                      city: 'Mumbai',
                      distanceKm: 2,
                      isEmergencyAvailable: true,
                      isAvailableToday: true,
                      bio: `Interested in job: ${jobTitle}`,
                      languagesSpoken: ['Hindi'],
                      portfolio: [],
                      completedJobs: 50,
                    }, 'whatsapp')
                  }
                />
              )}

              {/* TAB 4: SERVICE HISTORY & BOOKINGS */}
              {activeTab === 'bookings' && (
                <div id="service-history-container" className="space-y-4">
                  <ServiceHistoryView
                    currentRole={currentRole}
                    currentLanguage={currentLanguage}
                    bookings={myBookings}
                    workersList={workersList}
                    onBookAgain={(worker) => setBookingWorker(worker)}
                    onCallWorker={(worker) => handleInitiateContact(worker, 'call')}
                    onChatWorker={(worker) => handleOpenChatForWorker(worker)}
                    onRateWorker={(booking, worker) => setRatingModalData({ booking, worker })}
                    onOpenLiveTracker={(booking) => setActiveTrackerBooking(booking)}
                  />
                </div>
              )}
            </main>

            {/* STICKY ADMOB BANNER AT BOTTOM OF MAIN PAGES */}
            <div className="sticky bottom-[53px] left-0 right-0 z-30 bg-slate-900 shadow-2xl">
              <BannerAd adUnitId={ADMOB_CONFIG.bannerAdUnitId} />
            </div>

            {/* BOTTOM NAVIGATION BAR */}
            <BottomNavBar
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              bookingsCount={myBookings.length}
              currentRole={currentRole}
              subContractJobsCount={subContractJobs.length}
            />

            {/* MODALS */}
            {selectedWorkerDetail && (
              <WorkerDetailModal
                worker={selectedWorkerDetail}
                currentLanguage={currentLanguage}
                onClose={() => setSelectedWorkerDetail(null)}
                onChatClick={(w) => {
                  setSelectedWorkerDetail(null);
                  handleOpenChatForWorker(w);
                }}
                onCallClick={(w) => {
                  setSelectedWorkerDetail(null);
                  handleInitiateContact(w, 'call');
                }}
                onWhatsappClick={(w) => {
                  setSelectedWorkerDetail(null);
                  handleInitiateContact(w, 'whatsapp');
                }}
                onBookClick={(w) => {
                  setSelectedWorkerDetail(null);
                  setBookingWorker(w);
                }}
                onEditClick={(w) => {
                  setSelectedWorkerDetail(null);
                  setEditingWorkerProfile(w);
                }}
              />
            )}

            {/* Category Action Modal: 2 Options (Instant Dispatch vs Browse Profiles) */}
            {isActionModalOpen && (
              <CategoryActionModal
                isOpen={isActionModalOpen}
                category={modalCategory}
                currentLanguage={currentLanguage}
                onInstantDispatch={(category) => handleInstantDispatchFromCategory(category)}
                onBrowseProfiles={(category) => handleBrowseProfilesFromCategory(category)}
                onClose={() => setIsActionModalOpen(false)}
              />
            )}

            {showEmergencyDispatch && (
              <EmergencyDispatchModal
                category={selectedCategory !== 'all' ? selectedCategory : 'mason'}
                workers={workersList}
                currentLanguage={currentLanguage}
                onWorkerAccepted={handleEmergencyWorkerAccepted}
                onCallClick={(w) => {
                  setShowEmergencyDispatch(false);
                  handleInitiateContact(w, 'call');
                }}
                onCancel={() => setShowEmergencyDispatch(false)}
              />
            )}

            {activeTrackerBooking && (() => {
              const trackerWorker = workersList.find(w => w.id === activeTrackerBooking.workerId) || workersList[0];
              return (
                <JobTrackerModal
                  booking={activeTrackerBooking}
                  worker={trackerWorker}
                  currentLanguage={currentLanguage}
                  onOpenChat={(workerId) => handleOpenChatForWorker(trackerWorker)}
                  onCallClick={(w) => handleInitiateContact(w, 'call')}
                  onOpenQuoteModal={() => {
                    setQuoteModalState({
                      show: true,
                      mode: currentRole === 'worker' ? 'worker_create' : 'customer_view',
                      worker: trackerWorker,
                      bookingId: activeTrackerBooking.id
                    });
                  }}
                  onUpdateStatus={(newStatus) => {
                    const updated = { ...activeTrackerBooking, status: newStatus };
                    setActiveTrackerBooking(updated);
                    setMyBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
                  }}
                  onUpdateBooking={(updated) => {
                    setActiveTrackerBooking(updated);
                    setMyBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
                  }}
                  onFinishService={(bookingToFinish) => {
                    handleCustomerFinishService(bookingToFinish);
                  }}
                  onClose={() => setActiveTrackerBooking(null)}
                />
              );
            })()}

            {quoteModalState.show && quoteModalState.worker && (
              <PostInspectionQuoteModal
                mode={quoteModalState.mode}
                worker={quoteModalState.worker}
                bookingId={quoteModalState.bookingId}
                quote={quoteModalState.bookingId ? (myBookings.find(b => b.id === quoteModalState.bookingId)?.quote || activeTrackerBooking?.quote) : activeTrackerBooking?.quote}
                onSendQuote={handleSendQuote}
                onApproveQuote={() => {
                  const targetBookingId = quoteModalState.bookingId || activeTrackerBooking?.id;
                  setMyBookings(prev => prev.map(b => {
                    if (b.id === targetBookingId && b.quote) {
                      return {
                        ...b,
                        quote: { ...b.quote, status: 'approved' as const },
                        status: 'work_started' as const,
                        serviceStartedAt: b.serviceStartedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                    }
                    return b;
                  }));
                  if (activeTrackerBooking && activeTrackerBooking.quote) {
                    setActiveTrackerBooking({
                      ...activeTrackerBooking,
                      quote: { ...activeTrackerBooking.quote, status: 'approved' as const },
                      status: 'work_started' as const,
                      serviceStartedAt: activeTrackerBooking.serviceStartedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                  }
                  setQuoteModalState({ show: false, mode: 'customer_view', worker: null });
                }}
                onRejectQuote={() => {
                  const targetBookingId = quoteModalState.bookingId || activeTrackerBooking?.id;
                  setMyBookings(prev => prev.map(b => {
                    if (b.id === targetBookingId && b.quote) {
                      return {
                        ...b,
                        quote: { ...b.quote, status: 'rejected' as const }
                      };
                    }
                    return b;
                  }));
                  if (activeTrackerBooking && activeTrackerBooking.quote) {
                    setActiveTrackerBooking({
                      ...activeTrackerBooking,
                      quote: { ...activeTrackerBooking.quote, status: 'rejected' as const }
                    });
                  }
                  setQuoteModalState({ show: false, mode: 'customer_view', worker: null });
                }}
                onClose={() => setQuoteModalState({ show: false, mode: 'customer_view', worker: null })}
              />
            )}

            {editingWorkerProfile && (
              <WorkerEditModal
                worker={editingWorkerProfile}
                onSave={(updatedWorker) => {
                  setWorkersList((prev) =>
                    prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w))
                  );
                  if (currentRole === 'worker') {
                    setUserProfile((prev) => ({
                      ...prev,
                      photoUrl: updatedWorker.photoUrl || prev.photoUrl,
                    }));
                    accountLifecycleService.saveOrUpdateUser({
                      phoneNumber: updatedWorker.phone || userProfile.phone,
                      name: updatedWorker.name,
                      photoUrl: updatedWorker.photoUrl,
                      role: 'worker',
                      trade: updatedWorker.primaryTrade,
                      aadhaarVerified: updatedWorker.aadhaarVerified,
                      bio: updatedWorker.bio,
                      dailyRate: updatedWorker.dailyRate,
                      visitingFee: updatedWorker.visitingFee,
                    });
                  }
                }}
                onOpenSoftDelete={() => setShowSoftDeleteModal(true)}
                onClose={() => setEditingWorkerProfile(null)}
              />
            )}

            {showInterstitialAd && (
              <InterstitialAdModal
                title={interstitialTitle}
                subtitle={interstitialSubtitle}
                adUnitId={ADMOB_CONFIG.interstitialAdUnitId}
                actionType={pendingAdAction?.type === 'instant_dispatch' ? 'instant_dispatch' : 'call'}
                targetWorkerName={
                  pendingAdAction && 'worker' in pendingAdAction
                    ? pendingAdAction.worker.name
                    : undefined
                }
                onOpenVipPaywall={() => {
                  setVipPaywallReason('ad_skipped');
                  setShowVipPaywall(true);
                }}
                onClose={() => {
                  setShowInterstitialAd(false);
                  if (pendingAdAction) {
                    const action = pendingAdAction;
                    setPendingAdAction(null);
                    if (action.type === 'call') {
                      setCommModal({
                        worker: action.worker,
                        mode: 'call',
                      });
                    } else if (action.type === 'whatsapp') {
                      setCommModal({
                        worker: action.worker,
                        mode: 'whatsapp',
                      });
                    } else if (action.type === 'instant_dispatch') {
                      setSelectedCategory(action.category);
                      setShowEmergencyDispatch(true);
                    } else if (action.type === 'booking_tracker') {
                      setActiveTrackerBooking(action.booking);
                    }
                  }
                }}
                onProceedAction={() => {
                  if (pendingAdAction) {
                    const action = pendingAdAction;
                    setPendingAdAction(null);
                    if (action.type === 'call') {
                      setCommModal({
                        worker: action.worker,
                        mode: 'call',
                      });
                    } else if (action.type === 'whatsapp') {
                      setCommModal({
                        worker: action.worker,
                        mode: 'whatsapp',
                      });
                    } else if (action.type === 'instant_dispatch') {
                      setSelectedCategory(action.category);
                      setShowEmergencyDispatch(true);
                    } else if (action.type === 'booking_tracker') {
                      setActiveTrackerBooking(action.booking);
                    }
                  }
                }}
              />
            )}

            {activeChatWorkerId && (() => {
              const chatWorker = workersList.find(w => w.id === activeChatWorkerId) || workersList[0];
              const conv = conversations.find(c => c.workerId === activeChatWorkerId);
              const msgs = conv?.messages || [];

              return (
                <ChatModal
                  worker={chatWorker}
                  currentLanguage={currentLanguage}
                  messages={msgs}
                  onSendMessage={handleSendMessage}
                  onCallClick={(w) => handleInitiateContact(w, 'call')}
                  onWhatsappClick={(w) => handleInitiateContact(w, 'whatsapp')}
                  onClose={() => setActiveChatWorkerId(null)}
                />
              );
            })()}

            {showInboxModal && (
              <InboxModal
                conversations={conversations}
                workers={workersList}
                currentLanguage={currentLanguage}
                onOpenChat={(workerId) => {
                  setShowInboxModal(false);
                  setActiveChatWorkerId(workerId);
                }}
                onCallClick={(w) => handleInitiateContact(w, 'call')}
                onClose={() => setShowInboxModal(false)}
              />
            )}

            {commModal.mode && commModal.worker && (
              <DirectCommModal
                worker={commModal.worker}
                mode={commModal.mode}
                onClose={() => setCommModal({ worker: null, mode: null })}
                currentLanguage={currentLanguage}
                onOpenInAppChat={(w, initialMsg) => {
                  setCommModal({ worker: null, mode: null });
                  handleOpenChatForWorker(w, initialMsg);
                }}
                onBookService={(w) => {
                  setCommModal({ worker: null, mode: null });
                  setBookingWorker(w);
                }}
              />
            )}

            {bookingWorker && (
              <DirectBookingModal
                worker={bookingWorker}
                currentLanguage={currentLanguage}
                onClose={() => setBookingWorker(null)}
                onConfirmBooking={handleConfirmBooking}
              />
            )}

            {/* PERFORMANCE & BEHAVIOR RATING MODAL */}
            {ratingModalData && (
              <WorkerRatingModal
                booking={ratingModalData.booking}
                worker={ratingModalData.worker}
                currentLanguage={currentLanguage}
                onSubmitReview={handleSubmitWorkerReview}
                onSubmit={handleSubmitWorkerReview}
                onClose={() => setRatingModalData(null)}
              />
            )}

            {/* REAL-TIME ADMIN FLAGGING QUALITY ALERT BANNER */}
            {adminAlertMessage && (
              <div className="fixed top-14 left-4 right-4 z-50 p-3.5 bg-rose-950/95 text-white border border-rose-500/80 rounded-2xl shadow-2xl flex items-start justify-between gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block text-rose-300">
                      GharKaExpert Safety & Quality Control
                    </span>
                    <p className="text-xs text-rose-100 font-semibold leading-snug mt-0.5">
                      {adminAlertMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAdminAlertMessage(null)}
                  className="text-rose-300 hover:text-white text-xs font-bold px-2 py-1 bg-rose-900/60 rounded-lg shrink-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* VIP SUBSCRIPTION PAYWALL MODAL (₹99/mo & ₹999/yr) */}
            <VipPaywallModal
              isOpen={showVipPaywall}
              onClose={() => setShowVipPaywall(false)}
              currentSubscription={vipSubscription}
              reason={vipPaywallReason}
              onProceedToCheckout={(tier: VipPlanTier) => {
                setShowVipPaywall(false);
                setCheckoutPlanTier(tier);
                setShowCheckoutModal(true);
              }}
              onSubscribe={(tier: VipPlanTier) => {
                setShowVipPaywall(false);
                setCheckoutPlanTier(tier);
                setShowCheckoutModal(true);
              }}
            />

            {/* VIP PAYMENT CHECKOUT GATEWAY MODAL (UPI, Cards, Net Banking, Wallets) */}
            <PaymentCheckoutModal
              isOpen={showCheckoutModal}
              onClose={() => setShowCheckoutModal(false)}
              planType={checkoutPlanTier}
              onPaymentSuccess={(result: PaymentTransactionResult) => {
                // Update user's state instantly with isVipUser = true, planType, and expiryDate (30 or 365 days)
                const updatedSub = PaymentService.createSubscriptionFromPayment(result);
                setVipSubscription(updatedSub);
                PaymentService.saveSubscription(updatedSub);

                // Show instant positive confirmation banner
                setAdminAlertMessage(
                  `👑 VIP Member Active (${result.planType === 'yearly' ? '₹999 Yearly Plan' : '₹99 Monthly Plan'})! All full-screen interstitial ads have been completely removed.`
                );
              }}
              onPaymentFailure={(error) => {
                console.log('VIP Payment attempt cancelled or failed:', error);
              }}
            />

            {/* SOFT DELETE ACCOUNT MODAL */}
            <SoftDeleteAccountModal
              isOpen={showSoftDeleteModal}
              onClose={() => setShowSoftDeleteModal(false)}
              currentUser={{
                name: userProfile.name,
                phone: userProfile.phone,
                photoUrl: userProfile.photoUrl,
                role: currentRole,
                rating: currentRole === 'worker' ? workersList[0]?.rating || 4.9 : 5.0,
                reviewsCount: currentRole === 'worker' ? workersList[0]?.reviewsCount || 84 : 12,
                completedJobs: currentRole === 'worker' ? workersList[0]?.completedJobs || 142 : undefined,
              }}
              onConfirmSoftDelete={handleSoftDeleteAccount}
            />
          </div>
        )}
      </div>
    </MobileDeviceFrame>
  );
}
