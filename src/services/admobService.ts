/**
 * Google Mobile Ads SDK (AdMob) Integration Service
 * 
 * Configured IDs:
 * - App ID: ca-app-pub-7439683563136300~5277822881
 * - Banner Ad Unit ID: ca-app-pub-7439683563136300/3250425347
 * - Interstitial Ad Unit ID: ca-app-pub-7439683563136300/5434744718
 * 
 * Monetization Rules:
 * 1. Free Users (No Recharge):
 *    - Show Banner Ads (Fixed at bottom screen).
 *    - Show Full-Screen Interstitial Ads on high-intent actions (Call, Reveal Phone Number, Booking navigation).
 *    - Frequency Capping: Max 1 interstitial ad per 2 minutes (120 seconds).
 * 2. VIP Users (₹99/mo or ₹999/yr):
 *    - Show ONLY Non-intrusive Banner Ads at bottom.
 *    - STRICTLY REMOVE/BLOCK ALL Full-Screen Interstitial Ads so workflow is never interrupted.
 */

import { VipSubscriptionState } from '../types';

export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-7439683563136300~5277822881',
  bannerAdUnitId: 'ca-app-pub-7439683563136300/3250425347',
  interstitialAdUnitId: 'ca-app-pub-7439683563136300/5434744718',
  frequencyCapSeconds: 120, // 2 minutes frequency cap for free users
};

// Interface for global AdMob & GPT window objects
declare global {
  interface Window {
    googletag?: {
      cmd: Array<() => void>;
      display?: (slotId: string) => void;
      defineSlot?: (adUnitPath: string, size: [number, number], divId: string) => any;
      pubads?: () => any;
      enableServices?: () => void;
    };
    admob?: {
      banner?: {
        show: (options: { id: string }) => Promise<void>;
        hide: () => Promise<void>;
      };
      interstitial?: {
        load: (options: { id: string }) => Promise<void>;
        show: () => Promise<void>;
      };
    };
  }
}

class AdMobService {
  private isInitialized = false;
  private isInterstitialReady = false;
  private lastInterstitialTimestamp: number = 0;

  /**
   * Initializes the Google Mobile Ads SDK
   */
  public initialize(): void {
    if (this.isInitialized) return;

    try {
      window.googletag = window.googletag || { cmd: [] };
      
      if (!document.getElementById('admob-gpt-script')) {
        const script = document.createElement('script');
        script.id = 'admob-gpt-script';
        script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onerror = () => {
          console.info('[AdMob SDK] Ad network script blocked or offline; falling back gracefully.');
        };
        document.head.appendChild(script);
      }

      window.googletag.cmd.push(() => {
        try {
          if (window.googletag && typeof window.googletag.pubads === 'function') {
            const pubads = window.googletag.pubads();
            pubads?.enableSingleRequest?.();
            pubads?.collapseEmptyDivs?.();
          }
          if (window.googletag && typeof window.googletag.enableServices === 'function') {
            window.googletag.enableServices();
          }
        } catch {
          // Fallback gracefully
        }
      });

      this.isInitialized = true;
      this.isInterstitialReady = true;
      console.log(`[AdMob SDK] Initialized with App ID: ${ADMOB_CONFIG.appId}`);
    } catch (e) {
      console.warn('[AdMob SDK] Initialization notice:', e);
      this.isInitialized = true;
      this.isInterstitialReady = true;
    }
  }

  /**
   * Returns whether Google Mobile Ads SDK is ready
   */
  public getIsReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Pre-load an interstitial ad
   */
  public prepareInterstitial(): void {
    this.isInterstitialReady = true;
  }

  /**
   * Check frequency capping logic (max 1 interstitial ad per 2 minutes for free users)
   */
  public canShowInterstitial(isVip: boolean): boolean {
    // VIP users strictly blocked from all full-screen interstitials
    if (isVip) {
      return false;
    }

    const now = Date.now();
    const elapsedSeconds = (now - this.lastInterstitialTimestamp) / 1000;
    return elapsedSeconds >= ADMOB_CONFIG.frequencyCapSeconds;
  }

  /**
   * Record that an interstitial ad was displayed
   */
  public recordInterstitialShown(): void {
    this.lastInterstitialTimestamp = Date.now();
  }

  /**
   * Seconds remaining until the next interstitial can be shown
   */
  public getRemainingCooldownSeconds(): number {
    const elapsed = (Date.now() - this.lastInterstitialTimestamp) / 1000;
    const remaining = Math.max(0, Math.ceil(ADMOB_CONFIG.frequencyCapSeconds - elapsed));
    return remaining;
  }

  /**
   * High-Intent Action Trigger Helper:
   * if (!user.isVipUser) { showInterstitialAdThenProceed(); } else { proceedDirectly(); }
   */
  public handleHighIntentAction({
    user,
    onShowInterstitial,
    onProceedDirectly,
    forceSkipCooldown = false,
  }: {
    user: VipSubscriptionState;
    onShowInterstitial: () => void;
    onProceedDirectly: () => void;
    forceSkipCooldown?: boolean;
  }): void {
    // 1. If VIP User: Proceed directly without interruption
    if (user.isVipUser) {
      console.log('[AdMob Service] VIP User verified - Bypassing all Interstitial Ads');
      onProceedDirectly();
      return;
    }

    // 2. Free User: Check Frequency Capping (max 1 ad per 2 mins)
    const allowedByCooldown = this.canShowInterstitial(false);
    if (!forceSkipCooldown && !allowedByCooldown) {
      console.log(`[AdMob Service] Free User within 2-min frequency cap (${this.getRemainingCooldownSeconds()}s left) - Proceeding directly`);
      onProceedDirectly();
      return;
    }

    // 3. Free User outside cooldown: Show Interstitial Ad
    console.log('[AdMob Service] Free User triggered High-Intent Interstitial Ad');
    this.recordInterstitialShown();
    onShowInterstitial();
  }

  /**
   * Direct Cordova/Capacitor native interstitial trigger fallback
   */
  public triggerInterstitial(onComplete: () => void): void {
    if (window.admob?.interstitial) {
      window.admob.interstitial
        .load({ id: ADMOB_CONFIG.interstitialAdUnitId })
        .then(() => window.admob!.interstitial!.show())
        .then(() => onComplete())
        .catch(() => onComplete());
      return;
    }
    onComplete();
  }
}

export const admobService = new AdMobService();
