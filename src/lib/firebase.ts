import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Firebase is used only for Firestore draft storage now — auth moved to
// Better Auth (see src/lib/auth.ts and src/contexts/AuthContext.tsx).
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore with the provisioned database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper: Save a PRD draft to Firestore, keyed by the Better Auth user id
export async function saveDraftToCloud(userId: string, draftData: any) {
  if (!userId) throw new Error('User must be logged in to save draft to cloud');
  try {
    const draftRef = doc(db, 'drafts', `draft_${userId}`);
    await setDoc(draftRef, {
      userId,
      ...draftData,
      updatedAt: new Date().toISOString(),
      savedAtServer: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[firebase] Could not save draft to cloud:', error);
    throw error;
  }
}

// Helper: Load a user's PRD draft from Firestore
export async function loadDraftFromCloud(userId: string) {
  if (!userId) return null;
  try {
    const draftRef = doc(db, 'drafts', `draft_${userId}`);
    const snap = await getDoc(draftRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.warn('[firebase] Could not load draft from cloud:', error);
    return null;
  }
}
