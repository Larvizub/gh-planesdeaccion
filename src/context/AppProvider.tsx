import { useState, useEffect, useMemo } from 'react';
import { auth, getDbForRecinto } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';
import { AppContext } from './AppContext';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recinto, setRecinto] = useState<string | null>(localStorage.getItem('selected_recinto'));

  const currentDb = useMemo(() => {
    return getDbForRecinto(recinto || 'CCCR');
  }, [recinto]);

  const idDataMap: Record<string, number> = {
    'CCCR': 14,
    'CCCI': 15, 
    'CEVP': 16, 
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSetRecinto = (newRecinto: string) => {
    setRecinto(newRecinto);
    localStorage.setItem('selected_recinto', newRecinto);
  };

  const value = {
    user,
    loading,
    recinto,
    db: currentDb,
    setRecinto: handleSetRecinto,
    idData: recinto ? idDataMap[recinto] || 14 : 14,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

