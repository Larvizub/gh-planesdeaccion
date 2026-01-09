import { useState, useEffect, useMemo } from 'react';
import { auth, getDbForRecinto } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, set, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';
import { AppContext } from './AppContext';
import type { UserData } from './AppContext';

const idDataMap: Record<string, number> = {
  'CCCR': 14,
  'CCCI': 15, // Ejemplo
  'CEVP': 16  // Ejemplo
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recinto, setRecinto] = useState<string | null>(localStorage.getItem('selected_recinto'));

  const currentDb = useMemo(() => {
    return getDbForRecinto(recinto || 'CCCR');
  }, [recinto]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (!authUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      if (recinto) {
        const userRef = ref(currentDb, `users/${recinto}/${authUser.uid}`);
        
        // Primera carga y creación si no existe
        const snapshot = await get(userRef);
        if (!snapshot.exists()) {
          const newUserData: UserData = {
            uid: authUser.uid,
            email: authUser.email || '',
            displayName: authUser.displayName || '',
            role: 'Usuario',
            recinto: recinto
          };
          await set(userRef, newUserData);
        }

        // Suscribirse a cambios en tiempo real del usuario
        const unsubscribeUser = onValue(userRef, (snip) => {
          if (snip.exists()) {
            setUserData(snip.val());
          }
          setLoading(false);
        });

        return () => unsubscribeUser();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [recinto, currentDb]);

  const handleSetRecinto = (newRecinto: string) => {
    setRecinto(newRecinto);
    localStorage.setItem('selected_recinto', newRecinto);
  };

  const value = {
    user,
    userData,
    loading,
    recinto,
    db: currentDb,
    setRecinto: handleSetRecinto,
    idData: recinto ? idDataMap[recinto] || 14 : 14,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

