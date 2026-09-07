import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  formatAuthError: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function formatAuthError(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan gunakan tab Masuk atau reset kata sandi.';
    case 'auth/invalid-email':
      return 'Format email tidak valid. Harap masukkan alamat email yang benar.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu pendek. Masukkan minimal 6 karakter.';
    case 'auth/popup-closed-by-user':
      return 'Jendela masuk Google ditutup sebelum proses selesai. Silakan coba kembali.';
    case 'auth/popup-blocked':
      return 'Peramban memblokir jendela popup masuk Google. Izinkan popup untuk situs ini lalu coba lagi.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat atau atur ulang kata sandi.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.';
    default:
      if (message.includes('popup')) {
        return 'Jendela popup masuk dibatalkan atau ditutup.';
      }
      return message || 'Terjadi kendala autentikasi. Silakan coba lagi.';
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync profile to Firestore asynchronously
        syncUserProfile(currentUser).catch((err) => {
          console.warn('Sync profile warning:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (result.user && name && name.trim()) {
        await updateProfile(result.user, {
          displayName: name.trim(),
        });
      }
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: Boolean(user),
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        formatAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
