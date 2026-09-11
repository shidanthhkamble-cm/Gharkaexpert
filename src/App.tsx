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
  Star
} from 'lucide-react';

import { Language, UserRole, TradeCategory, WorkerProfile, PortfolioItem, SubContractJob, DirectBooking, Conversation, ChatMessage, PostInspectionQuote, WorkerReview } from './types';
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
import { EmergencyDispatchModal } from './components/EmergencyDispatchModal';
import { CategoryActionModal } from './components/CategoryActionModal';
import { PostInspectionQuoteModal } from './components/PostInspectionQuoteModal';
import { JobTrackerModal } from './components/JobTrackerModal';
import { WorkerEditModal } from './components/WorkerEditModal';
import { WorkerRatingModal } from './components/WorkerRatingModal';

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
  }>({
    name: 'Ramesh Sharma',
    phone: '+91 98765 43210',
    photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
    verified: true,
  });

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
      isEmergency: false,
      notes: 'Bathroom tile setting & masonry repair',
      status: 'in_transit',
      startServiceOtp: '7419',
      otpVerified: false,
      arrivalProgressPercent: 45,
      estimatedArrivalMins: 8,
      createdAt: new Date().toISOString()
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

  // Initialize AdMob on component mount
  useEffect(() => {
    admobService.initialize();
  }, []);

  // Trigger Google AdMob Interstitial Ad right when user connects via In-App Masked Call or Chat
  const handleInitiateContact = (worker: WorkerProfile, mode: 'call' | 'whatsapp') => {
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
  // Automatically search and connect with an available worker within a strict 1.5km radius using Fair Rotation algorithm (triggering an Interstitial ad first).
  const handleInstantDispatchFromCategory = (category: TradeCategory) => {
    setIsActionModalOpen(false);
    setSelectedCategory(category);
    const catLabel = getCategoryLabel(category, currentLanguage) || category;
    setPendingAdAction({ type: 'instant_dispatch', category });
    setInterstitialTitle(`Instant Dispatch: ${catLabel} • Google AdMob`);
    setInterstitialSubtitle(
      `Auto-matching available ${catLabel} within a strict 1.5km radius using Fair Rotation algorithm. Auto-initiating masked call with 0% commission.`
    );
    setShowInterstitialAd(true);
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
  }) => {
    setUserProfile(data);
    setOnboardingStep('role');
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
    const bookingWithOtp: DirectBooking = {
      ...newBooking,
      startServiceOtp: newBooking.startServiceOtp || Math.floor(1000 + Math.random() * 9000).toString(),
      otpVerified: false,
      arrivalProgressPercent: newBooking.arrivalProgressPercent ?? 20,
      estimatedArrivalMins: newBooking.estimatedArrivalMins ?? 12,
    };
    setMyBookings((prev) => [bookingWithOtp, ...prev]);
    setPendingAdAction({ type: 'booking_tracker', booking: bookingWithOtp });
    setInterstitialTitle('Booking Confirmed! Google AdMob Sponsor Offer');
    setInterstitialSubtitle('Your Karigar appointment is locked. Sponsored by Google AdMob.');
    setShowInterstitialAd(true);
  };

  // Worker Emergency Match Acceptance
  const handleEmergencyWorkerAccepted = (worker: WorkerProfile) => {
    setShowEmergencyDispatch(false);
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
      isEmergency: true,
      notes: 'Instant Direct Connect Dispatch',
      status: 'in_transit',
      startServiceOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      otpVerified: false,
      arrivalProgressPercent: 25,
      estimatedArrivalMins: 11,
      createdAt: new Date().toISOString()
    };
    setMyBookings((prev) => [emergencyBooking, ...prev]);
    setPendingAdAction({ type: 'booking_tracker', booking: emergencyBooking });
    setInterstitialTitle(`Karigar Dispatched: ${worker.name} • Google AdMob`);
    setInterstitialSubtitle(`Live GPS tracking for ${worker.name} will begin once sponsor message completes.`);
    setShowInterstitialAd(true);
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
      <div className="min-h-[640px] bg-slate-50 text-slate-800 flex flex-col justify-between select-none relative">
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
          <div className="flex flex-col min-h-[640px] pb-16 bg-slate-50">
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
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-xs"
                      title="Edit Rates & Profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">My Rates</span>
                    </button>
                  )}

                  <button
                    onClick={() => setOnboardingStep('language')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1 font-bold border border-slate-700"
                    title="Re-run Onboarding / Switch Language"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>

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

              {/* Active Tracker Bar (if active booking exists) */}
              {activeTrackerBooking && (
                <div className="p-3 bg-slate-900 border border-emerald-500/50 rounded-2xl text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    <div>
                      <p className="text-xs font-bold text-emerald-300">Active Job: {activeTrackerBooking.workerName}</p>
                      <p className="text-[10px] text-slate-300">Status: {activeTrackerBooking.status.toUpperCase()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTrackerBooking(activeTrackerBooking)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Track Live</span>
                  </button>
                </div>
              )}

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
                  <CalendarCheck className="w-4 h-4" />
                  <span>My Bookings ({myBookings.length})</span>
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

              {/* TAB 4: MY BOOKINGS & JOB TRACKER */}
              {activeTab === 'bookings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Your Active Bookings & Requests
                    </h3>
                  </div>

                  {myBookings.length > 0 ? (
                    <div className="space-y-2.5">
                      {myBookings.map((b) => (
                        <div
                          key={b.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {b.workerName} ({b.trade.toUpperCase()})
                            </span>
                            <div className="flex items-center gap-1.5">
                              {b.startServiceOtp && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-md text-[10px] font-mono font-bold flex items-center gap-1">
                                  <span>OTP:</span>
                                  <span className="text-amber-700 font-black">{b.startServiceOtp}</span>
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                b.status === 'work_started'
                                  ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'in_transit'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {b.status === 'in_transit' ? '🛵 IN TRANSIT' : b.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">
                            <strong>Date & Slot:</strong> {b.bookingDate} ({b.timeSlot})
                          </p>
                          {b.status === 'in_transit' && (
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                              <span className="text-slate-600 text-[11px] flex items-center gap-1">
                                🛵 <strong>Live Tracking Active:</strong> Path to site
                              </span>
                              <span className="text-emerald-700 font-extrabold text-[11px]">
                                {b.arrivalProgressPercent ? `${b.arrivalProgressPercent}% completed` : 'En Route'}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setActiveTrackerBooking(b)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>{b.status === 'completed' ? 'View Route History' : 'Live GPS Map & Start OTP'}</span>
                              </button>

                              {b.status === 'work_started' && (
                                <button
                                  onClick={() => handleCustomerFinishService(b)}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Finish Service</span>
                                </button>
                              )}

                              {b.status === 'completed' && (
                                b.review ? (
                                  <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>Rated {b.rating}/5</span>
                                    {b.review.isFlaggedForAdminReview && (
                                      <span className="text-rose-600 font-extrabold ml-1">• Flagged</span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const workerObj = workersList.find(w => w.id === b.workerId) || workersList[0];
                                      setRatingModalData({ booking: b, worker: workerObj });
                                    }}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                                    <span>Rate Karigar</span>
                                  </button>
                                )
                              )}

                              {(b.trade.includes('mechanic') || b.trade.includes('ac')) && (
                                <button
                                  onClick={() => {
                                    const workerObj = workersList.find(w => w.id === b.workerId) || workersList[0];
                                    setQuoteModalState({
                                      show: true,
                                      mode: currentRole === 'worker' ? 'worker_create' : 'customer_view',
                                      worker: workerObj,
                                      bookingId: b.id
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>{currentRole === 'worker' ? 'Send Estimate' : 'View Estimate'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
                      No active bookings yet. Select a verified Karigar and tap 'Book Karigar'!
                    </div>
                  )}
                </div>
              )}
            </main>

            {/* STICKY ADMOB BANNER AT BOTTOM OF MAIN PAGES */}
            <div className="sticky bottom-0 left-0 right-0 z-40 bg-slate-900 shadow-2xl">
              <BannerAd adUnitId={ADMOB_CONFIG.bannerAdUnitId} />
            </div>

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
                  setWorkersList(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
                }}
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
          </div>
        )}
      </div>
    </MobileDeviceFrame>
  );
}
