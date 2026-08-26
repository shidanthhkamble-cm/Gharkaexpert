export type Language = 
  | 'en' // English
  | 'hi' // Hindi
  | 'mr' // Marathi
  | 'te' // Telugu
  | 'gu' // Gujarati
  | 'pa' // Punjabi
  | 'kn' // Kannada
  | 'ta' // Tamil
  | 'ml' // Malayalam
  | 'bho' // Bhojpuri
  | 'raj' // Rajasthani
  | 'as' // Assamese
  | 'bn' // Bengali
  | 'ur'; // Urdu

export type UserRole = 'customer' | 'worker';

export type TradeCategory = 
  | 'mason'
  | 'carpenter'
  | 'painter'
  | 'plumber'
  | 'electrician'
  | 'tiles'
  | 'helper'
  | 'ac_repair'
  | 'appliance_repair'
  | 'bike_mechanic'
  | 'car_mechanic'
  | 'auto_mechanic'
  | 'truck_mechanic';

export type PricingType = 'daily' | 'visiting';

export interface PortfolioItem {
  id: string;
  title: string;
  category: TradeCategory;
  imageUrl: string;
  description: string;
  date: string;
  location?: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  aadhaarVerified: boolean;
  aadhaarNumberMasked?: string;
  photoUrl: string;
  role: 'worker';
  primaryTrade: TradeCategory;
  additionalTrades?: TradeCategory[];
  pricingType: PricingType;
  dailyRate: number; // in INR ₹ for home trades
  sqftRate?: number; // e.g., ₹25/sq.ft for tiles/painter/mason
  visitingFee: number; // in INR ₹ for mechanics/appliance
  rating: number; // 1-5
  reviewsCount: number;
  experienceYears: number;
  city: string;
  distanceKm: number;
  isEmergencyAvailable: boolean;
  isAvailableToday: boolean;
  bio: string;
  languagesSpoken: string[];
  portfolio: PortfolioItem[];
  completedJobs: number;
  recentBookingCount: number; // used for Fair Rotation Algorithm
  isNewKarigar?: boolean; // badge for newly joined karigars
}

export interface SubContractJob {
  id: string;
  title: string;
  contractorName: string;
  contractorPhone: string;
  tradeRequired: TradeCategory;
  workersNeeded: number;
  city: string;
  locationArea: string;
  dailyWage: number;
  durationDays: number;
  description: string;
  isUrgent: boolean;
  postedTimeAgo: string;
  applicantsCount: number;
}

export interface PostInspectionQuote {
  id: string;
  bookingId: string;
  workerId: string;
  workerName: string;
  totalAmount: number;
  description: string;
  hasVoiceNote?: boolean;
  voiceNoteDurationSec?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface DirectBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  trade: TradeCategory;
  bookingDate: string;
  timeSlot: string;
  address: string;
  isEmergency: boolean;
  notes: string;
  status: 'searching' | 'accepted' | 'in_transit' | 'work_started' | 'completed' | 'cancelled';
  quote?: PostInspectionQuote;
  createdAt: string;
  estimatedArrivalMins?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'worker';
  text: string;
  translatedText?: Record<Language, string>;
  imageUrl?: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  workerId: string;
  workerName: string;
  workerPhoto: string;
  workerTrade: TradeCategory;
  workerPhone: string;
  dailyRate: number;
  visitingFee?: number;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
}

