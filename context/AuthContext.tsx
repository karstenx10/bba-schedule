'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, addDoc, collection } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

const ADMIN_EMAILS = ['kolsen29@burrburton.org', 'ebuikema29@burrburton.org', 'mwohlleber29@burrburton.org'];

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  grade: string;
  createdAt?: unknown;
  isAdmin?: boolean;
  isBanned?: boolean;
  timeoutUntil?: { toDate: () => Date } | null;
  forceLogout?: boolean;
  dismissedAnnouncements?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let profileUnsub: () => void;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const ref = doc(db, 'users', u.uid);
        
        // Ensure profile exists first
        const snap = await getDoc(ref);
        const isNewUser = !snap.exists();
        if (isNewUser) {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email ?? '',
            displayName: u.displayName ?? '',
            photoURL: u.photoURL ?? '',
            grade: '',
            createdAt: serverTimestamp(),
          };
          await setDoc(ref, newProfile);
        }

        // Check if we already logged this session
        const sessionKey = `logged_${u.uid}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, 'true');
          await addDoc(collection(db, 'logs'), {
            uid: u.uid,
            displayName: u.displayName ?? 'Student',
            email: u.email ?? '',
            type: isNewUser ? 'join' : 'login',
            timestamp: serverTimestamp()
          }).catch(console.error);
        }

        // Listen for real-time moderation updates
        profileUnsub = onSnapshot(ref, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // Moderation checks
            let shouldLogout = false;
            let logoutReason = '';

            if (data.isBanned) {
              shouldLogout = true;
              logoutReason = 'Your account has been banned.';
            } else if (data.timeoutUntil && data.timeoutUntil.toDate() > new Date()) {
              shouldLogout = true;
              logoutReason = `Your account is temporarily suspended until ${data.timeoutUntil.toDate().toLocaleString()}.`;
            } else if (data.forceLogout) {
              shouldLogout = true;
              logoutReason = 'You have been kicked by an admin.';
              await updateDoc(ref, { forceLogout: false });
            }

            if (shouldLogout) {
              await firebaseSignOut(auth);
              setError(logoutReason);
              return;
            }

            setProfile(data);
            setIsAdmin(ADMIN_EMAILS.includes(data.email ?? ''));
          }
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        if (profileUnsub) profileUnsub();
      }
      setLoading(false);
    });
    return () => {
      unsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    // Update immediately
    updateDoc(ref, { lastActive: serverTimestamp() }).catch(console.error);

    // Update every 3 minutes
    const interval = setInterval(() => {
      updateDoc(ref, { lastActive: serverTimestamp() }).catch(console.error);
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const signIn = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email ?? '';
      if (!email.endsWith('@burrburton.org')) {
        await firebaseSignOut(auth);
        setError('Only @burrburton.org accounts are allowed.');
      }
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error(err);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
