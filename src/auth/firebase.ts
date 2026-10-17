import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, FacebookAuthProvider, getAuth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
}

export const firebaseAuth = auth;
export const facebookProvider = new FacebookAuthProvider();
export const adminFacebookUid = import.meta.env.VITE_ADMIN_FACEBOOK_UID || '';
export const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';

export function isConfiguredAdmin(uid?: string | null, email?: string | null): boolean {
  if (!uid && !email) return false;
  return Boolean((uid && adminFacebookUid && uid === adminFacebookUid) || (email && adminEmail && email.toLowerCase() === adminEmail.toLowerCase()));
}
