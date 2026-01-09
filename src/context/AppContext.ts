import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { Database } from 'firebase/database';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'Usuario' | 'Administrador' | 'Calidad';
  departmentId?: string;
  departmentName?: string;
  recinto: string;
}

export interface AppContextType {
  user: User | null;
  userData: UserData | null;
  permissions: { [key: string]: boolean } | null;
  loading: boolean;
  recinto: string | null;
  setRecinto: (recinto: string) => void;
  idData: number | null;
  db: Database;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
