/**
 * Google Mobile Ads SDK (AdMob) Capacitor Integration Service
 * Powered by @capacitor-community/admob
 *
 * Production AdMob IDs:
 * - AdMob App ID: ca-app-pub-7439683563136300~5277822881
 * - Banner Ad Unit ID (home banner): ca-app-pub-7439683563136300/3250425347
 * - Interstitial Ad Unit ID (home_ads): ca-app-pub-7439683563136300/5434744718
 */

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  type AdLoadInfo,
  type AdMobBannerSize,
  type AdMobError,
  type AdOptions,
  type BannerAdOptions,
} from '@capacitor-community/admob';
import { VipSubscriptionState } from '../types';

export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-7439683563136300~5277822881',
  bannerAdUnitName: 'home banner',
  bannerAdUnitId: 'ca-app-pub-7439683563136300/3250425347',
  interstitialAdUnitName: 'home_ads',
  interstitialAdUnitId: 'ca-app-pub-7439683563136300/5434744718',
  frequencyCapSeconds: 120, // 2-minute frequency cap for free users
} as const;

type BannerSizeCallback = (heightDp: number) => void;

class AdMobService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private isBannerVisible = false;
  private isInterstitialLoaded = false;
  private isInterstitialLoading = false;
  private lastInterstitialTimestamp = 0;

  private listenerHandles: PluginListenerHandle[] = [];
  private bannerSizeSubscribers = new Set<BannerSizeCallback>();
  private pendingInterstitialComplete: (() => void) | null = null;

  /**
   * Checks whether the app is running inside a native Android/iOS Capacitor shell
   */
  public isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initializes the Google Mobile Ads SDK, registers Banner & Interstitial listeners,
   * and preloads the 'home_ads' interstitial ad unit.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    if (!this.isNativePlatform()) {
      this.isInitialized = true;
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: false,
      });

      // Request App Tracking Transparency on iOS 14+ (safe no-op on Android)
      try {
        const trackingStatus = await AdMob.trackingAuthorizationStatus();
        if (trackingStatus.status === 'notDetermined') {
          await AdMob.requestTrackingAuthorization();
        }
      } catch {
        // Non-blocking if ATT is unavailable on current OS
      }

      await this.registerAdListeners();
      this.isInitialized = true;

      // Preload 'home_ads' interstitial immediately so it's ready for user actions
      void this.loadInterstitialAd();
    } catch (error) {
      console.warn('[AdMob] Native initialization error:', error);
      this.isInitialized = false;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Registers native event listeners for Banner ('home banner') and Interstitial ('home_ads')
   */
  private async registerAdListeners(): Promise<void> {
    await this.clearListeners();

    const handles = await Promise.all([
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        this.isBannerVisible = true;
      }),
      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err: AdMobError) => {
        this.isBannerVisible = false;
        this.notifyBannerHeight(0);
        console.warn('[AdMob] Home banner failed to load:', err.message);
      }),
      AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: AdMobBannerSize) => {
        this.notifyBannerHeight(size.height || 0);
      }),
      AdMob.addListener(InterstitialAdPluginEvents.Loaded, (_info: AdLoadInfo) => {
        this.isInterstitialLoaded = true;
        this.isInterstitialLoading = false;
      }),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err: AdMobError) => {
        this.isInterstitialLoaded = false;
        this.isInterstitialLoading = false;
        console.warn('[AdMob] Interstitial (home_ads) failed to load:', err.message);
      }),
      AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
        this.isInterstitialLoaded = false;
        this.recordInterstitialShown();
      }),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err: AdMobError) => {
        this.isInterstitialLoaded = false;
        console.warn('[AdMob] Interstitial (home_ads) failed to show:', err.message);
        this.resolvePendingInterstitialCallback();
        void this.loadInterstitialAd();
      }),
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        this.isInterstitialLoaded = false;
        this.resolvePendingInterstitialCallback();
        // Automatically preload the next 'home_ads' interstitial
        void this.loadInterstitialAd();
      }),
    ]);

    this.listenerHandles = handles;
  }

  private resolvePendingInterstitialCallback(): void {
    if (this.pendingInterstitialComplete) {
      const callback = this.pendingInterstitialComplete;
      this.pendingInterstitialComplete = null;
      callback();
    }
  }

  private notifyBannerHeight(heightDp: number): void {
    this.bannerSizeSubscribers.forEach((cb) => cb(heightDp));
  }

  public onBannerSizeChange(callback: BannerSizeCallback): () => void {
    this.bannerSizeSubscribers.add(callback);
    return () => {
      this.bannerSizeSubscribers.delete(callback);
    };
  }

  public async clearListeners(): Promise<void> {
    for (const handle of this.listenerHandles) {
      try {
        await handle.remove();
      } catch {
        // Ignore already-removed handles
      }
    }
    this.listenerHandles = [];
  }

  // ===========================================================================
  // BANNER AD METHODS — home banner (ca-app-pub-7439683563136300/3250425347)
  // ===========================================================================

  /**
   * Loads and displays the adaptive 'home banner' AdMob Banner Ad at the bottom
   * of the screen above the navigation bar.
   */
  public async showHomeBanner(
    marginDp = 56,
    adUnitId: string = ADMOB_CONFIG.bannerAdUnitId
  ): Promise<void> {
    if (!this.isNativePlatform()) return;

    await this.initialize();

    const options: BannerAdOptions = {
      adId: adUnitId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: marginDp,
      isTesting: false,
    };

    try {
      await AdMob.showBanner(options);
      this.isBannerVisible = true;
    } catch (error) {
      console.warn('[AdMob] Failed to show home banner:', error);
    }
  }

  /**
   * Temporarily hides the active home banner without destroying it
   */
  public async hideHomeBanner(): Promise<void> {
    if (!this.isNativePlatform() || !this.isBannerVisible) return;
    try {
      await AdMob.hideBanner();
    } catch (error) {
      console.warn('[AdMob] Failed to hide home banner:', error);
    }
  }

  /**
   * Resumes a previously hidden home banner
   */
  public async resumeHomeBanner(): Promise<void> {
    if (!this.isNativePlatform()) return;
    try {
      await AdMob.resumeBanner();
      this.isBannerVisible = true;
    } catch (error) {
      console.warn('[AdMob] Failed to resume home banner:', error);
    }
  }

  /**
   * Destroys and removes the active home banner from the screen
   */
  public async removeHomeBanner(): Promise<void> {
    if (!this.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
      this.isBannerVisible = false;
      this.notifyBannerHeight(0);
    } catch {
      // Safe no-op if no banner is currently mounted
    }
  }

  // ===========================================================================
  // INTERSTITIAL AD METHODS — home_ads (ca-app-pub-7439683563136300/5434744718)
  // ===========================================================================

  /**
   * Preloads the 'home_ads' Interstitial Ad Unit
   */
  public async loadInterstitialAd(
    adUnitId: string = ADMOB_CONFIG.interstitialAdUnitId
  ): Promise<boolean> {
    if (!this.isNativePlatform()) {
      this.isInterstitialLoaded = true;
      return true;
    }

    if (this.isInterstitialLoaded || this.isInterstitialLoading) {
      return this.isInterstitialLoaded;
    }

    await this.initialize();
    this.isInterstitialLoading = true;

    const options: AdOptions = {
      adId: adUnitId,
      isTesting: false,
      immersiveMode: true,
    };

    try {
      await AdMob.prepareInterstitial(options);
      this.isInterstitialLoaded = true;
      return true;
    } catch (error) {
      this.isInterstitialLoaded = false;
      console.warn('[AdMob] Failed to prepare interstitial (home_ads):', error);
      return false;
    } finally {
      this.isInterstitialLoading = false;
    }
  }

  /**
   * Alias retained for backwards compatibility
   */
  public prepareInterstitial(): void {
    void this.loadInterstitialAd();
  }

  /**
   * Displays the loaded 'home_ads' Interstitial Ad and invokes `onComplete`
   * once dismissed (or immediately if no ad fill is available).
   */
  public async showInterstitialAd(
    onComplete?: () => void,
    adUnitId: string = ADMOB_CONFIG.interstitialAdUnitId
  ): Promise<boolean> {
    if (!this.isNativePlatform()) {
      onComplete?.();
      return false;
    }

    await this.initialize();

    if (!this.isInterstitialLoaded) {
      const loaded = await this.loadInterstitialAd(adUnitId);
      if (!loaded) {
        onComplete?.();
        return false;
      }
    }

    try {
      this.pendingInterstitialComplete = onComplete || null;
      await AdMob.showInterstitial({ adId: adUnitId });
      this.recordInterstitialShown();
      return true;
    } catch (error) {
      console.warn('[AdMob] Error displaying interstitial (home_ads):', error);
      this.pendingInterstitialComplete = null;
      onComplete?.();
      void this.loadInterstitialAd(adUnitId);
      return false;
    }
  }

  // ===========================================================================
  // FREQUENCY CAPPING & VIP MONETIZATION HELPERS
  // ===========================================================================

  public getIsReady(): boolean {
    return this.isInitialized;
  }

  public canShowInterstitial(isVip: boolean): boolean {
    if (isVip) return false;
    const elapsedSeconds = (Date.now() - this.lastInterstitialTimestamp) / 1000;
    return elapsedSeconds >= ADMOB_CONFIG.frequencyCapSeconds;
  }

  public recordInterstitialShown(): void {
    this.lastInterstitialTimestamp = Date.now();
  }

  public getRemainingCooldownSeconds(): number {
    const elapsed = (Date.now() - this.lastInterstitialTimestamp) / 1000;
    return Math.max(0, Math.ceil(ADMOB_CONFIG.frequencyCapSeconds - elapsed));
  }

  /**
   * Triggers native Google AdMob Interstitial ('home_ads') on Android/iOS for free users
   * outside the 2-minute frequency cap, or uses the web modal fallback in browsers.
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
    if (user.isVipUser) {
      onProceedDirectly();
      return;
    }

    const allowedByCooldown = this.canShowInterstitial(false);
    if (!forceSkipCooldown && !allowedByCooldown) {
      onProceedDirectly();
      return;
    }

    // Native Android / iOS Capacitor runtime: show real AdMob Interstitial ('home_ads')
    if (this.isNativePlatform()) {
      void this.showInterstitialAd(onProceedDirectly, ADMOB_CONFIG.interstitialAdUnitId);
      return;
    }

    // Web preview fallback
    this.recordInterstitialShown();
    onShowInterstitial();
  }

  public triggerInterstitial(onComplete: () => void): void {
    void this.showInterstitialAd(onComplete, ADMOB_CONFIG.interstitialAdUnitId);
  }
}

export const admobService = new AdMobService();
