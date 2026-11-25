import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { UserProfile } from '../types/attendance';
import {
  createDemoUserProfile,
  hashEmailToId,
  sanitizeUserProfile,
  STORAGE_KEYS,
} from '../utils/storage';

interface LocalUserAccount {
  profile: UserProfile;
  password?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isCloudMode: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (
    email: string,
    password: string,
    displayName: string,
    collegeName?: string
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>;
  loginAsDemoStudent: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadLocalUsersDb(): Record<string, LocalUserAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalUsersDb(db: Record<string, LocalUserAccount>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors
  }
}

function persistCurrentUser(profile: UserProfile | null): void {
  try {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
      localStorage.removeItem(STORAGE_KEYS.LOGGED_OUT);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.setItem(STORAGE_KEYS.LOGGED_OUT, '1');
    }
  } catch {
    // Ignore
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && active) {
            const meta = session.user.user_metadata || {};
            const cloudProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              display_name:
                meta.display_name || session.user.email?.split('@')[0] || 'Student',
              college_name: meta.college_name || undefined,
              default_min_attendance: Number(meta.default_min_attendance) || 75,
              preferred_theme: meta.preferred_theme || 'system',
              created_at: session.user.created_at || new Date().toISOString(),
            };
            setUser(cloudProfile);
            setLoading(false);
            return;
          }
        } catch {
          // Fall back to local initialization below
        }
      }

      // Local mode or no active cloud session
      try {
        const loggedOut = localStorage.getItem(STORAGE_KEYS.LOGGED_OUT) === '1';
        const rawSaved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        const savedUser = rawSaved ? sanitizeUserProfile(JSON.parse(rawSaved)) : null;

        if (savedUser) {
          if (active) setUser(savedUser);
        } else if (!loggedOut) {
          // Auto-sign in on first visit as Demo Student so users never hit an empty/blocked screen
          const demo = createDemoUserProfile();
          persistCurrentUser(demo);
          if (active) setUser(demo);
        }
      } catch {
        const demo = createDemoUserProfile();
        persistCurrentUser(demo);
        if (active) setUser(demo);
      } finally {
        if (active) setLoading(false);
      }
    }

    initAuth();

    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const cloudProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            display_name:
              meta.display_name || session.user.email?.split('@')[0] || 'Student',
            college_name: meta.college_name || undefined,
            default_min_attendance: Number(meta.default_min_attendance) || 75,
            preferred_theme: meta.preferred_theme || 'system',
            created_at: session.user.created_at || new Date().toISOString(),
          };
          setUser(cloudProfile);
        }
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const meta = data.user.user_metadata || {};
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          display_name: meta.display_name || cleanEmail.split('@')[0] || 'Student',
          college_name: meta.college_name || undefined,
          default_min_attendance: Number(meta.default_min_attendance) || 75,
          preferred_theme: meta.preferred_theme || 'system',
          created_at: data.user.created_at || new Date().toISOString(),
        };
        setUser(profile);
        persistCurrentUser(profile);
        return { success: true };
      }
    }

    // Local mode deterministic email-based account lookup/creation
    const db = loadLocalUsersDb();
    const existing = db[cleanEmail];
    if (existing) {
      if (existing.password && existing.password !== password) {
        return { success: false, error: 'Incorrect password for this local account.' };
      }
      const sanitized = sanitizeUserProfile(existing.profile) || createDemoUserProfile();
      setUser(sanitized);
      persistCurrentUser(sanitized);
      return { success: true };
    }

    const id = hashEmailToId(cleanEmail);
    const newProfile: UserProfile = {
      id,
      email: cleanEmail,
      display_name: cleanEmail.split('@')[0] || 'Student',
      college_name: 'National Institute of Technology',
      default_min_attendance: 75,
      preferred_theme: 'system',
      created_at: new Date().toISOString(),
    };
    db[cleanEmail] = { profile: newProfile, password };
    saveLocalUsersDb(db);
    setUser(newProfile);
    persistCurrentUser(newProfile);
    return { success: true };
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    collegeName?: string
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || !displayName.trim()) {
      return { success: false, error: 'Please fill in all required fields.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            college_name: collegeName?.trim() || undefined,
            default_min_attendance: 75,
            preferred_theme: 'system',
          },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          display_name: displayName.trim(),
          college_name: collegeName?.trim() || undefined,
          default_min_attendance: 75,
          preferred_theme: 'system',
          created_at: data.user.created_at || new Date().toISOString(),
        };
        setUser(profile);
        persistCurrentUser(profile);
        return { success: true };
      }
    }

    const db = loadLocalUsersDb();
    if (db[cleanEmail]) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newProfile: UserProfile = {
      id: hashEmailToId(cleanEmail),
      email: cleanEmail,
      display_name: displayName.trim(),
      college_name: collegeName?.trim() || undefined,
      default_min_attendance: 75,
      preferred_theme: 'system',
      created_at: new Date().toISOString(),
    };
    db[cleanEmail] = { profile: newProfile, password };
    saveLocalUsersDb(db);
    setUser(newProfile);
    persistCurrentUser(newProfile);
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
    }
    setUser(null);
    persistCurrentUser(null);
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    // Local mode feedback
    return { success: true };
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<AuthResult> => {
    if (!user) return { success: false, error: 'No active user session.' };
    const merged: UserProfile = {
      ...user,
      ...updates,
      id: user.id,
      email: user.email,
    };
    const sanitized = sanitizeUserProfile(merged);
    if (!sanitized) return { success: false, error: 'Invalid profile values.' };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            display_name: sanitized.display_name,
            college_name: sanitized.college_name,
            default_min_attendance: sanitized.default_min_attendance,
            preferred_theme: sanitized.preferred_theme,
          },
        });
        if (error) return { success: false, error: error.message };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to update cloud profile.',
        };
      }
    }

    const db = loadLocalUsersDb();
    const key = sanitized.email.toLowerCase();
    if (db[key]) {
      db[key] = { ...db[key], profile: sanitized };
      saveLocalUsersDb(db);
    }

    setUser(sanitized);
    persistCurrentUser(sanitized);
    return { success: true };
  };

  const loginAsDemoStudent = () => {
    const rawSaved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const saved = rawSaved ? sanitizeUserProfile(JSON.parse(rawSaved)) : null;
    const demo =
      saved && saved.id === createDemoUserProfile().id ? saved : createDemoUserProfile();
    setUser(demo);
    persistCurrentUser(demo);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isCloudMode: isSupabaseConfigured,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile,
        loginAsDemoStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
