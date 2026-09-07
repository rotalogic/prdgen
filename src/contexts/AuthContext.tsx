import React, { createContext, useContext, ReactNode } from 'react';
import { authClient, useSession } from '../lib/auth-client';

// Compatibility shape kept identical to what the rest of the app already
// reads (uid/displayName/photoURL), so Header/HeroView/Modals/App.tsx don't
// need to change just because the auth provider underneath changed.
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  providerData: { providerId: string }[];
}

interface AuthContextType {
  user: AppUser | null;
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
  const status = error?.status;
  const message: string = error?.message || '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid email or password') || lower.includes('invalid credentials') || status === 401) {
    return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
  }
  if (lower.includes('already exist') || lower.includes('already registered') || lower.includes('already in use')) {
    return 'Email ini sudah terdaftar. Silakan gunakan tab Masuk atau reset kata sandi.';
  }
  if (lower.includes('password') && (lower.includes('short') || lower.includes('length'))) {
    return 'Kata sandi terlalu pendek. Masukkan minimal 6 karakter.';
  }
  if (lower.includes('invalid email') || lower.includes('email is invalid')) {
    return 'Format email tidak valid. Harap masukkan alamat email yang benar.';
  }
  if (lower.includes('google') && (lower.includes('not') || lower.includes('provider'))) {
    return 'Google sign-in belum dikonfigurasi. Gunakan email dan kata sandi untuk saat ini.';
  }
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
  }
  if (status === 429) {
    return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lalu coba lagi.';
  }
  if (status === 503 || status >= 500) {
    return 'Server autentikasi sedang tidak bisa diakses. Coba lagi dalam beberapa saat.';
  }

  return message || 'Terjadi kendala autentikasi. Silakan coba lagi.';
}

function toAppUser(sessionUser: any): AppUser | null {
  if (!sessionUser) return null;
  return {
    uid: sessionUser.id,
    email: sessionUser.email || '',
    displayName: sessionUser.name || (sessionUser.email ? sessionUser.email.split('@')[0] : 'User'),
    photoURL: sessionUser.image || '',
    // Google isn't wired in yet — every account here is email/password.
    providerData: [{ providerId: 'password' }],
  };
}

// Better Auth's client infers session/user shape generically from the base
// options type, which doesn't resolve concretely without wiring the server
// auth type through the whole build — more plumbing than this app needs, so
// we type just the fields we actually read.
type SessionUser = { id: string; email?: string | null; name?: string | null; image?: string | null };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, isPending } = useSession() as unknown as {
    data: { user: SessionUser } | null;
    isPending: boolean;
  };
  const user = toAppUser(session?.user);

  const loginWithGoogle = async () => {
    const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: window.location.href });
    if (error) throw error;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const { error } = await authClient.signIn.email({ email: email.trim(), password: pass });
    if (error) throw error;
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    const cleanEmail = email.trim();
    const { error } = await authClient.signUp.email({
      email: cleanEmail,
      password: pass,
      name: name && name.trim() ? name.trim() : cleanEmail.split('@')[0],
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/`,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await authClient.signOut({});
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isPending,
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
