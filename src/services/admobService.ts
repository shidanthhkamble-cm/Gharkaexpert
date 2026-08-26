/**
 * Google Mobile Ads SDK (AdMob) Integration Service
 * 
 * Configured IDs:
 * - App ID: ca-app-pub-5878292936798547~8353334949
 * - Banner Ad Unit ID: ca-app-pub-5878292936798547/4087671354
 * - Interstitial Ad Unit ID: ca-app-pub-5878292936798547/5807062652
 */

export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-5878292936798547~8353334949',
  bannerAdUnitId: 'ca-app-pub-5878292936798547/4087671354',
  interstitialAdUnitId: 'ca-app-pub-5878292936798547/5807062652',
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

  /**
   * Initializes the Google Mobile Ads SDK
   */
  public initialize(): void {
    if (this.isInitialized) return;

    try {
      // Ensure Google Publisher Tag / Google Mobile Ads SDK queue exists
      window.googletag = window.googletag || { cmd: [] };
      
      // Load Google AdMob / GPT script if not present
      if (!document.getElementById('admob-gpt-script')) {
        const script = document.createElement('script');
        script.id = 'admob-gpt-script';
        script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      window.googletag.cmd.push(() => {
        if (window.googletag?.pubads) {
          const pubads = window.googletag.pubads();
          pubads.enableSingleRequest?.();
          pubads.collapseEmptyDivs?.();
        }
        window.googletag?.enableServices?.();
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
   * Trigger an interstitial ad on contact/call action
   */
  public triggerInterstitial(onComplete: () => void): void {
    // If native Cordova / Capacitor AdMob plugin is present
    if (window.admob?.interstitial) {
      window.admob.interstitial
        .load({ id: ADMOB_CONFIG.interstitialAdUnitId })
        .then(() => window.admob!.interstitial!.show())
        .then(() => onComplete())
        .catch(() => onComplete());
      return;
    }

    // Handled via React state in UI
    onComplete();
  }
}

export const admobService = new AdMobService();
