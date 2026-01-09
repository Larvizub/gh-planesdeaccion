import { initializeApp } from "firebase/app";
import { getAuth, OAuthProvider } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const DB_URLS: Record<string, string> = {
  'CCCR': import.meta.env.VITE_DATABASE_URL_CCCR,
  'CCCI': import.meta.env.VITE_DATABASE_URL_CCCI,
  'CEVP': import.meta.env.VITE_DATABASE_URL_CEVP,
};

export const DOMAIN_RESTRICTIONS: Record<string, string[]> = {
  'CCCR': ['@grupoheroica.com', '@costaricacc.com'],
  'CCCI': ['@grupoheroica.com', '@cccartagena.com'],
  'CEVP': ['@grupoheroica.com', '@valledelpacifico.co'],
};

// Caché para las instancias de la base de datos
const dbCache: Record<string, Database> = {};

export const getDbForRecinto = (recinto: string): Database => {
  const url = DB_URLS[recinto] || DB_URLS['CCCR'];
  
  if (!dbCache[url]) {
    // Si la URL es la misma que la predeterminada en la config, usamos getDatabase(app)
    if (url === firebaseConfig.databaseURL) {
      dbCache[url] = getDatabase(app);
    } else {
      dbCache[url] = getDatabase(app, url);
    }
  }
  
  return dbCache[url];
};

export const functions = getFunctions(app);
export const storage = getStorage(app);
export const microsoftProvider = new OAuthProvider('microsoft.com');

microsoftProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: 'common' // Adjust if specific tenant is needed
});

export default app;
