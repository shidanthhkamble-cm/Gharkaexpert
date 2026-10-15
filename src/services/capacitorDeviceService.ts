import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Service to manage native device camera capture via @capacitor/camera
 * with fallback to web browser file/camera inputs.
 */
export const deviceCameraService = {
  /**
   * Captures an image using the native camera or photo library.
   * Returns a base64 or data URL string.
   */
  async capturePhoto(source: CameraSource = CameraSource.Prompt): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    try {
      // Check permissions or request if supported
      try {
        const check = await Camera.checkPermissions();
        if (check.camera !== 'granted') {
          await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        }
      } catch {
        // Ignore permission check errors on web browsers
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
        correctOrientation: true,
        saveToGallery: false,
        promptLabelHeader: 'Aadhaar Document Photo',
        promptLabelPhoto: 'Choose from Gallery / Files',
        promptLabelPicture: 'Take Live Camera Photo',
      });

      if (photo.dataUrl) {
        return { success: true, dataUrl: photo.dataUrl };
      }
      return { success: false, error: 'No image data returned.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Camera dismissed or unavailable.';
      return { success: false, error: message };
    }
  },

  /**
   * Specifically take a live photo via device camera
   */
  async takeCameraPhoto(): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    return this.capturePhoto(CameraSource.Camera);
  },

  /**
   * Choose an image from device gallery / files
   */
  async pickGalleryPhoto(): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    return this.capturePhoto(CameraSource.Photos);
  },
};

/**
 * Service to manage native GPS location via @capacitor/geolocation
 * with fallback to web navigator.geolocation.
 */
export const deviceLocationService = {
  /**
   * Retrieves high-accuracy latitude & longitude from device GPS.
   */
  async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: 'capacitor_gps' | 'browser_gps' | 'default_fallback';
  }> {
    // 1. Try Capacitor Geolocation Native API
    try {
      try {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          await Geolocation.requestPermissions({ permissions: ['location'] });
        }
      } catch {
        // On web capacitor can throw or silently continue
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
      // Proceed to browser fallback
    }

    // 2. Fallback to standard browser navigator.geolocation
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
        // Fallback default
      }
    }

    // 3. Fallback default (e.g. Central Delhi / Connaught Place)
    return {
      latitude: 28.6315,
      longitude: 77.2167,
      source: 'default_fallback',
    };
  },
};
