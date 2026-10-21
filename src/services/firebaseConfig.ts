import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase Client Configuration for GharKaExpert
 * 
 * Powered by Firebase Phone Authentication for 6-Digit SMS OTP
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA8_GharKaExpertPhoneAuthKey_Demo2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gharkaexpert-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gharkaexpert-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gharkaexpert-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '800366909295',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:800366909295:web:gharkaexpertphoneauth',
};

// Singleton App & Auth instances
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);
