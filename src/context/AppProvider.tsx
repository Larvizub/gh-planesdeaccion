import { useState, useEffect, useMemo } from 'react';
import { auth, getDbForRecinto } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, set, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';
import { AppContext } from './AppContext';
import type { UserData } from './AppContext';

const idDataMap: Record<string, number> = {
  'CCCR': 14, // Costa Rica Convention Center
  // 'CCCI': 15, // Pendiente confirmar ID para CCCI
  // 'CEVP': 16, // Pendiente confirmar ID para CEVP
};

const DEFAULT_PERMISSIONS: Record<string, { [key: string]: boolean }> = {
  Usuario: { dashboard: true, eventos: true, planes: true, reportes: true, resultados: true, perfil: true },
  Calidad: { dashboard: true, eventos: true, planes: true, reportes: true, aprobaciones: true, resultados: true, departamentos: true, tiempos: true, perfil: true },
  Administrador: { dashboard: true, eventos: true, planes: true, reportes: true, aprobaciones: true, resultados: true, usuarios: true, departamentos: true, roles: true, tiempos: true, perfil: true },
  // Fallbacks para compatibilidad
  'Normal': { dashboard: true, eventos: true, planes: true, reportes: true, resultados: true, perfil: true },
  'Admin': { dashboard: true, eventos: true, planes: true, reportes: true, aprobaciones: true, resultados: true, usuarios: true, departamentos: true, roles: true, tiempos: true, perfil: true }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [permissions, setPermissions] = useState<{ [key: string]: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recinto, setRecinto] = useState<string | null>(localStorage.getItem('selected_recinto'));

  const currentDb = useMemo(() => {
    return getDbForRecinto(recinto || 'CCCR');
  }, [recinto]);

  // Manejar autenticación y datos básicos del usuario
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setUserData(null);
        setPermissions(null);
        setLoading(false);
      } else if (!recinto) {
        setPermissions(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [recinto]);

  // Manejar datos de la base de datos cuando hay usuario y recinto
  useEffect(() => {
    if (!user || !recinto) {
      return;
    }

    const userRef = ref(currentDb, `users/${recinto}/${user.uid}`);
    
    const unsubscribeUser = onValue(userRef, async (snip) => {
      if (snip.exists()) {
        const data = snip.val() as UserData;
        setUserData(data);
      } else {
        // Crear usuario si no existe
        const newUserData: UserData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'Usuario',
          recinto: recinto
        };
        await set(userRef, newUserData);
      }
    });

    return () => unsubscribeUser();
  }, [user, recinto, currentDb]);

  // Manejar permisos cuando el rol del usuario cambia
  const userRole = userData?.role;
  useEffect(() => {
    if (!userRole || !recinto) return;

    const rolesRef = ref(currentDb, `config/${recinto}/permisos/${userRole}`);
    const unsubscribePerms = onValue(rolesRef, (permSnip) => {
      const dbPermissions = permSnip.val();
      setPermissions(dbPermissions || DEFAULT_PERMISSIONS[userRole] || {});
      setLoading(false);
    });

    return () => unsubscribePerms();
  }, [userRole, recinto, currentDb]);

  const handleSetRecinto = (newRecinto: string) => {
    setRecinto(newRecinto);
    localStorage.setItem('selected_recinto', newRecinto);
  };

  const value = {
    user,
    userData,
    permissions,
    loading,
    recinto,
    db: currentDb,
    setRecinto: handleSetRecinto,
    idData: recinto ? idDataMap[recinto] || null : null,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

