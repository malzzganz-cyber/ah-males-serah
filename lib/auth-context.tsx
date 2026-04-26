'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserData {
  uid: string;
  email: string | null;
  balance: number;
  photoURL?: string | null;
  createdAt?: any;
}

interface Ctx {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Ctx>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUid, setAdminUid] = useState<string>('');

  useEffect(() => {
    // Admin UID is exposed at runtime via /api/admin-uid
    fetch('/api/admin-uid')
      .then((r) => r.json())
      .then((d) => setAdminUid(d.uid || ''))
      .catch(() => setAdminUid(''));
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserData({ uid: user.uid, ...(snap.data() as any) });
      } else {
        setUserData({ uid: user.uid, email: user.email, balance: 0 });
      }
    });
    return () => unsub();
  }, [user]);

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const isAdmin = !!user && !!adminUid && user.uid === adminUid;

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
