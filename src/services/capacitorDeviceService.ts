import { Capacitor } from '@capacitor/core';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export interface CameraCaptureResult {
  success: boolean;
  dataUrl?: string;
  cancelled?: boolean;
  error?: string;
}

/**
 * Native & Hybrid Camera Service powered by @capacitor/camera
 * Configured for Aadhaar KYC Document Capture, Live Karigar Selfie, and Portfolio Photos.
 */
export const deviceCameraService = {
  /**
   * Ensures runtime camera & photo library permissions are granted on native Android/iOS
   */
  async ensurePermissions(source: CameraSource): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const current = await Camera.checkPermissions();
    const needsCamera =
      (source === CameraSource.Camera || source === CameraSource.Prompt) &&
      current.camera !== 'granted';
    const needsPhotos =
      (source === CameraSource.Photos || source === CameraSource.Prompt) &&
      current.photos !== 'granted' &&
      current.photos !== 'limited';

    if (needsCamera || needsPhotos) {
      const requested = await Camera.requestPermissions({
        permissions: needsCamera && needsPhotos ? ['camera', 'photos'] : needsCamera ? ['camera'] : ['photos'],
      });

      if (source === CameraSource.Camera && requested.camera === 'denied') {
        throw new Error('Camera permission was denied. Please enable Camera access in your phone Settings.');
      }
      if (source === CameraSource.Photos && requested.photos === 'denied') {
        throw new Error('Photo library permission was denied. Please enable Photos access in your phone Settings.');
      }
    }
  },

  /**
   * Core Capacitor Camera capture method
   */
  async capturePhoto(
    source: CameraSource = CameraSource.Camera,
    direction: CameraDirection = CameraDirection.Rear,
    headerLabel = 'Capture Photo'
  ): Promise<CameraCaptureResult> {
    try {
      await this.ensurePermissions(source);

      const photo = await Camera.getPhoto({
        quality: 88,
        width: 1280,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
        direction,
        correctOrientation: true,
        saveToGallery: false,
        webUseInput: false,
        promptLabelHeader: headerLabel,
        promptLabelPicture: 'Open Smartphone Camera',
        promptLabelPhoto: 'Select from Gallery',
      });

      if (photo.dataUrl) {
        return { success: true, dataUrl: photo.dataUrl };
      }

      return { success: false, error: 'No photo data returned from camera.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (
        lower.includes('cancel') ||
        lower.includes('dismiss') ||
        lower.includes('user cancelled')
      ) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: msg || 'Unable to access smartphone camera.' };
    }
  },

  /**
   * Directly launches the Rear Camera for Aadhaar Front/Back KYC cards and site work photos
   */
  async captureDocumentPhoto(label = 'Aadhaar KYC Document'): Promise<CameraCaptureResult> {
    return this.capturePhoto(CameraSource.Camera, CameraDirection.Rear, label);
  },

  /**
   * Directly launches the Front Camera for Worker Live Profile Selfie
   */
  async captureSelfiePhoto(): Promise<CameraCaptureResult> {
    return this.capturePhoto(CameraSource.Camera, CameraDirection.Front, 'Profile Selfie');
  },

  /**
   * Launches rear camera by default
   */
  async takeCameraPhoto(): Promise<CameraCaptureResult> {
    return this.capturePhoto(CameraSource.Camera, CameraDirection.Rear, 'Take Photo');
  },

  /**
   * Opens the smartphone photo gallery / media picker
   */
  async pickGalleryPhoto(label = 'Select Photo'): Promise<CameraCaptureResult> {
    return this.capturePhoto(CameraSource.Photos, CameraDirection.Rear, label);
  },
};

/**
 * Native GPS Location Service via @capacitor/geolocation
 */
export const deviceLocationService = {
  async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: 'capacitor_gps' | 'browser_gps' | 'default_fallback';
  }> {
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          await Geolocation.requestPermissions({ permissions: ['location'] });
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5000,
      });

      if (position?.coords?.latitude && position?.coords?.longitude) {
        return {
          latitude: +position.coords.latitude.toFixed(6),
          longitude: +position.coords.longitude.toFixed(6),
          accuracy: position.coords.accuracy,
          source: 'capacitor_gps',
        };
      }
    } catch {
      // Fallback to browser geolocation
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const browserPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 5000,
          });
        });

        return {
          latitude: +browserPos.coords.latitude.toFixed(6),
          longitude: +browserPos.coords.longitude.toFixed(6),
          accuracy: browserPos.coords.accuracy,
          source: 'browser_gps',
        };
      } catch {
        // Fallback default coordinates
      }
    }

    return {
      latitude: 19.076,
      longitude: 72.8777,
      source: 'default_fallback',
    };
  },
};
