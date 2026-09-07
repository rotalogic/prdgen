import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with the provisioned database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Helper: Sync / create user profile document in Firestore
export async function syncUserProfile(user: User) {
  if (!user || !user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
      photoURL: user.photoURL || '',
      providerId: user.providerData?.[0]?.providerId || 'password',
      lastLoginAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('[firebase] Could not sync user profile to Firestore:', error);
  }
}

// Helper: Save a PRD draft to Firestore
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

export { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged 
};
